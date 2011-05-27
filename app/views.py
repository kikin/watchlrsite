# Create your views here.
from django.shortcuts import render_to_response
from kikinvideo import settings

def home(request):
	return render_to_response('user_home.html', {'settings':settings})