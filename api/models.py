from datetime import datetime, timedelta
from itertools import chain
from decimal import Decimal
from hashlib import md5
from operator import attrgetter, itemgetter
from collections import defaultdict

try:
    from cpickle import dumps, loads
except ImportError:
    from pickle import dumps, loads

from django.db import models
from django.db.models import F, Max
from django.db.models.signals import post_save
from django.contrib.auth import models as auth_models
from django.dispatch import receiver
from django.core.urlresolvers import reverse
from django.core.cache import cache

from celery.app import default_app
from celery.task.control import revoke
from celery import states

from utils import epoch

import logging
logger = logging.getLogger(__name__)


# Value indicates if the notification message has been displayed and archived by user
DEFAULT_NOTIFICATIONS = {
    'welcome': False,    # Welcome experience for new users
    'emptyq': False,     # Queue location education for first-time video save
    'firstlike': False,  # User education for first liked video
}


DEFAULT_PREFERENCES = {
    'syndicate': 2,     # Syndicate likes to Facebook? 1 = Yes, 0 = No, 2 = Not set
    'follow_email': 1,  # Send email to user when someone follows them
}


def cache_get(key, default=None):
    cached = cache.get(key, default)

    result = 'HIT' if not cached == default else 'MISS'
    logger.debug('CACHE %s - %s' % (result, key))

    return cached


def cache_delete(keys):
    logger.debug('CACHE DELETE - [%s]' % ','.join(keys))
    cache.delete_many(keys)


def cache_set(key, value):
    logger.debug('CACHE SEED - %s' % key)
    cache.set(key, value)


class Source(models.Model):
    """
    Video source

    YouTube is a an example
    >>> youtube = Source.objects.create(name='YouTube', url='http://youtube.com',
    ... favicon='http://youtube.com/favicon.ico')

    `Source.name`:instance_attribute: should be unique
    >>> ripoff = Source.objects.create(name='YouTube', url='http://facetube.com') # doctest: +IGNORE_EXCEPTION_DETAIL
    Traceback (most recent call last):
      ...
    IntegrityError: duplicate key value violates unique constraint "api_source_name_key"
    """

    name = models.CharField(max_length=100, unique=True)
    url = models.URLField(max_length=750, verify_exists=False)
    favicon = models.URLField(max_length=750, verify_exists=False, null=True)

    def json(self):
        return { 'name': self.name, 'url': self.url, 'favicon': self.favicon }


