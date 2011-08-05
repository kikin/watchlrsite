from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.paginator import Paginator, EmptyPage
from django.contrib.sessions.backends.db import SessionStore
from django.contrib.sessions.models import Session
from django.contrib.sites.models import Site
from django.contrib.auth import authenticate

from kikinvideo.settings import AUTHENTICATION_SWAP_SECRET

from api.exception import ApiError, Unauthorized, VideoNotFound, BadRequest, BadGateway
from api.models import Video, User, UserVideo, Notification, Preference
from api.utils import epoch, url_fix, MalformedURLException
from api.tasks import fetch, push_like_to_fb, slugify

import hashlib
from re import split
from json import loads, dumps
from datetime import datetime
from decimal import InvalidOperation
from urllib2 import urlopen, URLError
from urllib import urlencode
from array import array
from base64 import b64decode

import logging
logger = logging.getLogger('kikinvideo')


def require_authentication(f):
    def wrap(request, *args, **kwargs):
        user = request.user

        if not user.is_authenticated():
            try:
                # Clients can send session key as a request parameter
                session_key = request.REQUEST['session_id']
                session = Session.objects.get(pk=session_key)
            except (KeyError, Session.DoesNotExist):
                raise Unauthorized()

            if session.expire_date <= datetime.now():
                raise Unauthorized()

            uid = session.get_decoded().get('_auth_user_id')
            request.user = User.objects.get(pk=uid)

        return f(request, *args, **kwargs)

    return wrap


def jsonp_view(f):
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
            response = { 'success': False,
                         'code': exc.code,
                         'error': exc.reason }

        except Exception:
            logger.exception('Error processing request: %s' % request.get_full_path())

            # Come what may, we're returning JSON.
            response = { 'success': False,
                         'code': 500,
                         'error': 'Unknown server error' }

        json = dumps(response)

        callback = request.REQUEST.get('callback')
        if not callback:
            jsonp, mimetype = json, "application/json"
        else:
            jsonp, mimetype = '%s(%s);' % (callback, json), "text/javascript"

        return HttpResponse(jsonp, mimetype=mimetype)

    return wrap


def do_request(request, video_id, method):
    try:
        user_video = getattr(request.user, method)(Video.objects.get(pk=video_id))
        return user_video.json()
    except Video.DoesNotExist:
        raise VideoNotFound(video_id)


@jsonp_view
@require_authentication
def like(request, video_id):
    try:
        video = Video.objects.get(pk=video_id)
    except Video.DoesNotExist:
        raise VideoNotFound(video_id)

    user = request.user
    try:
        UserVideo.objects.get(user=user, video=video, liked_timestamp__isnull=False)
    except UserVideo.DoesNotExist:
        push_like_to_fb.delay(video_id, user)

    user_video = do_request(request, video_id, 'like_video')
    return user_video


# See note on `profile()` method about CSRF exemption

@csrf_exempt
@jsonp_view
@require_http_methods(['GET', 'POST'])
def like_by_url(request):
    if not request.user.is_authenticated():
        raise Unauthorized()

    querydict = request.GET if request.method == 'GET' else request.POST
    try:
        url = url_fix(querydict['url'])
    except KeyError:
        raise BadRequest('Parameter:url missing')
    except MalformedURLException:
        raise BadRequest('Malformed URL:%s' % querydict['url'])

    try:
        video = Video.objects.get(url=url)

        try:
            UserVideo.objects.get(user=request.user, video=video, liked_timestamp__isnull=False)
        except UserVideo.DoesNotExist:
            push_like_to_fb.delay(video.id, request.user)

        user_video = request.user.like_video(video)

    except Video.DoesNotExist:
        video = Video(url=url)

        # Fetch video metadata in background
        task = fetch.delay(request.user.id,
                           url,
                           request.META.get('HTTP_REFERER'),
                           callback=push_like_to_fb.subtask((request.user, )))

        video.task_id = task.task_id
        video.save()

        user_video = UserVideo(user=request.user,
                               video=video,
                               host=request.META.get('HTTP_REFERER'),
                               liked=True,
                               liked_timestamp=datetime.utcnow())
        user_video.save()

    info = user_video.json()
    info.update({ 'firstlike': request.user.notifications()['firstlike'],
                  'task_id': user_video.video.task_id })
    return info


@jsonp_view
@require_authentication
def unlike(request, video_id):
    if request.REQUEST.get('remove', '').lower() in ('true', '1'):
        do_request(request, video_id, 'remove_video')
    return do_request(request, video_id, 'unlike_video')


# See note on `profile()` method about CSRF exemption

@csrf_exempt
@jsonp_view
@require_http_methods(['GET', 'POST'])
def unlike_by_url(request):
    if not request.user.is_authenticated():
        raise Unauthorized()

    querydict = request.GET if request.method == 'GET' else request.POST
    try:
        normalized_url = url_fix(querydict['url'])
    except KeyError:
        raise BadRequest('Parameter:url missing')
    except MalformedURLException:
        raise BadRequest('Malformed URL:%s' % querydict['url'])

    try:
        user_video = request.user.unlike_video(Video.objects.get(url=normalized_url))
        return user_video.json()
    except Video.DoesNotExist:
        raise VideoNotFound(normalized_url)


