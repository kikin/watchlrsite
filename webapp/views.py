from django.http import HttpResponse, HttpResponseRedirect, HttpResponseBadRequest, HttpResponseNotFound, HttpResponseForbidden
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.contrib.auth.views import login, logout
from kikinvideo import settings
from kikinvideo.api.models import Video, User

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
    return render_to_response('content/profile_edit.hfrg', {'settings': settings, 'user': request.user},
                              context_instance=RequestContext(request))


def logout_view(request):
    logout(request, next_page='')
    return HttpResponseRedirect('/')

# will add start (video index) and limit (num videos to show) params to these
# soon...
def liked_video_queue(request):
    if request.user.is_authenticated():
        return render_to_response('content/video_queue.hfrg',{'user':request.user,
                                  'display_mode':'liked', 'settings': settings, 'videos': request.user.liked_videos()},
                                  context_instance=RequestContext(request))


def saved_video_queue(request):
    if request.user.is_authenticated():
        return render_to_response('content/video_queue.hfrg',{'user':request.user,
                                  'display_mode':'saved', 'settings': settings, 'videos': request.user.saved_videos()},
                                  context_instance=RequestContext(request))


def video_player(request, video_id):
    if request.user.is_authenticated():
        video_query_set = Video.objects.filter(id__exact=video_id)
        if len(video_query_set) == 0:
            return HttpResponseNotFound()
        else:
            return render_to_response('content/video_player.hfrg', {'video': video_query_set[0]})
        
def video_detail(request):
    if request.user.is_authenticated():
        if 'vid' in request.GET:
            vid_str = request.GET['vid']
            try:
                vid = long(vid_str)
                video = Video.objects.get(pk=vid)
                return render_to_response('video_detail.html',{'user':request.user, 'display_mode':'saved', \
                                    'settings':settings, 'video':video}, context_instance=RequestContext(request))
            #in case of uncastable or invalid vid...
            except ValueError:
                return HttpResponseNotFound
    return HttpResponseForbidden('You must log in to view this content')

def public_profile(request, username):
    try:
        user = User.objects.get(username=username)
        return render_to_response('profile.html', {'user':user, 'settings':settings, \
                                                   'videos':user.liked_videos()}, context_instance=RequestContext(request))
    except Exception, e:
        return HttpResponseNotFound('')
    
