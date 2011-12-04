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
                insert_time = uservideo.liked_timestamp if action == 'like' else uservideo.shared_timestamp
                expire_time = insert_time + timedelta(days=14)
                try:
                    Activity.objects.get_or_create(user=user,
                                                   friend=uservideo.user,
                                                   video=uservideo.video,
                                                   action=action,
                                                   defaults={'insert_time': insert_time, 'expire_time': expire_time})

                except Video.DoesNotExist:
                    # Hmmm... Video no longer exists in database - maybe deleted. Skip for now!
                    pass