class Video(models.Model):
    """
    Video object encapsulates metadata

    Example YouTube video
    >>> video = Video.objects.create(url='http://www.youtube.com/watch?v=kh29_SERH0Y')

    Set some metadata
    >>> video.title = 'The Art of FLIGHT'
    >>> video.save()

    Add `Source`
    >>> youtube = Source.objects.create(name='Youtube', url='http://youtube.com')
    >>> video.source = youtube

    Set thumbnail
    >>> video.set_thumbnail('http://i2.ytimg.com/vi/kh29_SERH0Y/0.jpg', 480, 360)
    >>> video.get_thumbnail().url
    u'http://i2.ytimg.com/vi/kh29_SERH0Y/0.jpg'
    """

    url = models.URLField(max_length=750, verify_exists=False, db_index=True)
    title = models.CharField(max_length=500, db_index=True, null=True)
    description = models.TextField(max_length=3000, null=True)
    html_embed_code = models.TextField(max_length=3000, null=True)
    html5_embed_code = models.TextField(max_length=3000, null=True)
    source = models.ForeignKey(Source, related_name='videos', null=True)
    fetched = models.DateTimeField(null=True, db_index=True)
    task_id = models.CharField(max_length=255, null=True, db_index=True)
    result = models.CharField(max_length=10, null=True)

    # MySQL cannot handle unique indices on columns > 255 characters.
    # As a workaround, ensure uniqueness on hash of URL field instead!
    _url_hash = models.CharField(db_column='url_hash', max_length=255, null=True, unique=True)

    def save(self, *args, **kwargs):
        self._url_hash = md5(self.url.encode('ascii', 'xmlcharrefreplace')).hexdigest()

        # Invalidate associated cache keys
        for user_video in UserVideo.objects.filter(video=self).exclude(saved=False, liked=False, shared_timestamp__isnull=True):

            properties = ('saved', 'liked', 'shared_timestamp')

            cache_keys = [User._cache_key(user_video.user, '%s_videos' % property[:6]) \
                          for property in properties if getattr(user_video, property)]

            cache_keys += ['%s_%s_%s' % (self.id, user_video.user.id, property[:6])\
                           for property in properties if getattr(user_video, property)]
            
            cache_delete(cache_keys)

        super(Video, self).save(*args, **kwargs)

    def set_thumbnail(self, url, width, height, type='web'):
        try:
            thumbnail = Thumbnail.objects.get(video=self, type=type)
        except Thumbnail.DoesNotExist:
            thumbnail = Thumbnail(video=self, type=type)

        thumbnail.url = url
        thumbnail.width = width
        thumbnail.height = height

        thumbnail.save()

        cache_delete(['%s_%s_thumbnail' % (self.id, type)])

    def get_thumbnail(self, type='web'):
        cache_key = '%s_%s_thumbnail' % (self.id, type)

        cached = cache_get(cache_key)

        if cached:
            thumbnail = loads(cached)
            if isinstance(thumbnail, basestring) and thumbnail == '_NONE_':
                raise Thumbnail.DoesNotExist

            return thumbnail

        thumbnails = self.thumbnails.filter(type=type)
        if thumbnails:
            cache_set(cache_key, dumps(thumbnails[0]))
            return thumbnails[0]

        cache_set(cache_key, dumps('_NONE_'))
        raise Thumbnail.DoesNotExist()

    def total_likes(self):
        return len(self.all_likers())

    def _get_timestamp_for_action(self, user, action):
        cache_key = '%s_%s_%s' % (self.id, user.id, action)

        cached = cache_get(cache_key)
        if cached:
            return loads(cached)

        timestamp = getattr(UserVideo.objects.filter(video=self, user=user)[0:1].get(), '%s_timestamp' % action)

        cache_set(cache_key, dumps(timestamp))

        return timestamp

    def date_saved(self, user):
        return self._get_timestamp_for_action(user, 'saved')

    def date_liked(self, user):
        return self._get_timestamp_for_action(user, 'liked')
    
    def date_shared(self, user):
        return self._get_timestamp_for_action(user, 'shared')

    # List of all users who have liked this video
    # Pass in a user object as `context_user` to sort likers by friends first followed by others
    def all_likers(self, context_user=None):
        if not context_user:
            cache_key = '%s_likers' % self.id

            cached = cache_get(cache_key)
            if cached:
                likers = loads(cached)
            else:
                likers = [user_video.user for user_video in UserVideo.objects.filter(video=self, liked=True)]
                cache_set(cache_key, dumps(likers))

        else:
            followed_likers = [user_video.user for user_video in UserVideo.objects.filter(user__r_follows=context_user,
                                                                                          video=self,
                                                                                          liked=True)]

            others = [user_video.user for user_video in UserVideo.objects.exclude(user=context_user)\
                                                                         .exclude(user__r_follows=context_user)\
                                                                         .filter(video=self, liked=True)]

            likers = followed_likers + others

        return likers

    @models.permalink
    def get_absolute_url(self):
        return 'video_detail', [str(self.id)]

    def status(self):
        if self.result is not None:
            state = self.result

        elif self.fetched is not None:
            state = states.SUCCESS

        else:
            try:
                # If added > 15 mins ago and essential fields are not yet populated, assume task failed.

                user_video = UserVideo.objects\
                                      .filter(video=self)\
                                      .values('saved_timestamp', 'liked_timestamp', 'shared_timestamp')\
                                      .order_by('-saved_timestamp', '-liked_timestamp', '-shared_timestamp')[0:1].get()

                added = user_video.get('saved_timestamp') or \
                        user_video.get('liked_timestamp') or \
                        user_video.get('shared_timestamp')

                if (datetime.utcnow() - added).seconds > 900 and (not self.title or not self.html_embed_code):
                    state = self.result = states.FAILURE
                    Video.objects.filter(id=self.id).update(result=states.FAILURE)
                    revoke(self.task_id, terminate=True, reply=False)
                else:
                    state = default_app.backend.get_status(self.task_id)

            except UserVideo.DoesNotExist:
                state = default_app.backend.get_status(self.task_id)

        return state

    def first_shared_by(self):
        """ First user who shared this video. """
        try:
            user_video = UserVideo.objects.filter(video=self, liked=True).order_by('liked_timestamp')[0:1].get()
            return user_video.user
        except UserVideo.DoesNotExist:
            return None
        
    def increment_karma(self, user, value=1):
        """ 
        Increment karma points for user who shared this video first. Here, `user` is the user currently liking
        this video.
        """
        shared_by = self.first_shared_by()
        if shared_by is not None and not shared_by == user:
            shared_by.karma = F('karma') + value
            shared_by.save()
        return shared_by

    def json(self):
        try:
            thumbnail = self.get_thumbnail().json()
        except Thumbnail.DoesNotExist:
            thumbnail = None

        try:
            source = self.source
            if source is not None:
                source = source.json()
        except Source.DoesNotExist:
            source = None

        return { 'id': self.id,
                 'url': self.url,
                 'title': self.title,
                 'description': self.description,
                 'thumbnail': thumbnail,
                 'source': source,
                 'saves': UserVideo.save_count(self),
                 'likes': UserVideo.like_count(self),
                 'state': self.status() }


