from django.db import models
from django.contrib.auth import models as auth_models

from datetime import datetime

class Source(models.Model):
    name = models.CharField(max_length=100, unique=True)
    url = models.URLField(max_length=750, verify_exists=False)
    favicon = models.URLField(max_length=750, verify_exists=False)


class Video(models.Model):
    url = models.URLField(max_length=750, verify_exists=False)
    title = models.CharField(max_length=500, db_index=True)
    description = models.TextField(max_length=3000)
    html_embed_code = models.TextField(max_length=3000, null=True)
    html5_embed_code = models.TextField(max_length=3000, null=True)
    source = models.ForeignKey(Source, related_name='videos', null=True)
    host = models.URLField(max_length=750, verify_exists=False)
    fetched = models.DateTimeField(null=True, db_index=True)

    def set_thumbnail(self, url, width, height, type='web'):
        self.thumbnails.add(Thumbnail(url=url, width=width, height=height, type=type))

    def get_thumbnail(self, type='web'):
        return self.thumbnails.get(type=type)


class Thumbnail(models.Model):
    video = models.ForeignKey(Video, related_name='thumbnails')
    type = models.CharField(max_length=10, default='web')
    url = models.URLField(max_length=750, verify_exists=False)
    width = models.IntegerField()
    height = models.IntegerField()


#note: because we're now subclassing django.contrib.auth.User
#for this model, we also get the email field
#from our spec and an auto-incrementing id field.
#There is a password field as well, but if no
#password is provided when creating and
#saving a User instance, it will simply be marked as having
#an unusable password (see https://docs.djangoproject.com/en/dev
#/topics/auth/#django.contrib.auth.models.User.set_unusable_password)
#and we can let the facebook auth backend handle authentication.
class User(auth_models.User):
    videos = models.ManyToManyField(Video, through='UserVideo')
    follows = models.ManyToManyField('self', symmetrical=False)

    # Use UserManager to get the create_user method, etc.
    objects = auth_models.UserManager()

    #we initially had facebook_access_token and uid columns/properties
    #for this model, but the user's token and uid are already being
    #stored in the extra_data property of the UserSocialAuth model
    #built into django-social-auth, so you can use the following instance
    #methods to access these things...
    def facebook_access_token(self):
        return self.social_auth.get().extra_data['access_token']

    def facebook_uid(self):
        return self.social_auth.get().uid

    #note:
    #   For our own convenience, we should have
    #   functions for working more seamlessly with the m2m
    #   properties of this model:

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
