from django.conf.urls.defaults import patterns, include, url
from django.conf.urls.static import static
import socialregistration
import settings

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'video.views.home', name='home'),
    # url(r'^video/', include('video.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
	(r'^', include('kikinvideo.webapp.urls')),
    (r'^api/', include('kikinvideo.api.urls')),
    ('^social/',include('socialregistration.urls')),
)

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)