@jsonp_view
@require_authentication
def save(request, video_id):
    return do_request(request, video_id, 'save_video')


# See note on `profile()` method about CSRF exemption

@csrf_exempt
@jsonp_view
@require_http_methods(['GET', 'POST'])
def add(request):
    if not request.user.is_authenticated():
        raise Unauthorized()

    querydict = request.GET if request.method == 'GET' else request.POST
    try:
        url = url_fix(querydict['url'])
    except KeyError:
        raise BadRequest('Parameter:url missing')
    except MalformedURLException:
        raise BadRequest('Malformed URL:%s' % querydict['url'])

    try:
        user_video = UserVideo.objects.get(user=request.user, video__url=url)

        if user_video.saved:
            raise BadRequest('Video:%s already saved with id:%s' % (user_video.video.url, user_video.video.id))

    except UserVideo.DoesNotExist:
        try:
            video = Video.objects.get(url=url)
        except Video.DoesNotExist:
            video = Video(url=url)

            # Fetch video metadata in background
            task = fetch.delay(request.user.id, url, request.META.get('HTTP_REFERER'))
            video.task_id = task.task_id

            video.save()

        user_video = UserVideo(user=request.user, video=video)

    user_video.saved = True
    user_video.saved_timestamp = datetime.utcnow()
    user_video.host = request.META.get('HTTP_REFERER')
    user_video.save()

    info = user_video.json()
    info.update({ 'emptyq': request.user.notifications()['emptyq'],
                  'unwatched': request.user.unwatched_videos().count(),
                  'task_id': user_video.video.task_id })
    return info


@jsonp_view
@require_authentication
def remove(request, video_id):
    if request.REQUEST.get('unlike', '').lower() in ('true', '1'):
        do_request(request, video_id, 'unlike_video')
    return do_request(request, video_id, 'remove_video')


@jsonp_view
@require_http_methods(['GET',])
def get(request, video_id):
    try:
        type = request.GET['type']
        if not type in ('html', 'html5'):
            raise ValueError
    except (KeyError, ValueError):
        type = 'html'

    try:
        item = Video.objects.get(pk=video_id)
        video = item.json()
        video['html'] = getattr(item, '%s_embed_code' % type)

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
@jsonp_view
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

    # `list()` gets resolved over list type!
    if not isinstance(urls, type([])):
        urls = [urls,]
    
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

    info_response = { 'videos': response.values() }
    if authenticated:
        info_response['user'] = request.user.json()

    return info_response


class UsernameConflict(ApiError):
    code = 409

    def __init__(self, suggested):
        super(UsernameConflict, self).__init__(self.code, suggested)


class InvalidUsername(ApiError):
    code = 406

    def __init__(self, suggested):
        super(InvalidUsername, self).__init__(self.code, suggested)


# We need to disable CSRF because this call is also used by the plugin to clear out
# certain notifications.
# More about CSRF here - https://docs.djangoproject.com/en/dev/ref/contrib/csrf/

@csrf_exempt
@jsonp_view
@require_authentication
@require_http_methods(['GET', 'POST'])
def profile(request):
    """
    Fetch and/or update user profile.

    To update profile, make a GET/POST request with one or more of the following parameters:
        username, email, notifications, preferences
    notifications and preferences should be JSON serialized objects (like in the Fetch response).

    If supplied username parameter is invalid or taken, this method responds with the standard API
    error response and code set to 406. The error message field will then contain alternate valid username
    composed from the input string.
    Example:
    > curl -b 'sessionid={sessionid}' -d 'username=foo bar' 'http://{hostname}/api/auth/profile'
    < {"code": 406, "success": false, "error": "foobar"}
    """

    user = request.user

    querydict = request.POST if request.method == 'POST' else request.GET

    if querydict and not querydict.keys() == ['session_id']:
        logger.info('Updating profile for user:%s, params:%s' % (user.username, str(querydict)))

        try:
            username = slugify(querydict['username'], user.id)

            if not username == querydict['username']:
                if username.startswith(querydict['username']):
                    raise UsernameConflict(username)
                else:
                    raise InvalidUsername(username)

            user.username = username

        except KeyError:
            pass

        try:
            # TODO: Email address validation
            user.email = querydict['email']
        except KeyError:
            pass

        try:
            user.set_notifications(loads(querydict['notifications']))
        except KeyError:
            pass
        except (TypeError, ValueError, Notification.DoesNotExist):
            raise BadRequest('Parameter:notifications malformed')

        try:
            user.set_preferences(loads(querydict['preferences']))
        except KeyError:
            pass
        except (TypeError, ValueError, Preference.DoesNotExist):
            raise BadRequest('Parameter:preferences malformed')

        user.save()

    return user.json()


