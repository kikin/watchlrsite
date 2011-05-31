from django.conf.urls.defaults import patterns, include, url
from kikinvideo import settings

urlpatterns = patterns('webapp',
	(r'^$', 'views.home'),
	(r'^logout', 'views.logout_view'),
    (r'^content/liked_videos', 'views.liked_video_queue'),
    (r'^content/saved_videos', 'views.saved_video_queue'),
    (r'content/profile_edit', 'views.profile_edit'),
)

urlpatterns += patterns('',
	(r'^api/$', include('api.urls')),
)
