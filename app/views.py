# Create your views here.
from django.shortcuts import render_to_response
from kikinvideo import settings

#note: once User class has been defined, we will almost certainly be passing
#that through to each template in the context hash when we render...

def home(request):
	return render_to_response('user_home.html', {'settings':settings})

def profile(request):
	return render_to_response('profile.html', {'settings':settings})