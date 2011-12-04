from django.http import HttpResponseRedirect, HttpResponseBadRequest, HttpResponseNotFound, HttpResponseForbidden, Http404, HttpResponseNotModified, HttpResponse
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.contrib.auth.views import logout
from django.core.exceptions import ObjectDoesNotExist
from django.core.paginator import Paginator, InvalidPage, EmptyPage, PageNotAnInteger
from django.contrib.auth import REDIRECT_FIELD_NAME
from django.core.urlresolvers import reverse
from django.conf import settings

from kikinvideo.api.views import do_add
from kikinvideo.api.models import Video, User, UserVideo, UserTask, DismissedUserSuggestions

from social_auth.utils import sanitize_redirect
from social_auth.backends.facebook import FACEBOOK_AUTHORIZATION_URL

from celery import states

from urllib import urlencode
from datetime import datetime

import logging
logger = logging.getLogger('kikinvideo')

ACCESS_FORBIDDEN_MESSAGE = "you are not authorized to access the content you have requested"
MALFORMED_URL_MESSAGE = 'Error: malformed URL supplied to host'
PEOPLE_YOU_MAY_KNOW_SIZE = 3
POPULAR_USERS_SIZE = 2
INVITE_LIST_SIZE = 5

# num of users to display in each
#"this video liked by..." dropdown
_VID_LIKED_BY_PAGINATION_THRESHOLD = 1


def welcome(request):
    if request.user.is_authenticated():
        logger.info('Wohoo! New user registered:%s (campaign=%s)' % (request.user.username, request.GET.get('campaign')))

        # Used to track new user conversion in Google Analytics
        request.session['is_new_user'] = True

        # For new users, grab campaign parameter and store in database
        try:
            request.user.campaign = request.GET['campaign']
            request.user.save()
        except KeyError:
            pass

        # If user converted from a YouTube pitch, add video to save queue
        try:
            if request.GET['action'] == 'save':
                do_add(request.user, request.GET['url'], host=request.GET['url'])
                request.session['is_yt_pitch'] = True
        except Exception:
            pass

        try:
            return HttpResponseRedirect(request.GET[REDIRECT_FIELD_NAME])
        except KeyError:
            return home(request)
        
    else:
        return render_to_response('logged_out.html', context_instance=RequestContext(request))


def home(request):
    if request.user.is_authenticated():
        suggested_followees = request.user.follow_suggestions(PEOPLE_YOU_MAY_KNOW_SIZE)
        for user in request.user.popular_users(POPULAR_USERS_SIZE):
            if user not in suggested_followees:
                suggested_followees.append(user)

#        invite_list = request.user.invite_friends_list(INVITE_LIST_SIZE)
        invite_list = []

        is_new_user = request.session.get('is_new_user', False)
        try:
            del request.session['is_new_user']
        except KeyError:
            pass

        is_yt_pitch = request.session.get('is_yt_pitch', False)
        try:
            del request.session['is_yt_pitch']
        except KeyError:
            pass

        return render_to_response('logged_in.html',
                                  { 'suggested_followees': suggested_followees,
                                    'invite_list': invite_list,
                                    'is_new_user': is_new_user,
                                    'is_yt_pitch': is_yt_pitch },
                                  context_instance=RequestContext(request))
    else:
        return render_to_response('logged_out.html', context_instance=RequestContext(request))


def follow_suggestions(request):
    if request.user.is_authenticated():
        if request.GET.get('dismissed'):
            try:
                dismissed_user = User.objects.get(pk=request.GET['dismissed'])
                suggestion, created = DismissedUserSuggestions.objects.get_or_create(user=request.user,
                                                                                     suggested_user=dismissed_user)
                if created:
                    suggestion.dismissed_on = datetime.utcnow()
                    suggestion.save()
            except DismissedUserSuggestions.DoesNotExist:
                pass

        excludes = request.GET.get('excludes', '').split(',')

        suggested = request.user.follow_suggestions(1, excludes=excludes)
        if not suggested:
            suggested = request.user.popular_users(1, excludes=excludes)

        if suggested:
            return render_to_response('content/follow_suggestions.hfrg',
                                      dict(user=request.user,
                                           suggested=suggested[0]),
                                      context_instance=RequestContext(request))
        else:
            return HttpResponse('')
    else:
        return HttpResponseForbidden(ACCESS_FORBIDDEN_MESSAGE)

