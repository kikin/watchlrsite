from django.db import models

UNAUTHORIZED_USER = 'ANONYMOUS'

class Activity(models.Model):
    user_id = models.CharField(max_length=20, db_index=True)
    action = models.CharField(max_length=50, db_index=True)
    secondary_id = models.PositiveIntegerField(null=True, db_index=True)
    agent = models.CharField(max_length=10, null=True, db_index=True)
    agent_version = models.CharField(max_length=10, null=True, db_index=True)
    timestamp = models.DateTimeField(auto_now=True)

class Event(models.Model):
    user_id = models.CharField(max_length=20, db_index=True)
    name = models.CharField(max_length=100, db_index=True)
    value = models.IntegerField(null=True, db_index=True)
    context = models.URLField(verify_exists=False, null=True)
    agent = models.CharField(max_length=10, null=True, db_index=True)
    agent_version = models.CharField(max_length=10, null=True, db_index=True)
    timestamp = models.DateTimeField(auto_now=True)
