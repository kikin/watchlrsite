IMPORTANT:
	This project now has dependencies:

		django-socialregistration:
			simple interface for user authentication through facebook graph API
		
		pyFacebook:
			a dependency of django-socialregistration
			
before running/working on the app, install these dependencies:
	i.e:
		'cd dependencies'
		'cd django-socialregistration'
		'sudo python setup.py install'
		'cd ..'
		'cd pyfacebook'
		'sudo python setup.py install'

Perhaps this goes without saying, but if you keep multiple versions of the python interpreter on your machine, make sure that these modules get installed to the site-packages directory for the version that will be used to run this app.

			
Example usage of the models defined in models.py (from scripts/test/db_populate.py):

-----------------------------------------
[Python]
-----------------------------------------
>>>
>>>  from kikinvideo.models import *
>>>  
>>>  v_thumb_1 = ThumbnailImage()
>>>  v_thumb_1.width = 480
>>>  v_thumb_1.height = 360
>>>  v_thumb_1.url = 'http://i.ytimg.com/vi/UbDFS6cg1AI/0.jpg'
>>>  v_thumb_1.save()
>>>  
>>>  v_source_1 = VideoSource()
>>>  v_source_1.domain = 'http://www.youtube.com'
>>>  v_source_1.favicon_url = 'http://s.ytimg.com/yt/favicon-vflZlzSbU.ico'
>>>  v_source_1.save()
>>>  
>>>  v_1 = Video()
>>>  v_1.url = "http://www.youtube.com/watch?v=UbDFS6cg1AI"
>>>  v_1.title='Can I Kick It?'
>>>  v_1.description = "An awesome music video!"
>>>  v_1.thumbnail = v_thumb_1
>>>  v_1.source = v_source_1
>>>  v_1.last_updated = datetime.datetime.now()
>>>  v_1.save()
>>>  
>>>  user_1 = User()
>>>  user_1.name = "Steve Williams"
>>>  user_1.email = "w@jkblkjkb.com"
>>>  user_1.save()
>>>  
>>>  user_1_likes_v1 = UserLikedVideo(user=user_1, video=v_1)
>>>  user_1_likes_v1.save()
>>>  
>>>  user_1_saved_v1 = UserSavedVideo(user=user_1, video=v_1)
>>>  user_1_saved_v1.save()
>>>  
>>>  user_1_watched_v1 = UserWatchedVideo(user=user_1, video=v_1)
>>>  user_1_watched_v1.save()
-----------------------------------------
