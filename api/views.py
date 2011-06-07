from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

from api.exception import ApiError, Unauthorized, VideoNotFound, BadRequest
from api.models import Video, User, UserVideo, Source, Notification, Preference, slugify, Thumbnail
from api.utils import epoch, url_fix, MalformedURLException
from api.tasks import fetch

from re import split
from json import loads, dumps
from decimal import Decimal

import logging
logger = logging.getLogger('kikinvideo')

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
                'likes': UserVideo.like_count(obj.video),
                'saved': obj.saved,
                'saves': UserVideo.save_count(obj.video),
                'position': obj.position}

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
                'liked': obj.liked_videos().count()}

    elif isinstance(obj, Source):
        return {'name': obj.name,
                'url': obj.url,
                'favicon': obj.favicon}

    elif isinstance(obj, Thumbnail):
        return {'url': obj.url,
                'width': obj.width,
                'height': obj.height}

    elif isinstance(obj, Video):
        return {'id': obj.id,
                'url': obj.url,
                'title': obj.title,
                'description': obj.description,
                'thumbnail': as_dict(obj.get_thumbnail()),
                'source': as_dict(obj.source),
                'saves': UserVideo.save_count(obj),
                'likes': UserVideo.like_count(obj)}

    raise Exception('Unknown type:%s' % type(obj))


def do_request(request, video_id, method):
    if not request.user.is_authenticated():
        raise Unauthorized()
    try:
        return as_dict(getattr(request.user, method)(Video.objects.get(pk=video_id)))
    except Video.DoesNotExist:
        raise VideoNotFound(video_id)


def get_host(request):
    return request.META.get('HTTP_REFERER')


@json_view
def like(request, video_id):
    return do_request(request, video_id, 'like_video')


# See note on `profile()` method about CSRF exemption

@csrf_exempt
@json_view
@require_http_methods(['GET', 'POST'])
def like_by_url(request):
    if not request.user.is_authenticated():
        raise Unauthorized()

    querydict = request.GET if request.method == 'GET' else request.POST
    try:
        normalized_url = url_fix(querydict['url'])
    except MalformedURLException:
        raise BadRequest('Malformed URL:%s' % url)

    try:
        user_video = request.user.like_video(Video.objects.get(url=normalized_url))
    except KeyError:
        raise BadRequest('Parameter:url missing')
    except Video.DoesNotExist:
        video = Video(url=normalized_url)
        video.save()

        user_video = UserVideo(user=request.user, video=video, host=get_host(request), liked=True)
        user_video.save()

        # Fetch video metadata in background
        fetch.delay(request.user.id, normalized_url, user_video.host)

    return as_dict(user_video)


@json_view
def unlike(request, video_id):
    return do_request(request, video_id, 'unlike_video')


# See note on `profile()` method about CSRF exemption

@csrf_exempt
@json_view
@require_http_methods(['GET', 'POST'])
def unlike_by_url(request):
    if not request.user.is_authenticated():
        raise Unauthorized()

    querydict = request.GET if request.method == 'GET' else request.POST
    try:
        normalized_url = url_fix(querydict['url'])
    except MalformedURLException:
        raise BadRequest('Malformed URL:%s' % url)

    try:
        return as_dict(request.user.unlike_video(Video.objects.get(url=normalized_url)))
    except KeyError:
        raise BadRequest('Parameter:url missing')
    except Video.DoesNotExist:
        raise VideoNotFound(url)


@json_view
def save(request, video_id):
    return do_request(request, video_id, 'save_video')


# See note on `profile()` method about CSRF exemption

@csrf_exempt
@json_view
@require_http_methods(['GET', 'POST'])
def add(request):
    if not request.user.is_authenticated():
        raise Unauthorized()

    querydict = request.GET if request.method == 'GET' else request.POST
    try:
        url = querydict['url']
    except KeyError:
        raise BadRequest('Parameter:url missing')

    try:
        normalized_url = url_fix(url)
    except MalformedURLException:
        raise BadRequest('Malformed URL:%s' % url)

    try:
        user_video = UserVideo.objects.get(user=request.user, video__url=normalized_url)

        if user_video.saved:
            raise BadRequest('Video:%s already saved with id:%s' % (user_video.video.url, user_video.video.id))

        video['saved'] = True

    except UserVideo.DoesNotExist:
        try:
            video = Video.objects.get(url=normalized_url)
        except Video.DoesNotExist:
            video = Video(url=normalized_url)
            video.save()

        user_video = UserVideo(user=request.user, video=video, host=get_host(request), saved=True)
        user_video.save()

    # Fetch video metadata in background
    fetch.delay(request.user.id, normalized_url, user_video.host)

    info = as_dict(user_video)
    info.update({'first': request.user.saved_videos().count() == 1,
                 'unwatched': request.user.unwatched_videos().count()})

    return info

