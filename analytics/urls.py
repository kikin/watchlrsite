from django.conf.urls.defaults import patterns

urlpatterns = patterns(
    'analytics',
    (r'^action', 'views.action'),
    (r'^event', 'views.event'),
)