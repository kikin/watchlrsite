from django.core.management.base import BaseCommand, CommandError
from api.models import User, UserVideo

class Command(BaseCommand):
    args = '<username username ...>'
    help = 'Removes videos that were imported from Facebook news feed for user'

    def handle(self, *args, **options):
        for username in args:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                raise CommandError('User "%s" does not exist' % username)

            for activity in user.activity():
                for user_activity in activity.user_activities:
                    if not user_activity.action == 'share':
                        break
                else:
                    print 'Deleting video: %s' % activity.video.url
                    for user_activity in activity.user_activities:
                        UserVideo.objects.get(user=user_activity.user, video=activity.video).delete()
                    activity.video.delete()
