from django.http import HttpResponse, HttpResponseRedirect, HttpResponseBadRequest, HttpResponseNotFound, HttpResponseForbidden, Http404
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.contrib.auth.views import login, logout
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

from kikinvideo.api.models import Video, User, Preference

ACCESS_FORBIDDEN_MESSAGE = "you are not authorized to access the content you have requested"
MALFORMED_URL_MESSAGE = 'Error: malformed URL supplied to host'
NUM_SUGGESTED_FOLLOWEES = 8

def login_complete(request):
    # Client requires that we pass in a Set-Kke header with session key so as to persist it
    # in its cookie jar. This is just an intermediary view which does exactly that and
    # redirects user to `home` view.
    if request.user.is_authenticated():
        response = HttpResponseRedirect('/')
        response['Set-Kke'] = '_KVS=%s' % request.session.session_key
        return response
    else:
        return render_to_response('logged_out.html', {'settings': settings}, context_instance=RequestContext(request))

def home(request):
    if request.user.is_authenticated():

        #perhaps in the near future this can be done at the db query level, but for now...
        all_users = list(User.objects.all())
		#num of suggested followees
        suggested_followees = [x for x in all_users if x not in request.user.following()\
 										and x != request.user][:NUM_SUGGESTED_FOLLOWEES]

        return render_to_response('logged_in.html', {'settings': settings, 'suggested_followees':suggested_followees},\
                                  context_instance=RequestContext(request))
    else:
        return render_to_response('logged_out.html', {'settings': settings}, context_instance=RequestContext(request))

#hard coding tag bindings so you can see how this will work...
def profile(request):
    return render_to_response('profile.html', {'settings': settings, 'user': user},
                              context_instance=RequestContext(request))


def profile_edit(request):
    syndicate = Preference.objects.get(user=request.user, name="syndicate").value
    return render_to_response('content/profile_edit.hfrg', {'settings': settings, 'user': request.user,\
                              'syndicate_likes':syndicate}, context_instance=RequestContext(request))


def logout_view(request):
    logout(request, next_page='')
    return HttpResponseRedirect('/')

def liked_video_queue(request):
    if request.method == 'GET' and 'user_id' in request.GET:
        try:
            user = User.objects.get(id__exact=long(request.GET['user_id']))
            all_liked_vids = user.liked_videos()
            start_index = int(request.GET['start'])
            end_index = start_index + int(request.GET['count'])
            if all_liked_vids.count() >= end_index:
                vid_subset = all_liked_vids[start_index:end_index]
            elif start_index < all_liked_vids.count() and end_index >= all_liked_vids.count():
                vid_subset = all_liked_vids[start_index:]
            else:
                vid_subset = []
        except Exception, e:
            #means url was malformed...
            return HttpResponseBadRequest(MALFORMED_URL_MESSAGE)
        else:
            #just pass through all liked videos...
            vid_subset = user.liked_videos()
        return render_to_response('content/video_queue.hfrg',{'user':user,
                                  'display_mode':'profile', 'settings': settings, 'videos': vid_subset},
                                  context_instance=RequestContext(request))

    elif request.method == 'GET' and request.user.is_authenticated():
        all_liked_vids = request.user.liked_videos()
        if 'start' in request.GET and 'count' in request.GET:
            try:
                start_index = int(request.GET['start'])
                end_index = start_index + int(request.GET['count'])
                if all_liked_vids.count() >= end_index:
                    vid_subset = all_liked_vids[start_index:end_index]
                elif start_index < all_liked_vids.count() and end_index >= all_liked_vids.count():
                    vid_subset = all_liked_vids[start_index:]
                else:
                    vid_subset = []
            except Exception, e:
                #means url was malformed...
                return HttpResponseBadRequest(MALFORMED_URL_MESSAGE)
            return render_to_response('content/video_queue.hfrg',{'user':request.user,
                              'display_mode':'liked', 'settings': settings, 'videos': vid_subset},
                              context_instance=RequestContext(request))
    return HttpResponseForbidden('you are not authorized to view this content, please log in')




