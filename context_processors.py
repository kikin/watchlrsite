from django.conf import settings

def release_version(context):
    return { 'VERSION': settings.VERSION }