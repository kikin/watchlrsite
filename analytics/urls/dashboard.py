from django.conf.urls.defaults import patterns

urlpatterns = patterns(
    '',
    (r'^/?$', 'kikinvideo.analytics.views.index'),
    (r'^/userbase', 'kikinvideo.analytics.views.userbase'),
    (r'^/views', 'kikinvideo.analytics.views.views'),
    (r'^/saves', 'kikinvideo.analytics.views.saves'),
    (r'^/likes', 'kikinvideo.analytics.views.likes'),
    (r'^/follows', 'kikinvideo.analytics.views.follows'),
)