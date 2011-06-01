from django.utils.unittest import TestCase

from api.tasks import fetch
from api.models import Video, User, UserVideo, Thumbnail

class ModelValidityTest(TestCase):

    @classmethod
    def setUpClass(cls):
        print 'set up class'
        
        cls.user = User(first_name='Mike', last_name='Truly', email='mike.truly@domain.net')
        cls.user.save()

        cls.video = Video(url='http://www.youtube.com/watch?v=kh29_SERH0Y')
        cls.video.save()

        UserVideo.objects.create(user=cls.user, video=cls.video).save()
        
    def test_video_thumbnails(self):
        thumbnail_url = 'http://i2.ytimg.com/vi/kh29_SERH0Y/0.jpg'

        self.video.set_thumbnail(thumbnail_url, 480, 360)

        self.assertEqual(thumbnail_url, self.video.get_thumbnail().url)
        self.assertTrue(Thumbnail.objects.filter(url=thumbnail_url))

    def test_video_like(self):
        user.like_video(self.video)
        self.assertEqual([self.video], self.user.liked_videos())

        # Re-like
        user.like_video(self.video)
        self.assertTrue(UserVideo.objects.filter(user=self.user, video=self.video, liked=True))

        # Not so hot now
        self.user.unlike_video(self.video)
        self.assertEquals([], self.user.liked_videos())

        # Hate it :(
        self.user.unlike_video(self.video)
        self.assertFalse(UserVideo.objects.filter(user=self.user, video=self.video, liked=True))

    def test_video_save(self):
        # Videos are saved by default
        self.assertEqual([self.video], self.user.saved_videos())

        # Re-save
        self.user.save_video(self.video)
        self.assertTrue(UserVideo.objects.filter(user=self.user, video=self.video, saved=True))

        self.user.remove_video(self.video)
        self.assertEqual([], self.user.saved_videos())

        # Can remove any number of times
        self.user.remove_video(self.video)
        self.assertFalse(UserVideo.objects.filter(user=self.user, video=self.video, saved=True))
        

class FetchMetadataTest(TestCase):
    def test_youtube_fetch(self):
        user = User(first_name='John', last_name='Smith', email='john.smith@example.com')
        user.save()

        video = Video(url='http://www.youtube.com/watch?v=kh29_SERH0Y',
                      host='http://www.bumpzee.com/YouTube-The-Art-of-FLIGHT-snowboarding-film-trailer-w-Travis-Rice-7335/')
        video.save()

        UserVideo.objects.create(user=user, video=video).save()

        fetch(user.id, video.url, video.host)

        # Re-read updated metadata from database
        video = Video.objects.get(pk=video.id)

        self.assertEqual('The Art of FLIGHT - snowboarding film trailer w/Travis Rice', video.title)
