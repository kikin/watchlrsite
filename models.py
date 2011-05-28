from django.db import models
from django.contrib.auth import models as auth_models

#note: because now subclassing django.contrib.auth.User, we also
#get the email field in our spec and an auto-incrementing id field.
#There is a password field as well, but if no
#password is provided when creating and
#saving a User instance, it will simply be marked as having
#an unusable password (see https://docs.djangoproject.com/en/dev
#/topics/auth/#django.contrib.auth.models.User.set_unusable_password)
#and we can let the facebook auth backend handle authentication.
class User(auth_models.User):
	name = models.CharField(max_length=200)
	facebook_access_token = models.CharField(max_length=100)
	saved_videos = models.ManyToManyField('Video', related_name='saved_videos', through='UserSavedVideo')
	liked_videos = models.ManyToManyField('Video', related_name='liked_videos', through='UserLikedVideo')
	watched_videos = models.ManyToManyField('Video', related_name='watched_videos', through='UserWatchedVideo')
	followed_users = models.ManyToManyField('User', through='UserFollowsUser')

class Video(models.Model):
	id = models.AutoField(primary_key=True)
	url = models.CharField(max_length=1000)
	description = models.TextField(max_length=3000)
	thumbnail = models.ForeignKey('ThumbnailImage', related_name='thumbnail')
	mobile_thumbnail = models.ForeignKey('ThumbnailImage', related_name='mobile_thumbnail')
	embed_code_html = models.TextField(max_length=3000)
	embed_code_html5 = models.TextField(max_length=3000)
	source = models.ManyToManyField('VideoSource')
	last_updated = models.DateTimeField(max_length=3000)

class VideoSource(models.Model):
	id = models.AutoField(primary_key=True)
	domain = models.CharField(max_length=1000)
	favicon_url = models.CharField(max_length=1000)
	videos = models.ManyToManyField('Video')

class ThumbnailImage(models.Model):
	id = models.AutoField(primary_key=True)
	url = models.CharField(max_length=1000)
	width = models.IntegerField()
	height = models.IntegerField()

#associate necessary additional info with user-video mappings...

#These models define the properties of the relation tables
#mapping users to videos for user.saved_videos
#User.liked_videos, and user.watched_videos User properties
class UserSavedVideo(models.Model):
	user = models.ForeignKey('User')
	video = models.ForeignKey('Video')
	liked = models.BooleanField()
	watched = models.BooleanField()
	date = models.DateTimeField()


class UserLikedVideo(models.Model):
	user = models.ForeignKey('User')
	video = models.ForeignKey('Video')
	saved = models.BooleanField()
	watched = models.BooleanField()
	date = models.DateTimeField()

class UserWatchedVideo(models.Model):
	user = models.ForeignKey('User')
	video = models.ForeignKey('Video')
	date = models.DateTimeField()

class UserFollowsUser(models.Model):
	follower = models.ForeignKey('User', related_name='follower')
	followee = models.ForeignKey('User', related_name='followee')
	date = models.DateTimeField()
