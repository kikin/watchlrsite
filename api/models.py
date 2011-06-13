from re import sub
from unicodedata import normalize
from datetime import datetime
from operator import itemgetter
from itertools import chain

from django.db import models
from django.contrib.auth import models as auth_models

from django.template.defaultfilters import stringfilter
from django.db.models.signals import post_save
from django.dispatch import receiver

import logging
logger = logging.getLogger(__name__)

class Source(models.Model):
    '''
    Video source

    YouTube is a an example
    >>> youtube = Source.objects.create(name='YouTube', url='http://youtube.com',
    ... favicon='http://youtube.com/favicon.ico')

    `Source.name`:instance_attribute: should be unique
    >>> ripoff = Source.objects.create(name='YouTube', url='http://facetube.com') # doctest: +IGNORE_EXCEPTION_DETAIL
    Traceback (most recent call last):
      ...
    IntegrityError: duplicate key value violates unique constraint "api_source_name_key"
    '''

    name = models.CharField(max_length=100, unique=True)
    url = models.URLField(max_length=750, verify_exists=False)
    favicon = models.URLField(max_length=750, verify_exists=False, null=True)


class Video(models.Model):
    '''
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
    '''

    url = models.URLField(max_length=750, verify_exists=False, db_index=True)
    title = models.CharField(max_length=500, db_index=True, null=True)
    description = models.TextField(max_length=3000, null=True)
    html_embed_code = models.TextField(max_length=3000, null=True)
    html5_embed_code = models.TextField(max_length=3000, null=True)
    source = models.ForeignKey(Source, related_name='videos', null=True)
    fetched = models.DateTimeField(null=True, db_index=True)
    state = models.CharField(max_length=10, null=True, db_index=True)

    def set_thumbnail(self, url, width, height, type='web'):
        try:
            thumbnail = Thumbnail.objects.get(video=self, type=type)
        except Thumbnail.DoesNotExist:
            thumbnail = Thumbnail(video=self, type=type)

        thumbnail.url = url
        thumbnail.width = width
        thumbnail.height = height

        thumbnail.save()

    def get_thumbnail(self, type='web'):
        return self.thumbnails.get(type=type)

    def total_likes(self):
        return UserVideo.objects.filter(video=self, liked=True).count()

    #date when user saved video....
    def date_saved(self, user):
        return UserVideo.objects.get(video=self, user=user).saved_timestamp

    #date when user liked video....
    def date_liked(self, user):
        return UserVideo.objects.get(video=self, user=user).liked_timestamp

    @models.permalink
    def get_absolute_url(self):
        return ('video_detail', [str(self.id)])


class Thumbnail(models.Model):
    '''
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
    '''

    video = models.ForeignKey(Video, related_name='thumbnails')
    type = models.CharField(max_length=10, default='web')
    url = models.URLField(max_length=750, verify_exists=False)
    width = models.IntegerField()
    height = models.IntegerField()

    def __repr__(self):
        return self.url


class ActivityItem(object):
    def __init__(self, video, users, timestamp=None):
        super(ActivityItem, self).__init__()
        self.video = video
        self.users = users
        self.timestamp = timestamp

    def __cmp__(self, other):
        return cmp(self.timestamp, other.timestamp)