class Thumbnail(models.Model):
    """
    Video thumbnails

    Thumbnails are just an URL with size info
    >>> video = Video.objects.create(url='http://www.youtube.com/watch?v=kh29_SERH0Y')
    >>> thumb = Thumbnail.objects.create(video=video, url='http://i2.ytimg.com/vi/kh29_SERH0Y/0.jpg',
    ... width=480, height=360)

    Default to 'web' type
    >>> thumb.type
    u'web'

    A `Video` can have multiple thumbnails
    >>> mobile_thumb = Thumbnail.objects.create(video=video, url='http://i2.ytimg.com/vi/kh29_SERH0Y/2.jpg',
    ... width=120, height=90, type='mobile')
    >>> Video.objects.get(url=video.url).thumbnails.all()
    [http://i2.ytimg.com/vi/kh29_SERH0Y/2.jpg, http://i2.ytimg.com/vi/kh29_SERH0Y/0.jpg]
    """

    video = models.ForeignKey(Video, related_name='thumbnails')
    type = models.CharField(max_length=10, default='web')
    url = models.URLField(max_length=750, verify_exists=False)
    width = models.IntegerField()
    height = models.IntegerField()

    def __repr__(self):
        return self.url

    def json(self):
        return { 'url': self.url, 'width': self.width, 'height': self.height }


class UserActivity(object):
    def __init__(self, user, timestammp, action):
        super(UserActivity, self).__init__()
        self.user = user
        self.timestamp = timestammp
        self.action = action

    def __cmp__(self, other):
        return cmp(self.timestamp, other.timestamp)

    def json(self):
        return { 'user': self.user.json(),
                 'timestamp': epoch(self.timestamp),
                 'action': self.action }


class ActivityItem(object):
    def __init__(self, video, user_activities, timestamp=None):
        super(ActivityItem, self).__init__()
        self.video = video
        self.user_activities = user_activities
        self.timestamp = timestamp

    def __cmp__(self, other):
        return cmp(self.timestamp, other.timestamp)

    def json(self):
        return { 'video': self.video.json(),
                 'user_activities': [user_activity.json() for user_activity in self.user_activities],
                 'timestamp': epoch(self.timestamp) }


