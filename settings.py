# Django settings for video project.

_version = (2, 3, 5)
VERSION = '.'.join([str(number) for number in _version])

import sys, os

sys.path.append(os.getcwd())

VIDEO_ENV = os.environ.get('VIDEO_ENV', 'local')

# Turn DEBUG on only if running locally
DEBUG = VIDEO_ENV.startswith('local')
TEMPLATE_DEBUG = DEBUG

ADMINS = (
    ('Sandesh Devaraju', 'sandesh@kikin.com'),
)

MANAGERS = ADMINS

database_configurations = {
    'prod': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'kikinvideo',
        'USER': 'webapp',
        'PASSWORD': 'savemore',
        'HOST': 'store.cboprdhtcqew.us-east-1.rds.amazonaws.com',
        'PORT': '',
        },
    'dev': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'kikinvideo',
        'USER': 'webapp',
        'PASSWORD': 'savemore',
        'HOST': '',
        'PORT': '',
        },
    'local': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'kikinvideo',
        'USER': 'webapp',
        'PASSWORD': 'savemore',
        'HOST': '',
        'PORT': '',
        },
    'local_sqlite':{
        'ENGINE':'django.db.backends.sqlite3',
        'NAME':'kikinvideo',
        },
}

# Picks up database configuration from environment variable
DATABASES = { 'default': database_configurations[VIDEO_ENV] }

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# On Unix systems, a value of None will cause Django to use the same
# timezone as the operating system.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = None

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale
USE_L10N = True

# Absolute filesystem path to the directory that will hold user-uploaded files.
# Example: "/home/media/media.lawrence.com/media/"
MEDIA_ROOT = ''

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash.
# Examples: "http://media.lawrence.com/media/", "http://example.com/media/"
MEDIA_URL = '/media/'

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/home/media/media.lawrence.com/static/"
STATIC_ROOT = ''

# URL prefix for static files.
# Example: "http://media.lawrence.com/static/"
STATIC_URL = '/static/'

# URL prefix for admin static files -- CSS, JavaScript and images.
# Make sure to use a trailing slash.
# Examples: "http://foo.com/static/admin/", "/static/admin/".
ADMIN_MEDIA_PREFIX = '/static/admin/'

# Additional locations of static files
STATICFILES_DIRS = (
    # Put strings here, like "/home/html/static" or "C:/www/django/static".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    os.path.abspath('.') + '/static/',
)

# List of finder classes that know how to find static files in
# various locations.
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    #'django.contrib.staticfiles.finders.DefaultStorageFinder',
)

# Make this unique, and don't share it with anybody.
SECRET_KEY = 'ejgs5a_i-ycbtj0(z$u-s*4src7k79jrl-0!y_eo*ez^z=&%y$'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
    #'django.template.loaders.eggs.Loader',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    'django.core.context_processors.request',
    'django.contrib.auth.context_processors.auth',
    'django.core.context_processors.media',
    'django.core.context_processors.static',
    'kikinvideo.context_processors.release_version',
)

AUTHENTICATION_BACKENDS = (
    'social_auth.backends.facebook.FacebookBackend',
    'django.contrib.auth.backends.ModelBackend',
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'kikinvideo.middleware.MultipleProxyMiddleware',
    'johnny.middleware.LocalStoreClearMiddleware',
    'johnny.middleware.QueryCacheMiddleware',
)

ROOT_URLCONF = 'kikinvideo.urls'

TEMPLATE_DIRS = ( os.path.abspath('.') + '/webapp/templates',
                  os.path.abspath('.') + '/analytics/templates', )

INSTALLED_APPS = (
    'django_auth_longer_email',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Uncomment the next line to enable the admin:
    # 'django.contrib.admin',
    # Uncomment the next line to enable admin documentation:
    # 'django.contrib.admindocs',
    'social_auth',
    'webapp',
    'api',
    'djcelery',
    'djkombu',
    'south',
    'django_ses',
    'analytics',
)

# A sample logging configuration. The only tangible logging
# performed by this configuration is to send an email to
# the site admins on every HTTP 500 error.
# See http://docs.djangoproject.com/en/dev/topics/logging for
# more details on how to customize your logging configuration.
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'mail_admins': {
            'level': 'ERROR',
            'class': 'django.utils.log.AdminEmailHandler'
        }
    },
    'loggers': {
        'django.request': {
            'handlers': ['mail_admins'],
            'level': 'ERROR',
            'propagate': True,
            },
        }
}

