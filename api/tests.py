from django.test import TestCase
from api.tasks import fetch
from api.models import Video, User, UserVideo

class FetchTest(TestCase):
    def test_youtube_fetch(self):
        user = User(first_name='John', last_name='Smith', email='kikintestaccount@yahoo.com')
        user.save()

        video = Video(url='http://www.youtube.com/watch?v=kh29_SERH0Y',
                      host='http://www.bumpzee.com/YouTube-The-Art-of-FLIGHT-snowboarding-film-trailer-w-Travis-Rice-7335/')
        video.save()

        user_video = UserVideo(user=user, video=video)
        user_video.save()

        fetch(user.id, video.url, video.host)

        # Re-read updated metadata from database
        video = Video.objects.get(pk=video.id)

        self.assertEquals('The Art of FLIGHT - snowboarding film trailer w/Travis Rice', video.title)
