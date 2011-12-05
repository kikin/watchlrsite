from datetime import timedelta
from optparse import make_option
from django.core.management.base import BaseCommand, CommandError
from api.models import UserVideo, Video, Activity, FacebookFriend

class Command(BaseCommand):
    help = 'Populate activity table from user actions'

    option_list = BaseCommand.option_list + (
                    make_option('--only-likes',
                                action='store_true',
                                dest='only_likes',
                                default=False,
                                help='Add only like events'),
                    make_option('--only-shares',
                                action='store_true',
                                dest='only_shares',
                                default=False,
                                help='Add only Facebook shares'),
                  )

    def handle(self, *args, **options):
        if options['only_likes'] and options['only_shares']:
            raise CommandError('Cannot supply both "--only-likes" and "--only-shares"')
        
        if options['only_likes']:
            query = UserVideo.objects.filter(liked=True)
        elif options['only_shares']:
            query = UserVideo.objects.filter(shared_timestamp__isnull=False)
        else:
            query = UserVideo.objects.exclude(liked=False, shared_timestamp__isnull=True)

        for uservideo in query:
            action = 'like' if uservideo.liked else 'share'

            if action == 'like':
                users = uservideo.user.followers()
            else:
                users = FacebookFriend.objects.filter(fb_friend=uservideo.user)

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
