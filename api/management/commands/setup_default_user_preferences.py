from django.core.management.base import BaseCommand
from api.models import User, Preference, DEFAULT_PREFERENCES

class Command(BaseCommand):
    help = 'Sets up default preferences for all registered users'

    def handle(self, *args, **options):
        for user in User.objects.filter(is_registered=True):
            for name, value in DEFAULT_PREFERENCES.items():
                preference, created = Preference.objects.get_or_create(user=user, name=name)
                if created:
                    preference.value = value
                    preference.save()
