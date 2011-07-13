from django.core.management.base import BaseCommand

from api.models import User
from api.tasks import slugify

from re import sub

class Command(BaseCommand):
    help = 'Assign a valid username for users whose names are non-ascii'

    def handle(self, *args, **options):
        for user in User.objects.filter(is_registered=False):
            fullname = '.'.join([user.first_name, user.last_name])
            user.username = slugify(fullname, -1)
            user.save()
