from django.conf.urls.defaults import patterns, include, url
from kikinvideo import settings

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('webapp',
	(r'^$', 'views.home'),
	(r'^logout', 'views.logout_view'),
    (r'^content/liked_videos', 'views.liked_video_queue'),
    (r'^content/saved_videos', 'views.saved_video_queue'),
)

urlpatterns += patterns('',
	(r'^api/$', include('api.urls')),
)
