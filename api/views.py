from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseForbidden
from django.core import serializers
from kikinvideo.models import *

#For example...
def list(request):
	if request.method == 'GET':
		#fetch data from db, serialize, and return....
		if request.user.is_authenticated():
			# We should probably revise the spec for this method to
			# have user_id param be optional.
			# If not supplied, method could return info (both public-facing and otherwise)
			# about current session's user.  If supplied and different from
			# session participant, it could return only public-facing info
			# for the specified user.
			if request.GET.has_key('user_id'):
				try:
					supplied_uid = int(request.GET['user_id'])
				#if cast fails...
				except ValueError:
					return HttpResponseBadRequest(str({'result':'invalid user id supplied to method'}), mimetype='application/json')

				if supplied_uid and supplied_uid == request.user.id:
				#user is accessing his own info....
					#need to use ModelManager.filter, not ModelManager.get
					#here because the json serializer expects a QuerySet, not
					#a User instance...
					user_obj = User.objects.get(pk=request.user.id)
					return HttpResponse(str({'result': user_obj.to_json_private()}), mimetype='application/json')

				#IMPORTANT:
				#   a function for current session owner to list (public facing) info about OTHER users
				#   should go here.
				#   i.e.
				#   else:
				#	    user_obj = User.objects.get(pk=request.GET['user_id'])
				#       return HttpResponse(str({'result': user_obj.to_json_public()}), mimetype='application/json')


			#if no user_id provided, default to sending data for session owner
			else:
				user_obj = User.objects.get(pk=request.user.id)
				return HttpResponse(str({'result': user_obj.to_json_private()}), mimetype='application/json')
		else:
		#IMPORTANT:
		#   a function for unauthenticated clients to access (public facing) info about users
		#   should go here.
		#   i.e.
		#   if request.GET.has_key('user_id'):
		#		user_obj = User.objects.get(pk=request.GET['user_id'])
		#       return HttpResponse(str({'result': user_obj.to_json_public()}), mimetype='application/json')
			return HttpResponseForbidden(str({'result':'you are not authorized to access this method'}), mimetype='application/json')