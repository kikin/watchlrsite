from django.http import HttpResponse, HttpResponseRedirect, HttpResponseBadRequest, HttpResponseNotFound, HttpResponseForbidden
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.contrib.auth.views import login, logout
from django.conf import settings
from kikinvideo.api.models import Video, User, Preference

ACCESS_FORBIDDEN_MESSAGE = "you are not authorized to access the content you have requested"
MALFORMED_URL_MESSAGE = 'Error: malformed URL supplied to host'

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
        return render_to_response('user_home.html', {'settings': settings}, context_instance=RequestContext(request))
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
        return HttpResponseNotFound('')
<<<<<<< HEAD

def download_pitch(request):
    return render_to_response('download_pitch.html', {'settings':settings, 'user':request.user})
=======
    
def plugin_pitch(request):
    return render_to_response('content/plugin_pitch.hfrg')

def activity(request):
    if request.user.is_authenticated():
        user = request.user
        return render_to_response('content/activity_queue.html', \
                {'user':user, 'settings':settings,'activity_items':user.activity()},\
                                                    context=RequestContext(request))
    return HttpResponseForbidden(ACCESS_FORBIDDEN_MESSAGE)
>>>>>>> 05b34edf87586cf4886e67ac86608bf181efb98a
