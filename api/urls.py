from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns(
    'api',
    (r'^like/(?P<video_id>[0-9]+)$', 'views.like'),
)