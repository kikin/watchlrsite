from django.core.management.base import BaseCommand
from johnny.cache import invalidate
from api.models import User, UserVideo

from hookjohnny import hook_johnny_cache
hook_johnny_cache()

class Command(BaseCommand):
    help = 'Recalculates karma points for all users in system'

    def handle(self, *args, **options):
        # Zero out karma points for everybody
        User.objects.update(karma=0)
        
        invalidate(User)

        # For every liked video, assign karma points to sharing user
        for user_video in UserVideo.objects.filter(liked=True):
            user_video.video.increment_karma(user_video.user)
