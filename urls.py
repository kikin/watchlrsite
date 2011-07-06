from django.conf.urls.defaults import *
from django.conf.urls.static import static
import settings

urlpatterns = patterns('',
                       (r'^favicon\.ico$', 'django.views.generic.simple.redirect_to', {'url': '/static/images/favicon.ico'}),
                       url(r'', include('social_auth.urls')),
                       (r'^api/', include('kikinvideo.api.urls')),
                       url(r'^task/', include('djcelery.urls')),
                       (r'^', include('kikinvideo.webapp.urls')),
                       )

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)