@json_view
def remove(request, video_id):
    return do_request(request, video_id, 'remove_video')


@json_view
def get(request, video_id):
    try:
        video = as_dict(Video.objects.get(pk=video_id))

        if request.user.is_authenticated():
            try:
                user_video = UserVideo.objects.get(user=request.user, video__id=video_id)

                video['saved'] = user_video.saved
                video['host'] = user_video.host
                video['timestamp'] = epoch(user_video.saved_timestamp)
                video['liked'] = user_video.liked
                video['watched'] = user_video.watched
                return {'videos': [ video ] }

            except UserVideo.DoesNotExist:
                pass

        video['saved'] = video['liked'] = video['watched'] = False
        video['host'] = video['timestamp'] = None
        return {'videos': [ video ] }

    except Video.DoesNotExist:
        raise VideoNotFound(video_id)


# See note on `profile()` method about CSRF exemption

@csrf_exempt
@json_view
@require_http_methods(['GET', 'POST'])
def info(request):
    querydict = request.GET if request.method == 'GET' else request.POST

    # Either as GET/POST parameter or REST-style url component
    urls = querydict.get('urls')
    if urls is not None:
      urls = [{ 'url': url } for url in split(r',\s*', urls)]

    # JSON payload in request body
    elif 'videos' in querydict:
      try:
        urls = loads(querydict['videos'])
      except:
        raise BadRequest('No JSON object could be decoded')

    else:
      raise BadRequest('Must supply url list or video array')

    requested, response = dict(), dict()

    try:
      for item in urls:
        try:
          normalized_url = url_fix(item['url'])
          requested[normalized_url] = item

        except MalformedURLException:
          item['success'] = False
          item['error'] = 'Malformed URL'
          response[item['url']] = item

    except (TypeError, KeyError):
      raise BadRequest('Input incorrectly formatted')

    authenticated = request.user.is_authenticated()

    if authenticated:
      for user_video in UserVideo.objects.filter(user=request.user):
        url = user_video.video.url

        try:
          response[url] = requested[url]
        except KeyError:
          continue

        response[url]['normalized'] = url
        response[url]['success'] = True
        response[url]['saved'] = user_video.saved
        response[url]['saves'] = UserVideo.save_count(user_video.video)
        response[url]['liked'] = user_video.liked
        response[url]['likes'] = UserVideo.like_count(user_video.video)

    for url in set(requested.keys()) - set(response.keys()):
      response[url] = requested[url]
      response[url]['normalized'] = url
      response[url]['success'] = True
      response[url]['saved'] = response[url]['liked'] = False

      try:
        video = Video.objects.get(url=url)
        response[url]['saves'] = UserVideo.save_count(video)
        response[url]['likes'] = UserVideo.like_count(video)
      except Video.DoesNotExist:
        response[url]['saves'] = response[url]['likes'] = 0

    return { 'authenticated': authenticated, 'videos': response.values() }


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
        except (TypeError, ValueError, Preference.DoesNotExist):
            raise BadRequest('Parameter:preferences malformed')

        user.save()

    return as_dict(user)

@json_view
@require_http_methods(['GET',])
def list(request):
    user = request.user

    if not user.is_authenticated():
        raise Unauthorized()

    try:
        count = int(request.GET['count'])
    except (KeyError, ValueError):
        count = 10

    list_fn = user.liked_videos if request.GET.get('likes').lower() in ('1', 'true') else user.saved_videos
    paginator = Paginator(list_fn(), count)

    try:
        page = int(request.GET['page'])
    except (KeyError, ValueError):
        # If page is not an integer, deliver first page.
        page = 1

    try:
        items = paginator.page(page).object_list
    except EmptyPage:
        # If page is out of range, deliver last page of results.
        items = paginator.page(paginator.num_pages).object_list

    try:
        type = request.GET['type']
        if not type in ('html', 'html5'):
            raise ValueError
    except (KeyError, ValueError):
        type = 'html'

    videos = []
    for item in items:
        video = as_dict(item)
        video['html'] = getattr(item, '%s_embed_code' % type)
        videos.append(video)

    return {'page': page,
            'count': len(videos),
            'total': paginator.count,
            'videos': videos}


def seek(request, video_id, position):
    if not request.user.is_authenticated():
        raise Unauthorized()

    try:
        user_video = UserVideo.objects.filter(user=request.user, video__id=video_id)
    except UserVideo.DoesNotExist:
        raise BadRequest('')

    user_video.position = Decimal(position)
    user_video.save()

    return as_dict(user_video)
