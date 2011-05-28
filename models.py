from django.db import models

class User(models.Model):
	id = models.AutoField(primary_key=True)
	name = models.CharField(max_length=200)
	email = models.CharField(max_length=500)
	facebook_access_token = models.CharField(max_length=100)
	saved_videos = models.ManyToManyField('Video', related_name='saved_videos', through='UserSavedVideo')
	liked_videos = models.ManyToManyField('Video', related_name='liked_videos', through='UserLikedVideo')
	watched_videos = models.ManyToManyField('Video', related_name='watched_videos', through='UserWatchedVideo')
	followed_users = models.ManyToManyField('User', through='UserFollowsUser')

class Video(models.Model):
	id = models.AutoField(primary_key=True)
	url = models.CharField(max_length=1000)
	description = models.TextField(max_length=3000)
	thumbnail = models.TextField(max_length=3000)
	mobile_thumbnail = models.TextField(max_length=3000)
	embed_code_html = models.TextField(max_length=3000)
	embed_code_html5 = models.TextField(max_length=3000)
	source = models.ManyToManyField('VideoSource')
	last_updated = models.DateTimeField(max_length=3000)

class VideoSource(models.Model):
	id = models.AutoField(primary_key=True)
	domain = models.CharField(max_length=1000)
	favicon_url = models.CharField(max_length=1000)
	videos = models.ManyToManyField('Video')

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
