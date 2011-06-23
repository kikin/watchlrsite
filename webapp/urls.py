from django.conf.urls.defaults import patterns, include, url
from django.conf import settings

urlpatterns = patterns('webapp',
                       (r'^$', 'views.home'),
                       (r'^terms_of_service', 'views.tos'),
                       (r'^about', 'views.about'),
                       (r'^contact', 'views.contact'),
                       (r'^download', 'views.download_pitch'),
                       (r'^login_complete$', 'views.login_complete'),
                       (r'^logout', 'views.logout_view'),
                       (r'^content/liked_videos', 'views.liked_video_queue'),
                       (r'^content/saved_videos', 'views.saved_video_queue'),
                       (r'^content/activity', 'views.activity'),
                       (r'^content/profile_edit', 'views.profile_edit'),
                       url(r'^video/(?P<video_id>[0-9]+)', 'views.video_detail', name='video_detail'),
                       (r'^content/plugin_pitch', 'views.plugin_pitch'),
                       (r'^following/(?P<user_id>[0-9]+)', 'views.following'),
                       (r'^followers/(?P<user_id>[0-9]+)', 'views.followers'),
                       (r'video_liked_by/(?P<video_id>[0-9]+)', 'views.video_liked_by'),
                       url(r'^(?P<username>[a-zA-Z0-9\.]+)$', 'views.public_profile', name='user_profile'),
                       )

urlpatterns += patterns('',
                        (r'^api/$', include('api.urls')),
                        )
