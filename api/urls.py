from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns(
    'api',
    (r'^like/(?P<video_id>[0-9]+)$', 'views.like'),
    (r'^like', 'views.like_by_url'),
    (r'^unlike/(?P<video_id>[0-9]+)$', 'views.unlike'),
    (r'^unlike', 'views.unlike_by_url'),
    (r'^save/(?P<video_id>[0-9]+)$', 'views.save'),
    (r'^add', 'views.add'),
    (r'^remove/(?P<video_id>[0-9]+)$', 'views.remove'),
    (r'^auth/profile$', 'views.profile'),
    (r'^get/(?P<video_id>[0-9]+)$', 'views.get'),
    (r'^info', 'views.info'),
    (r'^list', 'views.list'),
    (r'^seek/(?P<video_id>[0-9]+)/(?P<position>[0-9]{1,3}(\.[0-9]{1,2})?)$', 'views.seek'),
    (r'^auth/swap/(?P<facebook_id>[0-9]+)$', 'views.swap'),
    (r'^follow/(?P<other>[a-zA-Z0-9]+)$', 'views.follow'),
    (r'^unfollow/(?P<other>[a-zA-Z0-9]+)$', 'views.unfollow'),
)