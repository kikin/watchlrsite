from django.conf.urls.defaults import patterns, include, url
from django.conf.urls.static import static
import settings

urlpatterns = patterns('',
	(r'^', include('kikinvideo.webapp.urls')),
  (r'^api/', include('kikinvideo.api.urls')),
  url(r'', include('social_auth.urls')),
)

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)