from django.db import models
from django.contrib.auth import models as auth_models

class Source(models.Model):
    domain = models.URLField(max_length=750, verify_exists=False)
    favicon = models.URLField(max_length=750, verify_exists=False)

class Video(models.Model):
    url = models.URLField(max_length=1000, verify_exists=False)
    description = models.TextField(max_length=3000)
    thumbnail = models.TextField(max_length=3000)
    mobile_thumbnail = models.TextField(max_length=3000)
    html_embed_code = models.TextField(max_length=3000)
    html5_embed_code = models.TextField(max_length=3000)
    source = models.ForeignKey(Source, related_name='videos')
    host = models.URLField(max_length=750, verify_exists=False)

class User(auth_models.User):
    videos = models.ManyToManyField(Video, through='UserVideo')
    follows = models.ManyToManyField('self', symmetrical=False)

class Notifications(models.Model):
    user = models.ForeignKey(User, related_name='notifications')
    name = models.CharField(max_length=25, db_index=True)
    value = models.PositiveSmallIntegerField()

class Preferences(models.Model):
    user = models.ForeignKey(User, related_name='preferences')
    name = models.CharField(max_length=25, db_index=True)
    value = models.PositiveSmallIntegerField()

class UserVideo(models.Model):
    user = models.ForeignKey(User)
    video = models.ForeignKey(Video)
    saved = models.BooleanField(db_index=True)
    saved_timestamp = models.DateTimeField(db_index=True)
    liked = models.BooleanField(db_index=True)
    liked_timestamp = models.DateTimeField(db_index=True)
    watched = models.BooleanField(db_index=True)
    watched_timestamp = models.DateTimeField(db_index=True)
