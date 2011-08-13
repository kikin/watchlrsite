from django.db import models

UNAUTHORIZED_USER = 'ANONYMOUS'

class Base(models.Model):
    agent = models.CharField(max_length=20, null=True, db_index=True)
    agent_version = models.CharField(max_length=10, null=True, db_index=True)
    context = models.URLField(verify_exists=False, null=True)
    country = models.CharField(max_length=10, null=True, db_index=True)
    city = models.CharField(max_length=100, null=True)
    timestamp = models.DateTimeField(auto_now=True)
    ip_address = models.IPAddressField(null=True)

    class Meta:
        abstract = True


class Activity(Base):
    user_id = models.CharField(max_length=20, db_index=True)
    action = models.CharField(max_length=50, db_index=True)
    secondary_id = models.CharField(max_length=200, null=True, db_index=True)


class Event(Base):
    user_id = models.CharField(max_length=20, db_index=True)
    name = models.CharField(max_length=100, db_index=True)
    value = models.CharField(max_length=250, null=True, db_index=True)


class Error(Base):
    user_id = models.CharField(max_length=20, db_index=True)
    location = models.CharField(max_length=100, db_index=True)
    message = models.CharField(max_length=200, null=True, db_index=True)
    exception = models.TextField(null=True)