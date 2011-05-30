from django.db import models
from django.contrib.auth import models as auth_models
	
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
	name = models.CharField(max_length=200, db_index=True)
	saved_videos = models.ManyToManyField('Video', related_name='saved_videos', through='UserSavedVideo')
	liked_videos = models.ManyToManyField('Video', related_name='liked_videos', through='UserLikedVideo')
	watched_videos = models.ManyToManyField('Video', related_name='watched_videos', through='UserWatchedVideo')
	followed_users = models.ManyToManyField('User', through='UserFollowsUser')
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
	#   We should probably, for our own convenience, write
	#   functions for working more seamlessly with the m2m
	#   properties of this model.  i.e.:
	#
	#       def like_video(self, video, saved):
	#           liked_relation = UserLikedVideo(self, video, ...)
	#           liked_relation.save()
	#           ...

class Video(models.Model):
	id = models.AutoField(primary_key=True)
	url = models.CharField(max_length=1000)
	title = models.CharField(max_length=500, db_index=True)
	description = models.TextField(max_length=3000)
	thumbnail = models.ForeignKey('ThumbnailImage', related_name='thumbnail', null=True)
	mobile_thumbnail = models.ForeignKey('ThumbnailImage', related_name='mobile_thumbnail', null=True)
	embed_code_html = models.TextField(max_length=3000, null=True)
	embed_code_html5 = models.TextField(max_length=3000, null=True)
	source = models.ForeignKey('VideoSource', db_index=True)
	last_updated = models.DateTimeField(max_length=3000, auto_now=True, db_index=True)

class VideoSource(models.Model):
	id = models.AutoField(primary_key=True)
	domain = models.CharField(max_length=1000, db_index=True)
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
	user = models.ForeignKey('User', db_index=True)
	video = models.ForeignKey('Video', db_index=True)
	liked = models.BooleanField(default=False, db_index=True)
	watched = models.BooleanField(default=False, db_index=True)
	date = models.DateTimeField(auto_now=True, db_index=True)


class UserLikedVideo(models.Model):
	user = models.ForeignKey('User', db_index=True)
	video = models.ForeignKey('Video', db_index=True)
	saved = models.BooleanField(default=True, db_index=True)
	watched = models.BooleanField(default=False, db_index=True)
	date = models.DateTimeField(auto_now=True, db_index=True)

class UserWatchedVideo(models.Model):
	user = models.ForeignKey('User', db_index=True)
	video = models.ForeignKey('Video', db_index=True)
	date = models.DateTimeField(auto_now=True, db_index=True)

class UserFollowsUser(models.Model):
	follower = models.ForeignKey('User', related_name='follower', db_index=True)
	followee = models.ForeignKey('User', related_name='followee', db_index=True)
	date = models.DateTimeField(auto_now=True, db_index=True)