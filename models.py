from django.db import models

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