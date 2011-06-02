from django.http import HttpResponse

from api.exception import ApiError, Unauthorized, VideoNotFound
from api.models import Video

from json import dumps

import logging, logconfig
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger('api')

def json_view(f):
    def wrap(request, *args, **kwargs):
        response = None
        try:
            result = f(request, *args, **kwargs)
            assert isinstance(result, dict)
            response = { 'success': True,
                         'result': result }

        except KeyboardInterrupt:
            # Allow keyboard interrupts through for debugging.
            raise

        except ApiError, exc:
            # Let API errors pass through
            response = { 'success': False,
                         'code': exc.code,
                         'error': exc.reason }

        except Exception, e:
            try:
                request_repr = repr(request)
            except:
                request_repr = 'Request unavailable'
            logger.exception(request_repr)

            # Come what may, we're returning JSON.
            response = { 'success': False,
                         'code': 500,
                         'error': 'Unknown server error' }

        json = dumps(response)
        return HttpResponse(json, mimetype='application/json')
    return wrap

def do_request(request, video_id, method):
    if not request.user.is_authenticated():
        raise Unauthorized()
    try:
        return getattr(request.user, method)(Video.objects.get(pk=video_id)).info_view()
    except Video.DoesNotExist:
        raise VideoNotFound(video_id)

@json_view
def like(request, video_id):
    return do_request(request, video_id, 'like_video')

@json_view
def unlike(request, video_id):
    return do_request(request, video_id, 'unlike_video')

@json_view
def save(request, video_id):
    return do_request(request, video_id, 'save_video')

@json_view
def remove(request, video_id):
    return do_request(request, video_id, 'remove_video')