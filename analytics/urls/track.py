from django.conf.urls.defaults import patterns

urlpatterns = patterns(
    '',
    (r'^action', 'kikinvideo.analytics.views.action'),
    (r'^event', 'kikinvideo.analytics.views.event'),
    (r'^error', 'kikinvideo.analytics.views.error'),
)