from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

from api.exception import ApiError, Unauthorized, VideoNotFound, BadRequest
from api.models import Video, User, UserVideo, Notification, Preference, slugify

from json import loads, dumps

import logging
logger = logging.getLogger(__name__)

def json_view(f):
    def wrap(request, *args, **kwargs):
        response = None
        try:
            result = f(request, *args, **kwargs)
            assert isinstance(result, dict)
            response = {'success': True,
                        'result': result}

        except KeyboardInterrupt:
            # Allow keyboard interrupts through for debugging.
            raise

        except ApiError, exc:
            # Let API errors pass through
            response = {'success': False,
                        'code': exc.code,
                        'error': exc.reason}

        except Exception, e:
            try:
                request_repr = repr(request)
            except:
                request_repr = 'Request unavailable'
            logger.exception(request_repr)

            # Come what may, we're returning JSON.
            response = {'success': False,
                        'code': 500,
                        'error': 'Unknown server error'}

        json = dumps(response)
        return HttpResponse(json, mimetype='application/json')

    return wrap


def as_dict(obj):
    if isinstance(obj, UserVideo):
        return {'url': obj.video.url,
                'id': obj.video.id,
                'liked': obj.liked,
                'likes': UserVideo.objects.filter(video=obj.video, liked=True).count(),
                'saved': obj.saved,
                'saves': UserVideo.objects.filter(video=obj.video, saved=True).count()}

    elif isinstance(obj, User):
        return {'name': ' '.join([obj.first_name, obj.last_name]),
                'username': obj.username,
                'picture': obj.picture(),
                'email': obj.email,
                'notifications': obj.notifications(),
                'preferences': obj.preferences(),
                'queued': obj.saved_videos().count(),
                'saved': obj.videos.count(),
                'watched': obj.watched_videos().count(),
                'liked': obj.liked_videos().count() }

    raise Exception('Unknown type:%s' % type(obj))


def do_request(request, video_id, method):
    if not request.user.is_authenticated():
        raise Unauthorized()
    try:
        return as_dict(getattr(request.user, method)(Video.objects.get(pk=video_id)))
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

class InvalidUsername(ApiError):
    code = 406

    def __init__(self, suggested):
        super(InvalidUsername, self).__init__(self.code, suggested)


# We need to disable CSRF because this call is also used by the plugin to clear out
# certain notifications.
# More about CSRF here - https://docs.djangoproject.com/en/dev/ref/contrib/csrf/

@csrf_exempt
@json_view
def profile(request):
    '''
    Fetch and/or update user profile.

    To update profile, make a POST request with one or more of the following parameters:
        username, email, notifications, preferences
    notifications and preferences should be JSON serialized objects (like in the Fetch response).

    If supplied username parameter is invalid or taken, this method responds with the standard API
    error response and code set to 406. The error message field will then contain alternate valid username
    composed from the input string.
    Example:
    > curl -b 'sessionid={sessionid}' -d 'username=foo bar' 'http://{hostname}/api/auth/profile'
    < {"code": 406, "success": false, "error": "foobar"}
    '''

    user = request.user

    if not user.is_authenticated():
        raise Unauthorized()

    if request.method == 'POST':
        if any([request.POST.get(p) for p in ('username', 'email', 'notifications', 'preferences')]):
            logger.info('Updating profile for user:%s, params:%s' % (request.user.id, str(request.POST)))

        try:
            username = slugify(request.POST['username'], user.id)
            if not username == request.POST['username']:
                raise InvalidUsername(username)
            user.username = username
        except KeyError:
            pass

        try:
            # TODO: Email address validation
            user.email = request.POST['email']
        except KeyError:
            pass

        try:
            user.set_notifications(loads(request.POST['notifications']))
        except KeyError:
            pass
        except (TypeError, ValueError, Notification.DoesNotExist):
            raise BadRequest('Parameter:notifications malformed')

        try:
            user.set_preferences(loads(request.POST['preferences']))
        except KeyError:
            pass
        except (TypeError, ValueError):
            raise BadRequest('Parameter:preferences malformed')

        user.save()

    return as_dict(user)