#hard coding tag bindings so you can see how this will work...
def profile(request):
    return render_to_response('profile.html',
                              dict(display_mode='profile'),
                              context_instance=RequestContext(request))


def profile_edit(request):
    preferences = request.user.preferences()
    return render_to_response('content/profile_edit.hfrg',
                              {'syndicate_likes': preferences['syndicate'], 'follow_email': preferences['follow_email']},
                              context_instance=RequestContext(request))


def logout_view(request):
    logout(request, next_page='')
    return HttpResponseRedirect('/')


def liked_video_queue(request):
    if request.method == 'GET' and 'user_id' in request.GET:
        user = User.objects.get(id__exact=long(request.GET['user_id']))
        all_liked_vids = user.liked_videos()
        if 'start' in request.GET and 'count' in request.GET:
            start_index = int(request.GET['start'])
            end_index = start_index + int(request.GET['count'])
            if len(all_liked_vids) >= end_index:
                vid_subset = all_liked_vids[start_index:end_index]
            elif start_index < len(all_liked_vids) and end_index >= len(all_liked_vids):
                vid_subset = all_liked_vids[start_index:]
            else:
                vid_subset = []
        else:
            #just pass through all liked videos...
            vid_subset = user.liked_videos()
        return render_to_response('content/video_queue.hfrg',
                                  dict(user=request.user,
                                       profile_owner=user,
                                       display_mode='profile',
                                       videos=vid_subset),
                                  context_instance=RequestContext(request))

    elif request.method == 'GET' and request.user.is_authenticated():
        all_liked_vids = request.user.liked_videos()
        if 'start' in request.GET and 'count' in request.GET:
            try:
                start_index = int(request.GET['start'])
                end_index = start_index + int(request.GET['count'])
                if len(all_liked_vids) >= end_index:
                    vid_subset = all_liked_vids[start_index:end_index]
                elif start_index < len(all_liked_vids) and end_index >= len(all_liked_vids):
                    vid_subset = all_liked_vids[start_index:]
                else:
                    vid_subset = []
            except Exception, e:
                #means url was malformed...
                return HttpResponseBadRequest(MALFORMED_URL_MESSAGE)
        else:
            #just pass through all liked videos...
            vid_subset = all_liked_vids
        return render_to_response('content/video_queue.hfrg',
                                  dict(user=request.user,
                                       display_mode='liked',
                                       videos=vid_subset),
                                  context_instance=RequestContext(request))
    return HttpResponseForbidden('you are not authorized to view this content, please log in')


def saved_video_queue(request):
    if request.method == 'GET' and request.user.is_authenticated():

        all_saved_vids = request.user.saved_videos()

        if 'start' in request.GET and 'count' in request.GET:
            try:
                start_index = int(request.GET['start'])
                end_index = start_index + int(request.GET['count'])

                if len(all_saved_vids) >= end_index:
                    vid_subset = all_saved_vids[start_index:end_index]

                elif start_index < len(all_saved_vids) and end_index >= len(all_saved_vids):
                    vid_subset = all_saved_vids[start_index:]

                else:
                    vid_subset = []

            except Exception, e:
                #means url was malformed...
                return HttpResponseBadRequest(MALFORMED_URL_MESSAGE)
        else:
            #just pass through all liked videos...
            vid_subset = request.user.saved_videos()

        return render_to_response('content/video_queue.hfrg',
                                  { 'user': request.user, 'display_mode': 'saved', 'videos': vid_subset },
                                  context_instance=RequestContext(request))

    return HttpResponseForbidden(ACCESS_FORBIDDEN_MESSAGE)


def video_player(request, video_id):
    if request.user.is_authenticated():
        video_query_set = Video.objects.filter(id__exact=video_id)
        if len(video_query_set) == 0:
            return HttpResponseNotFound()
        else:               
            return render_to_response('inclusion_tags/video_player_html5.hfrg', {'video': video_query_set[0]})


def video_detail(request, video_id):
        try:
            video = Video.objects.get(pk=int(video_id))
        except (ValueError, Video.DoesNotExist):
            #in case of uncastable or invalid vid...
            return HttpResponseNotFound()
        return render_to_response('video_detail.html',{'user':request.user, 'display_mode':'detail', \
                            'video':video}, context_instance=RequestContext(request))