AUTH_PROFILE_MODULE = 'api.User'
SOCIAL_AUTH_USER_MODEL = 'api.User'

FACEBOOK_APP_ID = '220283271338035'
FACEBOOK_API_SECRET = '0cac4be4d10a908b2b961f6ea6108b0f'

# the django-social-auth module uses the @login_required
# decorator, which directs browsers to settings.LOGIN_URL
# after either a successful OR failed login
LOGIN_URL = '/'
LOGOUT_URL = '/'

SOCIAL_AUTH_LOGIN_REDIRECT_URL = LOGIN_REDIRECT_URL = LOGIN_URL
SOCIAL_AUTH_NEW_USER_REDIRECT_URL = '/welcome'

SOCIAL_AUTH_DEFAULT_USERNAME = 'user'
FACEBOOK_EXTENDED_PERMISSIONS = ['offline_access', 'publish_stream', 'read_stream', 'email']

AUTHENTICATION_SWAP_SECRET = '1020Amsterdam'

import djcelery
djcelery.setup_loader()

# broker transport
BROKER_BACKEND = "djkombu.transport.DatabaseTransport"

# Periodic task definitions go here
from datetime import timedelta
CELERYBEAT_SCHEDULE = {
    "refresh-friend-list-every-10-mins": {
        "task": "api.tasks.refresh_friends_list",
        "schedule": timedelta(minutes=10)
    },
    "fetch-news-feed-every-5-mins": {
        "task": "api.tasks.fetch_news_feed",
        "schedule": timedelta(minutes=5)
    },
}

# For the facebook friends list fetcher, number of users to schedule every time
# the task gets fired.
FACEBOOK_FRIENDS_FETCHER_SCHEDULE = 10

# Number of users to schedule for news feed fetch every time
FACEBOOK_NEWS_FEED_FETCH_SCHEDULE = 25

# Set up logging
import logconfig
logconfig.init()

# Session cookies
SESSION_COOKIE_AGE = 2592000 # 30 days in seconds
SESSION_COOKIE_NAME = '_KVS' # Plugin converts this into a kikin cookie
SESSION_COOKIE_DOMAIN = '.watchlr.com' # Cross-domain!
SESSION_COOKIE_HTTPONLY = True # Prevent script access to cookie

# Caching
cache_configurations = {
    'local': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'TIMEOUT': 600,
        'OPTIONS': {
            'MAX_ENTRIES': 5000,
        },
    },
    'local_sqlite': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    },
    'dev': {
        'BACKEND': 'johnny.backends.memcached.MemcachedCache',
        'JOHNNY_CACHE': True,
        'LOCATION': ['127.0.0.1:11211',],
        'TIMEOUT': 0,
    },
    'prod': {
        'BACKEND': 'johnny.backends.memcached.MemcachedCache',
        'JOHNNY_CACHE': True,
        'LOCATION': ['cache.jpm4bl.0001.use1.cache.amazonaws.com:11211',],
        'TIMEOUT': 0,
    }
}

CACHES = { 'default': cache_configurations[VIDEO_ENV] }

JOHNNY_MIDDLEWARE_KEY_PREFIX = 'kikinvideo'

# Uncomment this to disable QuerySet caching
#DISABLE_QUERYSET_CACHE = VIDEO_ENV.startswith('local')

#frontend feature switches
ENABLE_HTML5_VIDEO = True

# Use SES as email backend.
EMAIL_BACKEND = 'django_ses.SESBackend'

AWS_ACCESS_KEY_ID = 'AKIAIZDME4VOHZPYNXSQ'
AWS_SECRET_ACCESS_KEY = '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'

SENDER_EMAIL_ADDRESS = 'Watchlr <noreply@watchlr.com>'

# IE cross-domain cookie fix
P3P_COMPACT = 'policyref="http://www.example.com/p3p.xml", CP="NON DSP COR CURa TIA"'
MIDDLEWARE_CLASSES += ('kikinvideo.middleware.P3PHeaderMiddleware',)

# Analytics: IP-based geolocation
GEOIP_DATABASE_PATH = os.environ.get('GEOIP_DATABASE_PATH', '/opt/video_env/GeoIP.dat')

# Analytics dashboard is restricted to these IPs
INTERNAL_IPS = ('69.193.216.26',)