class User(auth_models.User):
    '''
    User object. Extends `django.contrib.auth.User`.
    As a result, we get username, email, id and password (unused) fields.

    Only required field is `User.username`:instance_attribute:
    >>> user = User.objects.create(username='bender')

    Which, of course, is required to be unique
    >>> evil_twin = User.objects.create(username='bender') # doctest: +IGNORE_EXCEPTION_DETAIL
    Traceback (most recent call last):
      ...
    IntegrityError: duplicate key value violates unique constraint "auth_user_username_key"
    '''
    videos = models.ManyToManyField(Video, through='UserVideo')
    follows = models.ManyToManyField('self', through='UserFollowsUser', symmetrical=False)

    # Use UserManager to get the create_user method, etc.
    objects = auth_models.UserManager()

    def facebook_access_token(self):
        return self.social_auth.get().extra_data['access_token']

    def facebook_uid(self):
        return self.social_auth.get().uid

    def picture(self):
        return 'https://graph.facebook.com/%s/picture' % self.facebook_uid()

    def _create_or_update_video(self, video, **kwargs):
        properties = ('liked', 'saved', 'watched')

        if not any([property not in kwargs for property in properties]):
            raise Exception('Must (un)set at least one of liked/saved/watched flags')

        try:
            user_video = UserVideo.objects.get(user=self, video=video)
        except UserVideo.DoesNotExist:
            user_video = UserVideo(user=self, video=video)

        timestamp = kwargs.get('timestamp', None) or datetime.utcnow()

        for property in properties:
            try:
                setattr(user_video, property, kwargs[property])
                if kwargs[property]:
                    setattr(user_video, '%s_timestamp' % property, timestamp)
            except KeyError:
                pass

        user_video.save()
        return user_video

    def followers(self):
        return UserFollowsUser.objects.filter(followee=self).all()

    def following(self):
        return self.follows.all()

    def follow(self, other):
        if self == other:
            return

        try:
            result = UserFollowsUser.objects.get(follower=self, followee=other)
        except UserFollowsUser.DoesNotExist:
            result = UserFollowsUser.objects.create(follower=self, followee=other, since=datetime.utcnow())

        return result

    def unfollow(self, other):
        try:
            UserFollowsUser.objects.get(follower=self, followee=other).delete()
        except UserFollowsUser.DoesNotExist:
            pass
        
    def like_video(self, video, timestamp=None):
        '''
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
        '''

        if timestamp is None:
            timestamp = datetime.utcnow()

        return self._create_or_update_video(video, **{'liked': True, 'timestamp': timestamp})

    def unlike_video(self, video):
        return self._create_or_update_video(video, **{'liked': False})

    def liked_videos(self):
        return Video.objects.filter(user__id=self.id, uservideo__liked=True).order_by('-uservideo__liked_timestamp')

    def save_video(self, video, timestamp=None):
        '''
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
        '''
        if timestamp is None:
            timestamp = datetime.utcnow()
        return self._create_or_update_video(video, **{'saved': True, 'timestamp': timestamp})

    def remove_video(self, video):
        return self._create_or_update_video(video, **{'saved': False})

    def saved_videos(self):
        return Video.objects.filter(user__id=self.id, uservideo__saved=True).order_by('-uservideo__saved_timestamp')

    def mark_video_watched(self, video, timestamp=None):
        if timestamp is None:
            timestamp = datetime.utcnow()
        return self._create_or_update_video(video, **{'watched': True, 'timestamp': timestamp})

    def mark_video_unwatched(self, video):
        return self._create_or_update_video(video, **{'watched': False})

    def watched_videos(self):
        return Video.objects.filter(user__id=self.id, uservideo__watched=True).order_by('-uservideo__watched_timestamp')

    def unwatched_videos(self):
        return Video.objects.filter(user__id=self.id, uservideo__watched=False).order_by('-uservideo__saved_timestamp')

    def notifications(self):
        return dict([(n.message, int(not n.archived)) for n in self.notification_set.all()])

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

    def activity(self, since=None):
        '''
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
        '''

        if since is None:
            since = datetime(1970, 1, 1)

        by_video = dict()
        for user in chain(self.following(), [self,]):

            for video in user.liked_videos():

                user_video = UserVideo.objects.get(user=user, video=video)
                if since is not None:
                    if user_video.liked_timestamp < since:
                        continue

                user_like_tuple = (user_video.user, user_video.liked_timestamp)
                try:
                    by_video[video].users.append(user_like_tuple)
                except KeyError:
                    by_video[video] = ActivityItem(video=user_video.video, users=[user_like_tuple])

                by_video[video].timestamp = user_like_tuple[1]

        items = sorted(by_video.values(), reverse=True)
        for item in items:
            item.users.sort(key=itemgetter(1), reverse=True)

        return items


class UserFollowsUser(models.Model):
    follower = models.ForeignKey(User, related_name='follower_set', db_index=True)
    followee = models.ForeignKey(User, related_name='followeee_set', db_index=True)
    since = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        ordering = ['-since']


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
    position = models.DecimalField(max_digits=5, decimal_places=2, null=True)

    @classmethod
    def save_count(cls, video):
        return cls.objects.filter(video=video, saved=True).count()

    @classmethod
    def like_count(cls, video):
        return cls.objects.filter(video=video, liked=True).count()

    @classmethod
    def watch_count(cls, video):
        return cls.objects.filter(video=video, watched=True).count()


DEFAULT_NOTIFICATIONS = {
    'welcome': False, # Welcome experience for new users
    'emptyq': False, # Queue location education for first-time video save
}

class Notification(models.Model):
    user = models.ForeignKey(User)
    message = models.CharField(max_length=200)
    archived = models.BooleanField(default=False, db_index=True)
    changed = models.DateTimeField(auto_now=True)


DEFAULT_PREFERENCES = {
    'syndicate': 2, # Syndicate likes to Facebook
}

class Preference(models.Model):
    user = models.ForeignKey(User)
    name = models.CharField(max_length=100)
    value = models.PositiveSmallIntegerField()
    changed = models.DateTimeField(auto_now=True)


@receiver(post_save, sender=User)
def user_post_save(sender, instance, signal, *args, **kwargs):
    # Called at the end of `save()` method

    # Set up default notifications and preferences for new user
    if not instance.notification_set.count():
        for msg, archived in DEFAULT_NOTIFICATIONS.items():
            Notification.objects.create(user=instance, message=msg, archived=archived)

        for name, value in DEFAULT_PREFERENCES.items():
            Preference.objects.create(user=instance, name=name, value=value)

def slugify(username, id):
    '''
    Normalizes string, converts to lowercase, removes non-alphanumeric characters (including spaces).
    Also, checks and appends offset integer to ensure that username is unique.
    '''
    username = normalize('NFKD', username).encode('ascii', 'ignore')
    username = basename = unicode(sub('[^0-9a-zA-Z]+', '', username).strip().lower())

    counter = 1
    while True:
        try:
            found = User.objects.get(username=username)
            if found.id == id:
                return username
        except User.DoesNotExist:
            break
        username = '%s%d' % (basename, counter)
        counter += 1

    return username

slugify.is_safe = True
slugify = stringfilter(slugify)

# Note that since we are defining a custom User model, import and handler
# registration MUST be done after model definition to avoid circular import issues.

from social_auth.signals import pre_update

def compose_username(sender, user, response, details, **kwargs):
    saved = user.username
    fullname = ''.join([user.first_name, user.last_name])
    user.username = response.get('username', slugify(fullname, user.id))
    return saved == user.username

pre_update.connect(compose_username, sender=None)
