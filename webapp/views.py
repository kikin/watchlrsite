# Create your views here.
from django.shortcuts import render_to_response
from kikinvideo import settings

#note: once User class has been defined, we will almost certainly be passing
#that through to each template in the context hash when we render...

ex_video = {'title':'Can I Kick It (video)', 'description':'Great video, great loop ...',\
            'url':'http://www.youtube.com/watch?v=UbDFS6cg1AI', 'thumbnail': 'http://i.ytimg.com/vi/UbDFS6cg1AI/0.jpg',\
            'embed_code':'http://www.youtube.com/v/UbDFS6cg1AI?version=3&autoplay=1', 'id':22, 'likes':1, 'liked':1}
#example user context:
ex_user = {'username':'JenBear', 'realName':'Jennifer Lee', 'followingCount':200,\
           'followerCount':300, 'videosCount':300, 'imageURL' : '/static/images/profile/ex_profile_pic.png',\
           'saved_videos':[ex_video]}

def home(request):
	return render_to_response('user_home.html', {'settings':settings})

#hard coding tag bindings so you can see how this will work...
def profile(request):
	return render_to_response('profile.html', {'settings':settings, 'user': ex_user })

def video_queue(request):
	return render_to_response('content/video_queue.html', {'settings':settings, 'videos':[ex_video]})