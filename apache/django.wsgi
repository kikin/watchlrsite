import sys
import os
import site

sys.stdout = sys.stderr

site.addsitedir('/opt/video_env/env/lib/python2.6/site-packages')

# Add application directory to PYTHONPATH
sys.path.append('/opt/video_env')
sys.path.append('/opt/video_env/kikinvideo')

os.environ['DJANGO_SETTINGS_MODULE'] = 'kikinvideo.settings'

import django.core.handlers.wsgi
_application = django.core.handlers.wsgi.WSGIHandler()

def application(environ, start_response):
  os.environ['VIDEO_ENV'] = environ['VIDEO_ENV']
  return _application(environ, start_response)

# See http://celeryproject.org/docs/django-celery/introduction.html#special-note-for-mod-wsgi-users
os.environ["CELERY_LOADER"] = "django"

# Logging WSGI middleware.
import pprint

class LoggingMiddleware:

    def __init__(self, application):
        self.__application = application

    def __call__(self, environ, start_response):
        errors = environ['wsgi.errors']
        pprint.pprint(('REQUEST', environ), stream=errors)

        def _start_response(status, headers):
            pprint.pprint(('RESPONSE', status, headers), stream=errors)
            return start_response(status, headers)

        return self.__application(environ, _start_response)

# Uncomment following line to enable request/response logging
#application = LoggingMiddleware(application)
