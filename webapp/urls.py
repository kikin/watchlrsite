from django.conf.urls.defaults import patterns, include, url
from kikinvideo import settings

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('webapp',
	(r'^$', 'views.home'),
    (r'^profile/', 'views.profile'),
    (r'^content/video_queue', 'views.video_queue'),
)