class User(auth_models.User):
    """
    User object. Extends `django.contrib.auth.User`.
    As a result, we get username, email, id and password (unused) fields.

    Only required field is `User.username`:instance_attribute:
    >>> user = User.objects.create(username='bender')

    Which, of course, is required to be unique
    >>> evil_twin = User.objects.create(username='bender') # doctest: +IGNORE_EXCEPTION_DETAIL
    Traceback (most recent call last):
      ...
    IntegrityError: duplicate key value violates unique constraint "auth_user_username_key"
    """
    videos = models.ManyToManyField(Video, through='UserVideo')
    follows = models.ManyToManyField('self', through='UserFollowsUser', related_name='r_follows', symmetrical=False)
    is_registered = models.BooleanField(default=True, db_index=True)
    fb_friends = models.ManyToManyField('self', through='FacebookFriend', related_name='r_fb_friends', symmetrical=False)
    fb_friends_fetched = models.DateTimeField(null=True, db_index=True)
    fb_news_feed_fetched = models.DateTimeField(null=True, db_index=True)
    fb_news_last_shared_item_timestamp = models.DateTimeField(null=True)
    dismissed_user_suggestions = models.ManyToManyField('self', through='DismissedUserSuggestions',
                                                        related_name='r_dismissed_user_suggestions', symmetrical=False)
    karma = models.PositiveIntegerField(default=0, db_index=True)
    campaign = models.CharField(max_length=50, null=True, db_index=True)
    is_fetch_enabled = models.BooleanField(default=True, db_index=True)
    have_publish_rights = models.BooleanField(default=False)

    # Use UserManager to get the create_user method, etc.
    objects = auth_models.UserManager()

    def is_authenticated(self):
        return self.is_fetch_enabled and super(User, self).is_authenticated()

    def facebook_access_token(self):
        return self.social_auth.get().extra_data['access_token']

    def set_facebook_access_token(self, access_token):
        fb_auth = self.social_auth.get()
        fb_auth.extra_data['access_token'] = access_token
        fb_auth.save()

    def facebook_uid(self):
        return self.social_auth.get().uid

    def picture(self):
        return 'https://graph.facebook.com/%s/picture' % self.facebook_uid()

    def _create_or_update_video(self, video, **kwargs):
        properties = ('liked', 'saved', 'watched', 'shared')

        if not any([property not in kwargs for property in properties]):
            raise Exception('Must (un)set at least one of liked/saved/watched/shared flags')

        try:
            user_video = UserVideo.objects.get(user=self, video=video)
        except UserVideo.DoesNotExist:
            user_video = UserVideo(user=self, video=video)

        timestamp = kwargs.get('timestamp') or datetime.utcnow()

        for property in properties:
            try:
                setattr(user_video, property, kwargs[property])
                if kwargs[property]:
                    setattr(user_video, '%s_timestamp' % property, timestamp)
            except KeyError:
                pass

        try:
            user_video.host = kwargs['host']
        except KeyError:
            pass

        user_video.save()

        # Invalidate cached user and video properties, if any.
        cache_keys = [User._cache_key(self, '%s_videos' % property) for property in properties if property in kwargs]
        cache_keys += ['%s_%s_%s' % (video.id, self.id, property) for property in properties if property in kwargs]
        if 'liked' in kwargs:
            cache_keys.append('%s_likers' % video.id)
        cache_delete(cache_keys)

        return user_video

    @classmethod
    def _cache_key(cls, instance, function):
        return '%s-%s' % (instance.id, function)

    def cached(func):
        def wrap(self, *args, **kwargs):
            key = User._cache_key(self, func.__name__)

            cached = cache_get(key)
            if cached:
                return loads(cached)

            result = []

            queryset = func(self, *args, **kwargs)
            for item in queryset:
                result.append(item)

            cache_set(key, dumps(result))
            return result

        return wrap

    @cached
    def followers(self):
        return [u.follower for u in UserFollowsUser.objects.filter(followee=self, is_active=True).all()]

    def follower_count(self):
        return UserFollowsUser.objects.filter(followee=self, is_active=True).count()

    @cached
    def following(self):
        return [u.followee for u in UserFollowsUser.objects.filter(follower=self, is_active=True).all()]

    def following_count(self):
        return UserFollowsUser.objects.filter(follower=self, is_active=True).count()

    def follow(self, other):
        if self == other:
            return

        result, created = UserFollowsUser.objects.get_or_create(follower=self, followee=other)

        if not result.is_active:
            result.is_active=True
            result.save()

        if created and other.preferences().get('follow_email', True):
            from api.tasks import send_follow_email_notification
            send_follow_email_notification.delay(other, self)

        cache_delete([User._cache_key(self, 'following'), User._cache_key(other, 'followers')])

        return result

    def unfollow(self, other):
        try:
            relation = UserFollowsUser.objects.get(follower=self, followee=other)
            relation.is_active = False
            relation.save()

            cache_delete([User._cache_key(self, 'following'), User._cache_key(other, 'followers')])

        except UserFollowsUser.DoesNotExist:
            pass

    @cached
    def facebook_friends(self):
        return self.fb_friends.all()

    def add_facebook_friend(self, friend):
        friend_obj, created = FacebookFriend.objects.get_or_create(user=self, fb_friend=friend)

        if created:
            cache_key = User._cache_key(self, 'facebook_friends')
            cache_delete([cache_key])

        return friend_obj
        
    def like_video(self, video, timestamp=None, host=None):
        """
        Like a video. Creates an association between `User` and `Video` objects (if one doesn't exist already).

        @type video: `Video` instance
        @type timestamp: Specify a timestamp - defaults to `datetime.utcnow()`
        @returns: Updated `UserVideo` association object

        >>> user = User.objects.create(username='birdman')
        >>> video = Video.objects.create(url='http://www.vimeo.com/24532073')
        >>> user_video = user.like_video(video)
        >>> user_video.liked
        True
        >>> user_video.saved
        False
        """

        if timestamp is None:
            timestamp = datetime.utcnow()

        # Give karma points to user who first shared this video
        video.increment_karma(self)

        kwargs = {'liked': True, 'timestamp': timestamp}
        if host:
            kwargs['host'] = host

        # Propagate activity to followers
        for user in self.followers():
            defaults = {'insert_time': timestamp,
                        'expire_time': timestamp + timedelta(days=14)}

            Activity.objects.get_or_create(user=user,
                                           friend=self,
                                           video=video,
                                           action='like',
                                           defaults=defaults)

        return self._create_or_update_video(video, **kwargs)

    def unlike_video(self, video):
        # Take away karma points from sharing user
        video.increment_karma(self, -1)

        # Remove activity entries
        Activity.objects.filter(friend=self, video=video, action='like').delete()

        return self._create_or_update_video(video, **{'liked': False})

    @cached
    def liked_videos(self):
        return Video.objects.select_related()\
                            .filter(user__id=self.id, uservideo__liked=True)\
                            .order_by('-uservideo__liked_timestamp')

    def liked_videos_count(self):
        return len(self.liked_videos())

    @cached
    def shared_videos(self):
        return Video.objects.select_related()\
                            .filter(user__id=self.id, uservideo__shared_timestamp__isnull=False)\
                            .order_by('-uservideo__shared_timestamp')

    def shared_videos_count(self):
        return len(self.shared_videos())

    def add_shared_video(self, video, timestamp=None):
        if timestamp is None:
            timestamp = datetime.utcnow()

        for user in filter(attrgetter('is_registered'), self.facebook_friends()):
            defaults = {'insert_time': timestamp,
                        'expire_time': timestamp + timedelta(days=14)}

            Activity.objects.get_or_create(user=user,
                                           friend=self,
                                           video=video,
                                           action='share',
                                           defaults=defaults)

        return self._create_or_update_video(video, **{'shared': True, 'timestamp': timestamp})

    def save_video(self, video, timestamp=None, host=None):
        """
        Add video to user's saved queue.

        @type video: `Video` instance
        @type timestamp: Specify a timestamp - defaults to `datetime.utcnow()`
        @returns: Updated `UserVideo` association object

        >>> user = User.objects.create(username='birdman')
        >>> video = Video.objects.create(url='http://www.vimeo.com/24532073')
        >>> timestamp = datetime(2011, 6, 8, 15, 12, 1)
        >>> user_video = user.save_video(video, timestamp=timestamp)
        >>> user_video.saved
        True
        >>> user_video.saved_timestamp
        datetime.datetime(2011, 6, 8, 15, 12, 1)
        >>> user_video.liked
        False
        """
        if timestamp is None:
            timestamp = datetime.utcnow()

        kwargs = {'saved': True, 'timestamp': timestamp}
        if host:
            kwargs['host'] = host

        return self._create_or_update_video(video, **kwargs)

    def remove_video(self, video):
        return self._create_or_update_video(video, **{'saved': False})

    @cached
    def saved_videos(self):
        return Video.objects.select_related()\
                            .filter(user__id=self.id, uservideo__saved=True)\
                            .order_by('-uservideo__saved_timestamp')

    def saved_videos_count(self):
        return len(self.saved_videos())

    def mark_video_watched(self, video, timestamp=None):
        if timestamp is None:
            timestamp = datetime.utcnow()
        return self._create_or_update_video(video, **{'watched': True, 'timestamp': timestamp})

    def mark_video_unwatched(self, video):
        return self._create_or_update_video(video, **{'watched': False})

    @cached
    def watched_videos(self):
        return Video.objects.select_related()\
                            .filter(user__id=self.id, uservideo__watched=True)\
                            .order_by('-uservideo__watched_timestamp')

    def watched_videos_count(self):
        return len(self.watched_videos())

    def unwatched_videos(self):
        return Video.objects.select_related()\
                            .filter(user__id=self.id, uservideo__watched=False)\
                            .order_by('-uservideo__saved_timestamp')

    def notifications(self):
        """
        Returns a dictionary of all notifications.
        To be backwards compatible with the old API, the values are integers with any non-zero value to be
        interpreted as an indication to display said notification to user.
        Example:
        >>> user = User.objects.create(username='birdman')
        >>> user.notifications()
        {u'welcome': 1, u'emptyq': 1, u'firstlike': 1}
        """
        archived = dict([(n.message, int(not n.archived)) for n in self.notification_set.all()])
        for notification in DEFAULT_NOTIFICATIONS:
            if notification not in archived:
                archived[notification] = 1
        return archived

    def set_notifications(self, notifications):
        for msg, archived in notifications.items():
            n = self.notification_set.get(user=self, message=msg.lower())
            n.archived = not bool(int(archived))
            n.save()

    def preferences(self):
        return dict([(p.name, p.value) for p in self.preference_set.all()])

    def set_preferences(self, preferences):
        for name, value in preferences.items():
            p = self.preference_set.get(name=name.lower())
            p.value = int(value)
            p.save()

    def activity(self, type=None, start=0, count=-1):
        """
        Activity stream for user.

        >>> birdman = User.objects.create(username='birdman')
        >>> aquaman = User.objects.create(username='aquaman')
        >>> ghostface = User.objects.create(username='ghostface')
        >>> waveforms = Video.objects.create(url='http://www.vimeo.com/24532073')
        >>> birdman.like_video(waveforms, timestamp=datetime(2010, 6, 8))
        <UserVideo: UserVideo object>
        >>> aquaman.follow(birdman)
        <UserFollowsUser: UserFollowsUser object>
        >>> items = aquaman.activity()
        >>> len(items), items[0].video.url
        (1, u'http://www.vimeo.com/24532073')
        >>> aquaman.follow(ghostface)
        <UserFollowsUser: UserFollowsUser object>
        >>> ghostface.like_video(waveforms, timestamp=datetime(2010, 6, 9))
        <UserVideo: UserVideo object>
        >>> items = aquaman.activity()
        >>> len(items), map(itemgetter(0), items[0].users)
        (1, [<User: ghostface>, <User: birdman>])
        >>> sausage = Video.objects.create(url='http://www.youtube.com/watch?v=LOWL0KMAIek')
        >>> ghostface.like_video(sausage, timestamp=datetime(2010, 6, 7))
        <UserVideo: UserVideo object>
        >>> aquaman.like_video(sausage, timestamp=datetime(2010, 6, 9, 4, 20))
        <UserVideo: UserVideo object>
        >>> items = aquaman.activity()
        >>> len(items), items[0].video.url, map(itemgetter(0), items[0].users)
        (2, u'http://www.youtube.com/watch?v=LOWL0KMAIek', [<User: aquaman>, <User: ghostface>])
        """
        
        query = Activity.objects.values('video').filter(user=self)
        if type == 'facebook':
            query = query.filter(action='share')
        elif type == 'watchlr':
            query = query.filter(action='like')

        results = query.annotate(last_update=Max('insert_time')).order_by('-last_update')
        if count == -1:
            results = results[start:]
        else:
            results = results[start:start+count]

        items = dict()
        for video_id in map(itemgetter('video'), results):
            for item in Activity.objects.filter(user=self).filter(video__id=video_id).order_by('-insert_time'):
                user_activity = UserActivity(item.friend, item.insert_time, item.action)
                try:
                    items[item.video].user_activities.append(user_activity)
                except KeyError:
                    items[item.video] = ActivityItem(video=item.video,
                                                     user_activities=[user_activity],
                                                     timestamp=item.insert_time)
        return sorted(items.values(), reverse=True)

    def get_absolute_url(self):
        if self.is_registered:
            return reverse('user_profile', args=[str(self.username)])
        return 'http://www.facebook.com/profile.php?id=%s' % self.facebook_uid()

    def _build_follow_suggestions(self, queryset, count):
        suggestions = list()

        following = self.following()
        dismissed = list(self.dismissed_user_suggestions.all())

        for user in queryset:
            if not user == self and user not in following and user not in dismissed:
                suggestions.append(user)
                if len(suggestions) == count:
                    break

        return suggestions

    def popular_users(self, count=10, excludes=None):
        qs = User.objects.filter(karma__gt=0).order_by('-karma')
        if excludes:
            qs = qs.exclude(id__in=excludes)
        return self._build_follow_suggestions(qs, count)

    def follow_suggestions(self, count=10, excludes=None):
        qs = self.fb_friends.filter(is_registered=True)
        if excludes:
            qs = qs.exclude(id__in=excludes)
        return self._build_follow_suggestions(qs, count)

    def invite_friends_list(self, num=10):

        # Return empty list if we have not fetched friend list yet
        if not self.fb_friends_fetched:
            return []

        invite_list = list()

        # List of dismissed suggestions for user
        dismissed = list(self.dismissed_user_suggestions.all())

        # TODO: Need some way of ordering the invite list
        for friend in FacebookFriend.objects.filter(user=self, invited_on__isnull=True):
            if num <= 0:
                break
            fb_user = friend.fb_friend
            if not fb_user.is_registered and fb_user not in dismissed:
                invite_list.append(fb_user)
                num -= 1

        return invite_list
    
    def json(self, other=None, excludes=None):
        serialized = { 'id': self.id,
                       'name': ' '.join([self.first_name, self.last_name]),
                       'username': self.username,
                       'picture': self.picture(),
                       'email': self.email,
                       'notifications': self.notifications(),
                       'preferences': self.preferences(),
                       'saves': self.saved_videos_count(),
                       'watches': self.watched_videos_count(),
                       'likes': self.liked_videos_count(),
                       'following_count': self.following_count(),
                       'follower_count': self.follower_count() }

        if other is not None:
            serialized.update({ 'following': other in self.followers(),
                                'follower': other in self.following() })
                    
        if excludes is not None:
            try:
                for property in excludes:
                    try:
                        del serialized[property]
                    except KeyError:
                        pass
            except TypeError:
                try:
                    del serialized[excludes]
                except KeyError:
                    pass

        return serialized


