Project Structure
-----------------

+ settings.py

    Project settings.

+ api/models.py

    Definitions for the models used in this project.
    Note: Project level models are not a good idea in general. Also, it tends to mess up Celery's task names.
    If you need to use models in another app, import as follows:

        from api.models import User, Video

+ urls.py

    high-level url routing (i.e. routing of '/api/...' urls gets handed
    off to the 'api' app's url manager, all other urls get handed off
    to the 'webapp' app's url manager).

+ manage.py

    the standard utility.
    (see https://docs.djangoproject.com/en/dev/ref/django-admin/)

+ api/

    Implementation of the json web service component of this project.

+ webapp/

	  Implementation of the browser-based frontend for this project.
	
+ static/

    The static resources for this project.  Pointed to by the
    STATIC_URL variable in settings.py.  For instance, if you
    wanted to reference a static resource from a template, you could
    pass the settings module through to it and the resource path would be:

        "{{ settings.STATIC_URL }}path_to_resource_in_static_dir"
	
+ doc/

	  Project documentation (right now, though, only our db spec).

+ scripts/

    Any batch-processing scripts can be placed here.  Right now, in
    the 'test' subdirectory, you'll find db_populate.py and
    db_clear.py, which, respectively, populate the database with
    fake data for testing and clear it out.

+ dependencies/

	  All project dependencies (see below).

Environment
-----------

+ Framework:
  This project is being developed using django 1.3 (and
  leverages certain features not available in earlier
  versions) and Python 2.6.  Configure your environment
  accordingly.

+ DBMS:
  The production server is running
  Postgresql 9, though provided you only touch the database
  through Django's ORM layer, you can use any database
  management system you please for testing.

Dependencies
------------

Dependencies are specified using a pip requirements file. See
http://www.pip-installer.org/en/latest/requirement-format.html for more information.

To install all required dependencies, run the following command
>        pip install -r requirements.txt

Working on this app
-------------------

If you will be using a local test database for development, set the active_database var in settings.py
to the key of the corresponding nested config dict in the database_configurations dict a few lines down.

i.e.:

    active_db = 'local_test'

    database_configurations = {
        'dev': {
          'ENGINE': 'django.db.backends.postgresql_psycopg2',
          'NAME': 'kikinvideo',
          'USER': 'webapp',
          'PASSWORD': 'savemore',
          'HOST': 'dev-video.kikin.com',
          'PORT': '',
        },
          'local_test':{
          'ENGINE': 'django.db.backends.mysql',
          'NAME': 'kikinvideo',
          'USER': 'webapp',
          'PASSWORD': 'savemore',
          'HOST': '/Applications/MAMP/tmp/mysql/mysql.sock',
          'PORT': '',
        }
    }

    DATABASES = { 'default': database_configurations[active_db] }

...perhaps there's a more correct way to do this, but
for now the solution above works fine.

Before you can get to work, you will need to run
 
    python manage.py syncdb

from the top level project directory to create the database schema.

			
finally, to start your local development server, run
	  python manage.py runserver [port or addr:port]

the default addr/port is 127.0.0.1:8000, if you want your development server to be externally accessible, you
could set the address to 0.0.0.0 (firewall/network config permitting).


object-relational API
---------------------

Example usage of the models defined in api/models.py:

    -----------------------------------------
    [Python]
    -----------------------------------------
    >>>
    >>>  from api.models import *
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