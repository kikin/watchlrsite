from django.conf import settings

class P3PHeaderMiddleware(object):
    def process_response(self, request, response):
        response['P3P'] = getattr(settings, 'P3P_COMPACT', None)
        return response