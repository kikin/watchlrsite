# Create your views here.
from django.shortcuts import render_to_response
from django.template import RequestContext
from kikinvideo import settings

#note: once User class has been defined, we will almost certainly be passing
#that through to each template in the context hash when we render...

ex_video = {'title':'Can I Kick It (video)', 'description':"See Music Videos http://www.bvmtv.com/ that you CAN'T See on You Tube! even some X RATED music videos! +Live Chat and Embed video codes.   Pete Rock & C.L. Smooth were an influential rap group from Mount Vernon, New York. They made their debut in the rap world with their 1991 EP, All Souled Out. It sold moderately well enough to justify Elektra Records clearing",\
            'url':'http://www.youtube.com/watch?v=UbDFS6cg1AI', 'thumbnail': 'http://i.ytimg.com/vi/UbDFS6cg1AI/0.jpg',\
            'embed_code':'http://www.youtube.com/v/UbDFS6cg1AI?version=3&autoplay=1', 'id':22, 'likes':1, 'liked':1}
#example user context:
ex_user = {'username':'JenBear', 'realName':'Jennifer Lee', 'followingCount':200,\
           'followerCount':300, 'videosCount':300, 'imageURL' : '/static/images/profile/ex_profile_pic.png',\
           'saved_videos':[ex_video]}

def home(request):
	return render_to_response('user_home.html', {'settings':settings}, context_instance = RequestContext(request))

#hard coding tag bindings so you can see how this will work...
def profile(request):
	return render_to_response('profile.html', {'settings':settings, 'user': ex_user }, context_instance = RequestContext(request))

def video_queue(request):
	return render_to_response('content/video_queue.html', {'settings':settings, 'videos':[ex_video]}, context_instance = RequestContext(request))