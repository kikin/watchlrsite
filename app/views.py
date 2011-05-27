# Create your views here.
from django.shortcuts import render_to_response
from kikinvideo import settings

#note: once User class has been defined, we will almost certainly be passing
#that through to each template in the context hash when we render...

#example user context:
ex_user = {'username':'JenBear', 'realName':'Jennifer Lee', 'followingCount':200,\
           'followerCount':300, 'videosCount':300, 'imageURL' : '/static/images/profile/ex_profile_pic.png'}

def home(request):
	return render_to_response('user_home.html', {'settings':settings})

#hard coding tag bindings so you can see how this will work...
def profile(request):
	return render_to_response('profile.html', {'settings':settings, 'user': ex_user })