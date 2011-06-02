from django.db import models
from django.contrib.auth import models as auth_models

from re import sub
from unicodedata import normalize
from datetime import datetime
from django.template.defaultfilters import stringfilter

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
    host = models.URLField(max_length=750, verify_exists=False, null=True)
    fetched = models.DateTimeField(null=True, db_index=True)

    def set_thumbnail(self, url, width, height, type='web'):
        self.thumbnails.add(Thumbnail(url=url, width=width, height=height, type=type))

    def get_thumbnail(self, type='web'):
        return self.thumbnails.get(type=type)

    def total_likes(self):
        return UserVideo.objects.filter(video=self, liked=True).count()

    #date when user saved video....
    def date_saved(self, user):
        save_date = UserVideo.objects.get(video=self, user=user).saved_timestamp
        return save_date

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
    follows = models.ManyToManyField('self', symmetrical=False)

    # Use UserManager to get the create_user method, etc.
    objects = auth_models.UserManager()

    def facebook_access_token(self):
        return self.social_auth.get().extra_data['access_token']

    def facebook_uid(self):
        return self.social_auth.get().uid

    def _create_or_update_video(self, video, **kwargs):
        properties = ('liked', 'saved', 'watched')

        if not any([property not in kwargs for property in properties]):
            raise Exception('Must (un)set at least one of liked/saved/watched flags')

        try:
            user_video = UserVideo.objects.get(user=self, video=video)
        except UserVideo.DoesNotExist:
            user_video = UserVideo(user=self, video=video)

        timestamp = kwargs.get('timestamp', datetime.utcnow())

        for property in properties:
            try:
                setattr(user_video, property, kwargs[property])
                if kwargs[property]:
                    setattr(user_video, '%s_timestamp' % property, timestamp)
            except KeyError:
                pass

        user_video.save()
        return user_video

    def like_video(self, video, timestamp=datetime.utcnow()):
        '''
        Like a video. Creates an association between `User` and `Video` objects (if one doesn't exist already).

        @type video: `Video` instance
        @type timestamp: Specify a timestamp - defaults to `datetime.utcnow()`
        @returns: Updated `UserVideo` association object

        >>> user = User.objects.create(username='birdman')
        >>> video = Video.objects.create(url='http://www.vimeo.com/24532073')
        >>> user_video = user.like_video(video)
        >>> user_video.liked
        False
        '''
        return self._create_or_update_video(video, **{'liked': True, 'timestamp': timestamp})

    def unlike_video(self, video):
        return self._create_or_update_video(video, **{'liked': False})

    def liked_videos(self):
        videos = list()
        for item in UserVideo.objects.filter(user=self, liked=True).order_by('-liked_timestamp'):
            videos.append(item.video)
        return videos

    def save_video(self, video, timestamp=datetime.utcnow()):
        return self._create_or_update_video(video, **{'saved': True, 'timestamp': timestamp})

    def remove_video(self, video):
        return self._create_or_update_video(video, **{'saved': False})

    def saved_videos(self):
        videos = list()
        for item in UserVideo.objects.filter(user=self, saved=True).order_by('-saved_timestamp'):
            videos.append(item.video)
        return videos


class UserFollowsUser(models.Model):
    follower = models.ForeignKey(User, related_name='followee', db_index=True)
    followee = models.ForeignKey(User, related_name='follower', db_index=True)
    since = models.DateTimeField(auto_now=True, db_index=True)


class UserVideo(models.Model):
    user = models.ForeignKey(User)
    video = models.ForeignKey(Video)
    saved = models.BooleanField(default=True, db_index=True)
    saved_timestamp = models.DateTimeField(null=True, db_index=True)
    liked = models.BooleanField(default=False, db_index=True)
    liked_timestamp = models.DateTimeField(null=True, db_index=True)
    watched = models.BooleanField(default=False, db_index=True)
    watched_timestamp = models.DateTimeField(null=True, db_index=True)

    def info_view(self):
        return { 'url': self.video.url,
                 'id': self.video.id,
                 'liked': self.liked,
                 'likes': UserVideo.objects.filter(video=self.video, liked=True).count(),
                 'saved': self.saved,
                 'saves': UserVideo.objects.filter(video=self.video, saved=True).count() }

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
