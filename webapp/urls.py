from django.conf.urls.defaults import patterns, include, url
from django.conf import settings

urlpatterns = patterns('webapp',
                       (r'^$', 'views.home'),
                       (r'^download', 'views.download_pitch'),
                       (r'^login_complete$', 'views.login_complete'),
                       (r'^logout', 'views.logout_view'),
                       (r'^content/liked_videos', 'views.liked_video_queue'),
                       (r'^content/saved_videos', 'views.saved_video_queue'),
                       (r'^content/activity', 'views.activity'),
                       (r'^content/profile_edit', 'views.profile_edit'),
                       url(r'^video/(?P<video_id>[0-9]+)', 'views.video_detail', name='video_detail'),
                       (r'^content/plugin_pitch', 'views.plugin_pitch'),
                       # Any root-level urls must be defined ABOVE
                       # ex. (r'^about', 'views.about'),
                       (r'^(?P<username>[a-zA-Z0-9\.]+)$', 'views.public_profile'),
                       )

urlpatterns += patterns('',
                        (r'^api/$', include('api.urls')),
                        )
