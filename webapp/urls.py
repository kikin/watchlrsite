from django.conf.urls.defaults import patterns, include, url
from django.conf import settings

urlpatterns = patterns('webapp',
                       (r'^$', 'views.home'),
                       (r'^login_complete$', 'views.login_complete'),
                       (r'^logout', 'views.logout_view'),
                       (r'^content/liked_videos', 'views.liked_video_queue'),
                       (r'^content/saved_videos', 'views.saved_video_queue'),
                       (r'^content/profile_edit', 'views.profile_edit'),
                       url(r'^video/(?P<video_id>[0-9]+)', 'views.video_detail', name='video_detail'),
                       #any root-level urls must be defined here, ABOVE
                       #the public_profile view url routing rule...
                       #ex. (r'^about', 'views.about'),
                       (r'^(?P<username>[a-zA-Z0-9]+)$', 'views.public_profile'),
                       (r'^content/plugin_pitch', 'views.plugin_pitch'),
                       )

urlpatterns += patterns('',
                        (r'^api/$', include('api.urls')),
                        )