def public_profile(request, username):
    try:
        user = User.objects.get(username=username, is_registered=True)
        if user == request.user:
            return render_to_response('profile.html', {'profile_owner':user, 'user':user, 'display_mode':'profile',\
                                                       'is_own_profile':True, 'videos':user.liked_videos()},\
                                                        context_instance=RequestContext(request))
        else:
            return render_to_response('profile.html', {'user':request.user, 'profile_owner':user, 'display_mode':'profile',\
                                                       'is_own_profile':False, 'videos':user.liked_videos()},\
                                                        context_instance=RequestContext(request))
    except Exception:
        logger.exception('User:%s not found' % username)
        raise Http404


def download_pitch(request):
    return render_to_response('boilerplate/download_pitch.html', context_instance=RequestContext(request))


def contact(request):
    return render_to_response('boilerplate/contact.html', context_instance=RequestContext(request))


def about(request):
    return render_to_response('boilerplate/about.html', context_instance=RequestContext(request))


def tos(request):
    return render_to_response('boilerplate/tos.html', context_instance=RequestContext(request))


def plugin_pitch(request):
    return render_to_response('content/plugin_pitch.hfrg', context_instance=RequestContext(request))


def privacy(request):
    return render_to_response('boilerplate/privacy.html', context_instance=RequestContext(request))

def no_plugin_no_videos(request):
    return render_to_response('content/no_plugin_no_videos.hfrg', context_instance=RequestContext(request))

def plugin_no_videos(request):
    return render_to_response('content/plugin_no_videos.hfrg', context_instance=RequestContext(request))

def activity(request):
    if request.user.is_authenticated():
        user = request.user

        facebook_import_pending = fetch_task_failed = False

        if 'start' in request.GET and 'count' in request.GET:

            activityType = request.GET.get('activityType')

            if activityType in ['all', 'facebook']:
                try:
                    task = UserTask.objects.get(user=user, category='news')
                    task_status = task.status()
                    if task_status not in [states.SUCCESS, states.FAILURE]:
                        facebook_import_pending = True
                    else:
                        fetch_task_failed = task_status == states.FAILURE
                except UserTask.DoesNotExist:
                    pass

            vid_subset = user.activity(activityType, int(request.GET['start']), int(request.GET['count']))

        else:
            vid_subset = request.user.activity(request.GET.get('activityType'))

        return render_to_response('content/activity_queue.hfrg',
                                  { 'activity_items': vid_subset, 'facebook_import_pending': facebook_import_pending, 'fetch_task_failed': fetch_task_failed },
                                  context_instance=RequestContext(request))
    
    return HttpResponseForbidden(ACCESS_FORBIDDEN_MESSAGE)


#view renders (paginated) user list (using templ. user_list.html)
def user_page(request, user_id, relation):
    try:
        target_user = User.objects.get(id=int(user_id))
        is_own_profile = target_user == request.user

        if relation == 'followers':
            related_users = target_user.followers()
            heading = 'Users following <a href="/%s">%s</a>:' % (target_user.username, target_user.first_name)
        if relation == 'following':
            related_users = target_user.following()
            heading = '<a href="/%s">%s</a> is following:' % (target_user.username, target_user.first_name)

        paginator = Paginator(related_users, 20)
        if 'page' in request.GET:
            page = request.GET.get('page')
        else:
            page = 1

        try:
            related_users_subset = paginator.page(page)
        except PageNotAnInteger:
            # If page is not an integer, deliver first page.
            related_users_subset = paginator.page(1)
        except EmptyPage:
            # If page is out of range (e.g. 9999), deliver last page of results.
            related_users_subset = paginator.page(paginator.num_pages)
        return render_to_response('user_list.html',
                                  dict(related_users=related_users_subset.object_list,
                                       page=related_users_subset,
                                       heading=heading,
                                       profile_owner=target_user,
                                       display_mode=relation,
                                       is_own_profile=is_own_profile),
                                  context_instance=RequestContext(request))
    except (ObjectDoesNotExist, ValueError), e:
        return HttpResponseBadRequest(MALFORMED_URL_MESSAGE)