class Activity(models.Model):
    user = models.ForeignKey(User, related_name='+', db_index=True)
    video = models.ForeignKey(Video, related_name='+', db_index=True)
    friend = models.ForeignKey(User, related_name='+', db_index=True)
    action = models.CharField(max_length=10, db_index=True)
    insert_time = models.DateTimeField(db_index=True)
    expire_time = models.DateTimeField(db_index=True)


class UserFollowsUser(models.Model):
    follower = models.ForeignKey(User, related_name='+', db_index=True)
    followee = models.ForeignKey(User, related_name='+', db_index=True)
    since = models.DateTimeField(auto_now=True, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ['-since']


class FacebookFriend(models.Model):
    user = models.ForeignKey(User, related_name='+', db_index=True)
    fb_friend = models.ForeignKey(User, related_name='+', db_index=True)
    invited_on = models.DateTimeField(null=True)


class DismissedUserSuggestions(models.Model):
    user = models.ForeignKey(User, related_name='+', db_index=True)
    suggested_user = models.ForeignKey(User, related_name='+', db_index=True)
    dismissed_on = models.DateTimeField(auto_now=True)


class UserVideo(models.Model):
    user = models.ForeignKey(User)
    video = models.ForeignKey(Video)
    host = models.URLField(max_length=750, verify_exists=False, null=True)
    saved = models.BooleanField(default=False, db_index=True)
    saved_timestamp = models.DateTimeField(null=True, db_index=True)
    liked = models.BooleanField(default=False, db_index=True)
    liked_timestamp = models.DateTimeField(null=True, db_index=True)
    watched = models.BooleanField(default=False, db_index=True)
    watched_timestamp = models.DateTimeField(null=True, db_index=True)
    shared_timestamp = models.DateTimeField(null=True, db_index=True)
    _position = models.DecimalField(max_digits=7, decimal_places=2, null=True)

    @property
    def position(self):
        return self._position

    @position.setter
    def position(self, value):
        if isinstance(value, float):
            value = str(value)

        twoplaces = Decimal(10) ** -2  # == 0.01
        self._position = Decimal(value).quantize(twoplaces)

    @classmethod
    def save_count(cls, video):
        return cls.objects.filter(video=video, saved=True).count()

    @classmethod
    def like_count(cls, video):
        return cls.objects.filter(video=video, liked=True).count()

    @classmethod
    def watch_count(cls, video):
        return cls.objects.filter(video=video, watched=True).count()

    def json(self):
        return { 'url': self.video.url,
                 'id': self.video.id,
                 'liked': self.liked,
                 'likes': self.like_count(self.video),
                 'saved': self.saved,
                 'saves': self.save_count(self.video),
                 'position': str(self.position) if self.position is not None else None }


class Notification(models.Model):
    user = models.ForeignKey(User)
    message = models.CharField(max_length=200)
    archived = models.BooleanField(default=False, db_index=True)
    changed = models.DateTimeField(auto_now=True)


class Preference(models.Model):
    user = models.ForeignKey(User)
    name = models.CharField(max_length=100)
    value = models.PositiveSmallIntegerField()
    changed = models.DateTimeField(auto_now=True)


class UserTask(models.Model):
    user = models.ForeignKey(User)
    category = models.CharField(max_length=50, db_index=True)
    task_id = models.CharField(max_length=255, null=True, db_index=True)
    result = models.CharField(max_length=10, default=states.PENDING, null=True, db_index=True)
    added = models.DateTimeField(auto_now_add=True, db_index=True)

    def status(self):
        if (datetime.utcnow() - self.added).seconds > 300 and not self.result == states.SUCCESS:
            return states.FAILURE
        return self.result

    def json(self, excludes=None):
        return { 'user': self.user.json(excludes=excludes),
                 'category': self.category,
                 'task_id': self.task_id,
                 'status': self.status() }


# Note that since we are defining a custom User model, import and handler
# registration MUST be done after model definition to avoid circular import issues.
from social_auth.signals import pre_update

def social_auth_pre_update(sender, user, response, details, **kwargs):
    def add_user_task(user, category, task):
        user_task, created = UserTask.objects.get_or_create(user=user, category=category)
        task_info = task.delay(user, user_task=user_task)
        user_task.task_id = task_info.task_id
        user_task.added = datetime.utcnow()
        user_task.save()

    saved = user.username

    # New user?
    is_new = getattr(user, 'is_new', False)
    if is_new:
        from api.tasks import slugify
        fullname = '.'.join([user.first_name, user.last_name])
        user.username = response.get('username', slugify(fullname, user.id))

    # Ensure that the status flag is set
    # This flag promotes, possibly a facebook friend to a regular user
    registered, fetch_enabled = user.is_registered, user.is_fetch_enabled
    user.is_registered = user.is_fetch_enabled = True

    # Upgrade?
    if not registered or is_new:

        # Fetch new user's facebook friends
        if not getattr(user, 'sign_up_fetch_scheduled', False):
            from api.tasks import fetch_facebook_friends, fetch_user_news_feed
            add_user_task(user, 'friends', fetch_facebook_friends)
            add_user_task(user, 'news', fetch_user_news_feed)
            setattr(user, 'sign_up_fetch_scheduled', True)

        # Override `is_new` property
        # This will ensure that the welcome experience gets triggered for this user
        setattr(user, 'is_new', True)

        # Set attribute `date_joined` to current time
        user.date_joined = datetime.utcnow()

    # Handlers must return True if any value was updated/changed
    return not saved == user.username or \
           not registered == user.is_registered or \
           not fetch_enabled == user.is_fetch_enabled


# Register for the `pre_update` signal (as opposed to `socialauth_registered` signal)
# since we need to handle facebook friend user upgrades (for such users, the `is_new`
# attribute is not set and hence, `socialauth_registered` signal does not get fired).
pre_update.connect(social_auth_pre_update, sender=None)


@receiver(post_save, sender=User)
def user_post_save(sender, instance, signal, *args, **kwargs):
    # Called at the end of `save()` method

    # Set up default notifications and preferences for  user
    for msg, archived in DEFAULT_NOTIFICATIONS.items():
        try:
            Notification.objects.get(user=instance, message=msg)
        except Notification.DoesNotExist:
            Notification.objects.create(user=instance, message=msg, archived=archived)
    for name, value in DEFAULT_PREFERENCES.items():
        try:
            Preference.objects.get(user=instance, name=name)
        except Preference.DoesNotExist:
            Preference.objects.create(user=instance, name=name, value=value)
