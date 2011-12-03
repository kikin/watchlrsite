from datetime import timedelta
from operator import attrgetter

from django.core.management.base import BaseCommand

from api.models import UserVideo, Video, Activity


class Command(BaseCommand):
    help = 'Populate activity table from user actions'

    def handle(self, *args, **options):
        for uservideo in UserVideo.objects.exclude(liked=False, shared_timestamp__isnull=True):
            action = 'like' if uservideo.liked else 'share'

            if action == 'like':
                users = uservideo.user.followers()
            else:
                users = filter(attrgetter('is_registered'), uservideo.user.facebook_friends())

            for user in users:
                try:
                    activity, created = Activity.objects.get_or_create(user=user,
                                                                       friend=uservideo.user,
                                                                       video=uservideo.video,
                                                                       action=action)

                    if created:
                        timestamp = uservideo.liked_timestamp if action == 'like' else uservideo.shared_timestamp
                        activity.expire_time = timestamp + timedelta(days=14)
                        activity.save()

                except Video.DoesNotExist:
                    pass