def followers(request, user_id):
    return user_page(request, user_id, relation='followers')


def following(request, user_id):
    return user_page(request, user_id, relation='following')


def video_liked_by(request, video_id):
    try:
        video = Video.objects.get(pk=int(video_id))
        has_next, has_prev, next_start_index, next_count = None, None, None, None
        if 'start' in request.GET and 'count' in request.GET:
            if int(request.GET['start']) != 0:
                has_prev = True
            likers = video.all_likers()[int(request.GET['start']):int(request.GET['count'])]

            if int(request.GET['start']) + int(request.GET['count']) >= len(likers):
                has_next = False
            else:
                has_next = True
                next_start_index = int(request.GET['start']) + _VID_LIKED_BY_PAGINATION_THRESHOLD
                next_count = _VID_LIKED_BY_PAGINATION_THRESHOLD
        else:
            likers = video.all_likers()
            has_more = False
    except (ValueError, Video.DoesNotExist):
        #in case of uncastable or invalid vid...
        return HttpResponseNotFound()
    return render_to_response('content/user_dropdown.hfrg', {'video':video, 'users':likers, 'has_next':has_next, 'has_prev':has_prev,\
                                                             'next_start_index': next_start_index, 'next_count':next_count})


def leaderboard(request):
    user_list = User.objects.filter(is_registered=True).order_by('-karma', 'id')
    paginator = Paginator(user_list, 25) # Show 25 users per page

    # Make sure page request is an int. If not, deliver first page.
    try:
        page = int(request.GET.get('page', '1'))
    except ValueError:
        page = 1

    try:
        users = paginator.page(page)
    except (EmptyPage, InvalidPage):
        # If page is out of range (e.g. 9999), deliver last page of results.
        users = paginator.page(paginator.num_pages)

    return render_to_response('leaderboard.html', {'users': users}, context_instance=RequestContext(request))

def email_preferences(request):
    if request.user.is_authenticated():
        if request.method == 'GET':
            return render_to_response('email_preferences.html',
                                      {'saved': False, 'follow_email': request.user.preferences().get('follow_email', 1)},
                                      context_instance=RequestContext(request))
        else:
            if request.POST.get('follow-email-checkbox', '').lower() == 'on':
                request.user.set_preferences({'follow_email': 1})
            else:
                request.user.set_preferences({'follow_email': 0})
            return render_to_response('email_preferences.html',
                                      {'saved': True},
                                      context_instance=RequestContext(request))
    else:
        return render_to_response('logged_out.html', context_instance=RequestContext(request))

def single_video(request, display_mode, video_id):
    if request.user.is_authenticated():
        try:
            video = Video.objects.get(pk=video_id)
            uservideo = UserVideo.objects.get(user=request.user, video=video)

            status = video.status()
            if status == states.FAILURE:
                return render_to_response('inclusion_tags/error_fetching_data.hfrg',
                                          { 'video': video, 'user_video': uservideo },
                                          context_instance=RequestContext(request))
            
            if status == states.SUCCESS:
                return render_to_response('inclusion_tags/video_queue_item.hfrg',
                                          { 'user': request.user, 'video': video, 'display_mode': display_mode },
                                          context_instance=RequestContext(request))

            # Assume PENDING.
            return HttpResponseNotModified()
        
        except UserVideo.DoesNotExist:
            return HttpResponseNotFound()

def publish_permissions(request):
    redirect = sanitize_redirect(request.get_host(), request.REQUEST.get(REDIRECT_FIELD_NAME))
    request.session[REDIRECT_FIELD_NAME] = redirect

    complete_url = getattr(settings, 'SOCIAL_AUTH_COMPLETE_URL_NAME', 'complete')
    complete_url = reverse(complete_url, args=('facebook',))

    args = { 'client_id': settings.FACEBOOK_APP_ID,
             'redirect_uri': request.build_absolute_uri(complete_url),
             'scope' : 'publish_stream,' + ','.join(settings.FACEBOOK_EXTENDED_PERMISSIONS) }

    auth_url = FACEBOOK_AUTHORIZATION_URL + '?' + urlencode(args)

    return HttpResponseRedirect(auth_url)

def goodbye(request):
    return render_to_response('goodbye.html', context_instance=RequestContext(request))