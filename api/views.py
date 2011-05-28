# Create your views here.
from django.http import HttpResponse, HttpResponseBadRequest

#For example...
def list(request):
	if request.method == 'GET':
		#fetch data from db, serialize, and return....
		return HttpResponse("{'some':'content'}")
	else:
		return HttpResponseBadRequest('invalid parameters supplied to API method')
#etc...