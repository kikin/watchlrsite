from django.db import models
from django.contrib.auth import models as auth_models

from datetime import datetime

class Source(models.Model):
    id = models.AutoField(primary_key=True)
    url = models.URLField(max_length=1000, verify_exists=False, db_index=True)
    favicon = models.URLField(max_length=1000, verify_exists=False)

class Thumbnail(models.Model):
    id = models.AutoField(primary_key=True)
    url = models.CharField(max_length=1000)
    width = models.IntegerField()
    height = models.IntegerField()

class Video(models.Model):
    url = models.URLField(max_length=1000, verify_exists=False)
    title = models.CharField(max_length=500, db_index=True)
    description = models.TextField(max_length=3000)
    thumbnail = models.ForeignKey(Thumbnail, related_name='videos', null=True)
    mobile_thumbnail = models.ForeignKey(Thumbnail, related_name='mobile_videos', null=True)
    html_embed_code = models.TextField(max_length=3000, null=True)
    html5_embed_code = models.TextField(max_length=3000, null=True)
    source = models.ForeignKey(Source, related_name='videos')
    host = models.URLField(max_length=750, verify_exists=False)
    fetched = models.DateTimeField(auto_now=True, db_index=True)

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
            raise Exception('Must set one of liked/saved/watched flags')

        try:
            user_video = UserVideo.objects.get(user__exact=self, video__exact=video)
        except UserVideo.DoesNotExist:
            user_video = UserLikedVideo(user=self, video=video)

        timestamp = kwargs.get('timestamp', datetime.utcnow())

        for property in properties:
            try:
                setattr(user_video, property, kwargs[property])
                if kwargs[property] == True:
                    setattr(user_video, '%s_timestamp' % property, timestamp)
            except KeyError:
                pass

        if not any([getattr(user_video, property, False) for property in properties]):
            user_video.delete()
        else:
            user_video.save()

    def like_video(self, video, timestamp=datetime.utcnow()):
        self._create_or_update_video(video, **{ 'liked': True, 'timestamp': timestamp })

    def unlike_video(self, video):
        self._create_or_update_video(video, **{ 'liked': False })

    def liked_videos(self):
        videos = list()
        for item in UserVideo.objects.filter(user__exact=self, liked=True).order_by('-liked_timestamp'):
            videos.append(item.video)
        return videos

    def save_video(self, video, timestamp=datetime.utcnow()):
        self._create_or_update_video(video, **{ 'saved': True, 'timestamp': timestamp })

    def remove_video(self, video):
        self._create_or_update_video(video, **{ 'saved': False })

    def saved_videos(self):
        videos = list()
        for item in UserVideo.objects.filter(user__exact=self, saved=True).order_by('-saved_timestamp'):
            videos.append(item.video)
        return videos

    #function to serialize the user properties that should be only visible
    #to their owner
    def to_json_private(self):
        #id long-to-int cast below may be a bad idea...right now, though, str(long_num) produces "long_numL"
        #which isn't consistent with the current API spec
        return str({'id': int(self.id), 'name': self.name, 'first_name': self.first_name,\
                    'last_name': self.last_name, 'facebook_uid': self.facebook_uid(),\
                    'facebook_access_token': self.facebook_access_token()})


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
	
	def like_video(self, video, watched=True, date=datetime.now()):
		#don't allow redundant likes, but do update date...
		existing = UserLikedVideo.objects.filter(user__exact=self, video__exact=video)
		if len(existing) > 0:
			existing[0].date = date
			existing[0].save()

		else:
			user_liked_video = UserLikedVideo(user=self, \
					video=video, watched=watched, date=date)
			
			user_liked_video.save()

	def get_liked_videos(self):
		#queries return QuerySets of UserLikedVideo objs.
		# We just want a list of the videos.  Perhaps there's
		# a better way than this...?:
		liked = []
		for user_video_relation in UserLikedVideo.objects.filter(user__exact=self):
			liked.append(user_video_relation.video)
		return liked

	def remove_liked_video(self, video):
		liked = UserLikedVideo.objects.filter(user__exact=self, video__exact=video)
		liked.delete()


	def save_video(self, video, liked=False, watched=False, date=datetime.now()):
		#don't allow redundant saves, but do update date...
		existing = UserSavedVideo.objects.filter(user__exact=self, video__exact=video)
		if len(existing) > 0:
			existing[0].date = date
			existing[0].save()
		else:
			user_saved_video = UserSavedVideo(user=self, video=video,\
			                       liked=liked, watched=watched, date=date)
			user_saved_video.save()

	def get_saved_videos(self):
		#see comment in get_liked_videos impl. about
		#whether this is the right way to do this...
		saved = []
		for user_video_relation in UserSavedVideo.objects.filter(user__exact=self):
			saved.append(user_video_relation.video)
		return saved

	def remove_saved_video(self, video):
		saved = UserSavedVideo.objects.filter(user__exact=self, video__exact=video)
		saved.delete()



	#function to serialize the user properties that should be only visible
	#to their owner
	def to_json_private(self):
		#id long-to-int cast below may be a bad idea...right now, though, str(long_num) produces "long_numL"
		#which isn't consistent with the current API spec
		return str({'id':int(self.id), 'name':self.name, 'first_name':self.first_name,\
		            'last_name':self.last_name, 'facebook_uid':self.facebook_uid(),\
		            'facebook_access_token':self.facebook_access_token()})

class Video(models.Model):
	id = models.AutoField(primary_key=True)
	url = models.CharField(max_length=1000)
	title = models.CharField(max_length=500, db_index=True)
	description = models.TextField(max_length=3000)
	thumbnail = models.ForeignKey('Thumbnail', related_name='thumbnail', null=True)
	mobile_thumbnail = models.ForeignKey('Thumbnail', related_name='mobile_thumbnail', null=True)
	embed_code_html = models.TextField(max_length=3000, null=True)
	embed_code_html5 = models.TextField(max_length=3000, null=True)
	source = models.ForeignKey('VideoSource', db_index=True)
	last_updated = models.DateTimeField(max_length=3000, auto_now=True, db_index=True)

class VideoSource(models.Model):
	id = models.AutoField(primary_key=True)
	url = models.CharField(max_length=1000, db_index=True)
	favicon_url = models.CharField(max_length=1000)
	videos = models.ManyToManyField('Video')

class Thumbnail(models.Model):
	id = models.AutoField(primary_key=True)
	url = models.CharField(max_length=1000)
	width = models.IntegerField()
	height = models.IntegerField()
	
class UserFollowsUser(models.Model):
    follower = models.ForeignKey(User, related_name='followee', db_index=True)
    followee = models.ForeignKey(User, related_name='follower', db_index=True)
    since = models.DateTimeField(auto_now=True, db_index=True)

class UserVideo(models.Model):
    user = models.ForeignKey(User)
    video = models.ForeignKey(Video)
    saved = models.BooleanField(default=True, db_index=True)
    saved_timestamp = models.DateTimeField(auto_now=True, db_index=True)
    liked = models.BooleanField(default=False, db_index=True)
    liked_timestamp = models.DateTimeField(null=True, db_index=True)
    watched = models.BooleanField(default=False, db_index=True)
    watched_timestamp = models.DateTimeField(null=True, db_index=True)
