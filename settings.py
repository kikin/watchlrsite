# Django settings for video project.

import sys, os

sys.path.append(os.getcwd())

DEBUG = True
TEMPLATE_DEBUG = DEBUG

ADMINS = (
    ('Sandesh Devaraju', 'sandesh@kikin.com'),
)

MANAGERS = ADMINS

database_configurations = {
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
        'HOST': '/opt/local/var/run/mysql5/mysqld.sock',
        'PORT': '',
        },
    'local_sqlite':{
        'ENGINE':'django.db.backends.sqlite3',
        'NAME':'kikinvideo',
    }
}

# Picks up database configuration from environment variable
active_db = os.environ.get('VIDEO_ENV', 'local')

DATABASES = { 'default': database_configurations['active_db'] }

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# On Unix systems, a value of None will cause Django to use the same
# timezone as the operating system.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'America/Chicago'

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
    'django.core.context_processors.auth',
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
)

ROOT_URLCONF = 'kikinvideo.urls'

TEMPLATE_DIRS = ( os.path.abspath('.') + '/webapp/templates',)

INSTALLED_APPS = (
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

FACEBOOK_APP_ID = '0d50511f22c6ec9f3a78db5f724e320d'
FACEBOOK_API_SECRET = '3271261af598bdeb1a260699dd5b18ca'

LOGIN_REDIRECT_URL = '/login_complete'
LOGOUT_URL = '/'

SOCIAL_AUTH_DEFAULT_USERNAME = 'user'
FACEBOOK_EXTENDED_PERMISSIONS = ['offline_access', 'publish_stream', 'read_stream', 'email']

import djcelery
djcelery.setup_loader()

# broker transport
BROKER_BACKEND = "djkombu.transport.DatabaseTransport"

# Set up logging
from logging import basicConfig, DEBUG
basicConfig(level=DEBUG)

import logconfig
logconfig.init()

# Session cookies
SESSION_COOKIE_AGE = 2592000 # 30 days in seconds
SESSION_COOKIE_NAME = '_KVS' # Plugin converts this into a kikin cookie
SESSION_COOKIE_DOMAIN = '.kikin.com' # Cross-domain!
