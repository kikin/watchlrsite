from django.conf.urls.defaults import *
from django.conf.urls.static import static
from django.views.generic import TemplateView
import settings

urlpatterns = patterns('',
                       (r'^favicon\.ico$', 'django.views.generic.simple.redirect_to', {'url': '/static/images/favicon.ico'}),
                       url(r'', include('social_auth.urls')),
                       (r'^api/', include('kikinvideo.api.urls')),
                       url(r'^task/', include('djcelery.urls')),
                       (r'track/', include('kikinvideo.analytics.urls.track')),
                       (r'analytics', include('kikinvideo.analytics.urls.dashboard')),
                       (r'^', include('kikinvideo.webapp.urls')),
                       )

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)