def saved_video_queue(request):
    if request.method == 'GET' and request.user.is_authenticated():
        all_saved_vids = request.user.saved_videos()
        if 'start' in request.GET and 'count' in request.GET:
            try:
                start_index = int(request.GET['start'])
                end_index = start_index + int(request.GET['count'])
                if all_saved_vids.count() >= end_index:
                    vid_subset = all_saved_vids[start_index:end_index]
                elif start_index < all_saved_vids.count() and end_index >= all_saved_vids.count():
                    vid_subset = all_saved_vids[start_index:]
                else:
                    vid_subset = []
            except Exception, e:
                #means url was malformed...
                return HttpResponseBadRequest(MALFORMED_URL_MESSAGE)
        else:
            #just pass through all liked videos...
            vid_subset = request.user.saved_videos()
        return render_to_response('content/video_queue.hfrg',{'user':request.user,
                                  'display_mode':'saved', 'settings': settings, 'videos': vid_subset},
                                  context_instance=RequestContext(request))


def video_player(request, video_id):
    if request.user.is_authenticated():
        video_query_set = Video.objects.filter(id__exact=video_id)
        if len(video_query_set) == 0:
            return HttpResponseNotFound()
        else:               
            return render_to_response('content/video_player.hfrg', {'video': video_query_set[0]})
        
def video_detail(request, video_id):
        try:
            video = Video.objects.get(pk=int(video_id))
        except (ValueError, Video.DoesNotExist):
            #in case of uncastable or invalid vid...
            return HttpResponseNotFound()
        return render_to_response('video_detail.html',{'user':request.user, 'display_mode':'saved', \
                            'settings':settings, 'video':video}, context_instance=RequestContext(request))


def public_profile(request, username):
    try:
        user = User.objects.get(username=username)
        if user == request.user:
            return render_to_response('profile.html', {'profile_owner':user, 'user':user, 'settings':settings, 'display_mode':'profile',\
                                                       'is_own_profile':True, 'videos':user.liked_videos()},\
                                                        context_instance=RequestContext(request))
        else:
            return render_to_response('profile.html', {'user':request.user, 'profile_owner':user, 'settings':settings, 'display_mode':'profile',\
                                                       'is_own_profile':False, 'videos':user.liked_videos()},\
                                                        context_instance=RequestContext(request))
    except Exception, e:
        raise Http404

def download_pitch(request):
    return render_to_response('download_pitch.html', {'settings':settings, 'user':request.user})
    
def plugin_pitch(request):
    return render_to_response('content/plugin_pitch.hfrg')

def activity(request):
    if request.user.is_authenticated():
        user = request.user
        if 'start' in request.GET and 'count' in request.GET:
            try:
                all_activity_items = user.activity()
                start_index = int(request.GET['start'])
                end_index = start_index + int(request.GET['count'])
                if len(all_activity_items) >= end_index:
                    vid_subset = all_activity_items[start_index:end_index]
                elif start_index < len(all_activity_items) and end_index >= len(all_activity_items):
                    vid_subset = all_activity_items[start_index:]
                else:
                    vid_subset = []
            except Exception, e:
                #means url was malformed...
                return HttpResponseBadRequest(MALFORMED_URL_MESSAGE)
        else:
            vid_subset = request.user.activity()
        return render_to_response('content/activity_queue.hfrg', \
                {'user':user, 'settings':settings,'activity_items':vid_subset},\
                                        context_instance=RequestContext(request))
    return HttpResponseForbidden(ACCESS_FORBIDDEN_MESSAGE)

#view renders (paginated) user list (using templ. user_list.html)
def user_page(request, user_id, relation):
    if request.user.is_authenticated():
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
                return render_to_response('user_list.html', {'related_users':related_users_subset.object_list,\
                                'heading': heading, 'settings':settings, 'user':request.user,\
                                'profile_owner':target_user, 'is_own_profile':is_own_profile},\
                                          context_instance=RequestContext(request))
            except (ObjectDoesNotExist, ValueError), e:
                return HttpResponseBadRequest(MALFORMED_URL_MESSAGE)
    return HttpResponseForbidden(ACCESS_FORBIDDEN_MESSAGE)

def followers(request, user_id):
    return user_page(request, user_id, relation='followers')

def following(request, user_id):
    return user_page(request, user_id, relation='following')