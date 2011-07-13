from datetime import datetime
from itertools import chain
from decimal import Decimal

from django.db import models
from django.db.models import F
from django.db.models.signals import post_save
from django.contrib.auth import models as auth_models
from django.dispatch import receiver
from django.core.urlresolvers import reverse

from celery.app import default_app
from celery import states

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

    # Date when user saved video
    def date_saved(self, user):
        return UserVideo.objects.get(video=self, user=user).saved_timestamp

    # Date when user liked video
    def date_liked(self, user):
        return UserVideo.objects.get(video=self, user=user).liked_timestamp

    # List of all users who have liked this video
    def all_likers(self):
        return [user_video.user for user_video in UserVideo.objects.filter(video=self, liked=True)]

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
                                      .values('saved_timestamp', 'liked_timestamp')\
                                      .order_by('-saved_timestamp', '-liked_timestamp')[0:1].get()

                added = user_video.get('saved_timestamp') or user_video.get('liked_timestamp')

                if (datetime.utcnow() - added).seconds > 900 and (not self.title or not self.html_embed_code):
                    state = states.FAILURE
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
    def __init__(self, user, timestammp, type):
        super(UserActivity, self).__init__()
        self.user = user
        self.timestamp = timestammp
        self.type = type

    def __cmp__(self, other):
        return cmp(self.timestamp, other.timestamp)


class ActivityItem(object):
    def __init__(self, video, user_activities, timestamp=None):
        super(ActivityItem, self).__init__()
        self.video = video
        self.user_activities = user_activities
        self.timestamp = timestamp

    def __cmp__(self, other):
        return cmp(self.timestamp, other.timestamp)


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
    is_registered = models.BooleanField(default=True)
    fb_friends = models.ManyToManyField('self', through='FacebookFriend', related_name='r_fb_friends', symmetrical=False)
    fb_friends_fetched = models.DateTimeField(null=True)
    fb_news_feed_fetched = models.DateTimeField(null=True)
    dismissed_user_suggestions = models.ManyToManyField('self', through='DismissedUserSuggestions',
                                                        related_name='r_dismissed_user_suggestions', symmetrical=False)
    karma = models.PositiveIntegerField(default=0, db_index=True)
    campaign = models.CharField(max_length=50, null=True, db_index=True)

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
        return [u.follower for u in UserFollowsUser.objects.filter(followee=self, is_active=True).all()]

    def follower_count(self):
        return UserFollowsUser.objects.filter(followee=self, is_active=True).count()

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

        return result

    def unfollow(self, other):
        try:
            relation = UserFollowsUser.objects.get(follower=self, followee=other)
            relation.is_active = False
            relation.save()
        except UserFollowsUser.DoesNotExist:
            pass
        
    def like_video(self, video, timestamp=None):
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

        return self._create_or_update_video(video, **{'liked': True, 'timestamp': timestamp})

    def unlike_video(self, video):
        # Take away karma points from sharing user
        video.increment_karma(self, -1)

        return self._create_or_update_video(video, **{'liked': False})

    def liked_videos(self):
        return Video.objects.filter(user__id=self.id, uservideo__liked=True).order_by('-uservideo__liked_timestamp')

    def shared_videos(self):
        return Video.objects.filter(user__id=self.id, uservideo__shared_timestamp__isnull=False).order_by('-uservideo__shared_timestamp')

    def save_video(self, video, timestamp=None):
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

    def activity(self, since=None):
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

        if since is None:
            since = datetime(1970, 1, 1)

        by_video = dict()
        for user in chain(self.following(), [self,]):

            for video in user.liked_videos():

                if not video.status() == states.SUCCESS:
                    continue

                user_video = UserVideo.objects.get(user=user, video=video)
                if since is not None and user_video.liked_timestamp < since:
                    continue

                user_activity = UserActivity(user, user_video.liked_timestamp, 'like')
                try:
                    by_video[video].user_activities.append(user_activity)
                except KeyError:
                    by_video[video] = ActivityItem(video=video, user_activities=[user_activity])

                if not by_video[video].timestamp or user_video.liked_timestamp > by_video[video].timestamp:
                    by_video[video].timestamp = user_video.liked_timestamp

        for user in self.fb_friends.all():
            
            for video in filter(lambda v: v.status() == states.SUCCESS, user.shared_videos()):

                user_video = UserVideo.objects.get(user=user, video=video)
                if since is not None and user_video.shared_timestamp < since:
                    continue

                user_activity = UserActivity(user, user_video.shared_timestamp, 'share')
                try:
                    by_video[video].user_activities.append(user_activity)
                except KeyError:
                    by_video[video] = ActivityItem(video=video, user_activities=[user_activity])

                if not by_video[video].timestamp or user_video.shared_timestamp > by_video[video].timestamp:
                    by_video[video].timestamp = user_video.shared_timestamp

        items = sorted(by_video.values(), reverse=True)
        for item in items:
            item.user_activities.sort(reverse=True)

        return items

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

    def popular_users(self, count=10):
        return self._build_follow_suggestions(User.objects.filter(karma__gt=0).order_by('-karma'), count)

    def follow_suggestions(self, count=10):
        return self._build_follow_suggestions(self.fb_friends.filter(is_registered=True), count)

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
    
    def json(self):
        return { 'name': ' '.join([self.first_name, self.last_name]),
                 'username': self.username,
                 'picture': self.picture(),
                 'email': self.email,
                 'notifications': self.notifications(),
                 'preferences': self.preferences(),
                 'queued': self.saved_videos().count(),
                 'saved': self.videos.count(),
                 'watched': self.watched_videos().count(),
                 'liked': self.liked_videos().count(),
                 'following': self.following_count(),
                 'followers': self.follower_count() }


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
                 'position': self.position and str(self.position) }


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


# Note that since we are defining a custom User model, import and handler
# registration MUST be done after model definition to avoid circular import issues.
from social_auth.signals import pre_update

def social_auth_pre_update(sender, user, response, details, **kwargs):
    saved = user.username

    # New user?
    is_new = getattr(user, 'is_new', False)
    if is_new:
        from api.tasks import slugify
        fullname = '.'.join([user.first_name, user.last_name])
        user.username = response.get('username', slugify(fullname, user.id))

    # Ensure that the status flag is set
    # This flag promotes, possibly a facebook friend to a regular user
    registered = user.is_registered
    user.is_registered = True

    # Upgrade?
    if not registered or is_new:

        # Fetch new user's facebook friends
        if not getattr(user, 'is_friend_fetch_scheduled', False):
            from api.tasks import fetch_facebook_friends
            fetch_facebook_friends.delay(user)
            setattr(user, 'is_friend_fetch_scheduled', True)

        # Override `is_new` property
        # This will ensure that the welcome experience gets triggered for this user
        setattr(user, 'is_new', True)

    # Handlers must return True if any value was updated/changed
    return not saved == user.username or not registered == user.is_registered


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
