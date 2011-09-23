from django.core.management.base import BaseCommand
from api.models import Video

class Command(BaseCommand):
    help = 'Add url hash to video objects'

    def handle(self, *args, **options):
        for video in Video.objects.all():
            # Just invoke save() which computes and adds the url hash to video object.
            video.save()
