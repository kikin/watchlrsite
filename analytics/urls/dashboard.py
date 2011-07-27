from django.conf.urls.defaults import patterns

urlpatterns = patterns(
    '',
    (r'^/?$', 'kikinvideo.analytics.views.index'),
)