@jsonp_view
@require_authentication
@require_http_methods(['GET',])
def list(request):
    user = request.user

    try:
        count = int(request.GET['count'])
    except (KeyError, ValueError):
        count = 10

    # Liked video queue?
    likes = request.GET.get('likes', '').lower() in ('1', 'true')

    list_fn = user.liked_videos if likes else user.saved_videos
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
        video = item.json()

        user_video = UserVideo.objects.get(user=user, video=item)
        video['saved'] = user_video.saved
        video['liked'] = user_video.liked
        video['seek'] = float(user_video.position or 0)

        video['html'] = getattr(item, '%s_embed_code' % type)

        videos.append(video)

    return { 'page': page,
             'count': len(videos),
             'total': paginator.count,
             'videos': videos }


@csrf_exempt
@jsonp_view
@require_authentication
def seek(request, video_id, position=None):
    try:
        user_video = UserVideo.objects.get(user=request.user, video__id=video_id)
    except UserVideo.DoesNotExist:
        raise BadRequest('Video:%s invalid for user:%s' % (request.user.id, video_id))

    if position:
        try:
            user_video.position = position
            user_video.save()
        except InvalidOperation:
            raise BadRequest("Parameter:'position' malformed")

    return user_video.json()


@jsonp_view
def swap(request):
    from social_auth.models import UserSocialAuth
    from social_auth.backends.facebook import FacebookBackend, FACEBOOK_CHECK_AUTH

    def get_required_parameter(name):
        try:
            return request.REQUEST[name]
        except KeyError:
            raise BadRequest('Missing required parameter: %s' % name)

    def decode(token):
        tb = array('B', token)
        kb = array('B', AUTHENTICATION_SWAP_SECRET)
        j = 0
        for i in range(len(tb)):
            if j == len(kb):
                j = 0
            tb[i] = tb[i] ^ kb[j]
            j += 1
        return tb.tostring()

    facebook_id = get_required_parameter('id')
    access_token = get_required_parameter('token')
    checksum = get_required_parameter('checksum')

    # Ensure that this request is from a trusted client.

    params = { 'id': facebook_id, 'token': access_token, 'secret': AUTHENTICATION_SWAP_SECRET }

    server_name = 'http://www.watchlr.com'
#    server_name = Site.objects.get_current().domain

    full_path = '%s%s?id=%s&token=%s&secret=%s' % (server_name,
                                                   request.path_info,
                                                   params['id'],
                                                   params['token'],
                                                   params['secret'])

    md5 = hashlib.md5()
    md5.update(full_path)

    if not checksum == md5.hexdigest():
        raise BadRequest('Invalid checksum')

    try:
        # Check if user is already registered.
        user = UserSocialAuth.objects.get(uid=facebook_id).user
        if not user.is_registered:
            raise UserSocialAuth.DoesNotExist()

    except UserSocialAuth.DoesNotExist:

        # New user!

        # Add padding, if necessary
        if not access_token.endswith('=='):
            access_token += '=='

        url = FACEBOOK_CHECK_AUTH + '?' + urlencode({ 'access_token': decode(b64decode(access_token)) })

        json_response = None
        try:
            json_response = urlopen(url).read()
            data = loads(json_response)
        except URLError:
            logger.exception('Error verifying Facebook credentials')
            raise BadGateway('Could not verify Facebook credentials')
        except (TypeError, ValueError):
            logger.exception('Invalid JSON response for Facebook verify credentials: %s' % json_response)
            raise BadGateway('Could not verify Facebook credentials')

        if data is not None:
            if 'error' in data:
                error = self.data.get('error') or 'unknown error'
                raise Unauthorized('Authentication error: %s' % error)
            data['access_token'] = access_token

            kwargs = {'response': data, FacebookBackend.name: True}
            user = authenticate(**kwargs)
        else:
            error = data.get('error') or 'unknown error'
            raise Unauthorized('Authentication error: %s' % error)

    if not user.is_authenticated():
        raise Unauthorized()

    session = SessionStore()
    session['_auth_user_id'] = user.id
    session.save()

    return { 'session_id': session.session_key }


@jsonp_view
@require_authentication
def follow(request, other):
    user = request.user

    try:
        other = User.objects.get(pk=int(other))
    except ValueError:
        other = User.objects.get(username=other)
    except User.DoesNotExist:
        raise BadRequest('User:%s does not exist' % other)

    user.follow(other)

    return { 'username': user.username,
             'following': user.following_count(),
             'followers': user.follower_count() }


@jsonp_view
@require_authentication
def unfollow(request, other):
    user = request.user

    try:
        other = User.objects.get(pk=int(other))
    except ValueError:
        other = User.objects.get(username=other)
    except User.DoesNotExist:
        raise BadRequest('User:%s does not exist' % other)

    user.unfollow(other)

    return { 'username': user.username,
             'following': user.following_count(),
             'followers': user.follower_count() }


@jsonp_view
@require_authentication
def activity(request):
    user = request.user

    items = []
    for item in user.activity():

        users = []
        for user_like_tuple in item.users:
            users.append({'timestamp': user_like_tuple[1],
                          'user': user_like_tuple[0]})

        items.append({ 'type': 'like',
                       'video': item.video.json(),
                       'users': users })

    return items