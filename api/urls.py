from django.conf.urls.defaults import patterns, include, url
from kikinvideo import settings

urlpatterns = patterns('api',
#    (r'^auth/profile', 'views.authenticate'),
     (r'^list', 'views.list'),
#    (r'^save', 'views.save'),
#    (r'remove', 'views.remove'),
#    (r'update', 'views.update'),
)