-----------------------------------------
Project Structure
-----------------------------------------
/settings.py
	Project settings.

/models.py
	Definitions for the models used in this project.

/urls.py
	high-level url routing (i.e. routing of '/api/...' urls gets handed 
	off to the 'api' app, all other urls get handed off to the 
	'webapp' app).

/manage.py
	the standard django utility. 
	(see https://docs.djangoproject.com/en/dev/ref/django-admin/)

/api/*
	Implementation of the json web service component of 
	this project.
	
/webapp/*
	Implementation of the browser-based frontend for this project.
	
/static/*
	The static resources for this project.  Pointed to by the
	STATIC_URL variable in settings.py.  For instance, if you 
	wanted to reference a static resource from a template, you could
	pass the settings module through to it and the resource path would be:
		"{{ settings.STATIC_URL }}path_to_resource_in_static_dir"
	
/doc/*
	Project documentation (right now, though, only our db spec).

/scripts/*
	Any batch-processing scripts can be placed here.  Right now, in 
	the 'test' subdirectory, you'll find db_populate.py and
	db_clear.py, which, respectively, populate the database with 
	fake data for testing and clear it out.

/dependencies/*
	Directory containing all project dependencies (see below).


-----------------------------------------
Dependencies
-----------------------------------------

This project has the following dependencies:

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

---------------------------------------
Working on this app
---------------------------------------

Before you can get to work, you will need to run
 
	'python manage.py syncdb'

from the top level project directory to create the database schema.


If you will be using a local test database for development, set the USE_LOCAL_DB flag in settings.py to true and fill, then find 
	if USE_LOCAL_DB == True:
		DATABASES = {...}
a few lines down and modify the body of the DATABASES dict with your local db configuration info.
			
finally, to start your local development server, run
	python manage.py runserver [port or addr:port]

the default addr/port is 127.0.0.1:8000, if you want your development server to be externally accessible, you could set the address to 0.0.0.0 (firewall/network config permitting).


-----------------------------------------
object-relational API
-----------------------------------------

Example usage of the models defined in models.py:

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
	>>>
	>>>  liked = user_1.liked_videos.all()[0]
	>>>  print liked.title
	u'Can I Kick It?'
	>>>
	>>>  liked_info = UserLikedVideo.objects.filter(user__exact=user_1, video__exact=liked)
	>>>  print liked_info[0].video.title
	u'Can I Kick It?'
	>>>  print liked_info[0].date
	2011-05-28 16:01:35
	>>>
	-----------------------------------------