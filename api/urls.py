from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns(
    'api',
    (r'^like/(?P<video_id>[0-9]+)$', 'views.like'),
    (r'^unlike/(?P<video_id>[0-9]+)$', 'views.unlike'),
    (r'^save/(?P<video_id>[0-9]+)$', 'views.save'),
    (r'^remove/(?P<video_id>[0-9]+)$', 'views.remove'),
    (r'^auth/profile$', 'views.profile'),
)