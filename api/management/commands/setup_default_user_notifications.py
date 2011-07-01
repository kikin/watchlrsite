from django.core.management.base import BaseCommand
from api.models import User, Notification, DEFAULT_NOTIFICATIONS

class Command(BaseCommand):
    help = 'Sets up default notifications for all registered users'

    def handle(self, *args, **options):
        for user in User.objects.filter(is_registered=True):
            for msg, archived in DEFAULT_NOTIFICATIONS.items():
                notification, created = Notification.objects.get_or_create(user=user, message=msg)
                if created:
                    notification.archived = archived
                    notification.save()
