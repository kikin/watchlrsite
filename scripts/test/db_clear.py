import sys, os

# the settings module is in the project root package 3 dirs up...
# (ASSUMING you are execting this script from within the
# directory containing it)

sys.path.append(os.path.abspath('../../../'))

#in case invoking from top-level project directory...
sys.path.append(os.path.abspath('.'))

os.environ['DJANGO_SETTINGS_MODULE'] = 'kikinvideo.settings'

from kikinvideo.models import *

Thumbnail.objects.all().delete()
VideoSource.objects.all().delete()
Video.objects.all().delete()
User.objects.all().delete()
UserLikedVideo.objects.all().delete()
UserSavedVideo.objects.all().delete()
UserWatchedVideo.objects.all().delete()
UserFollowsUser.objects.all().delete()

nick = User()
nick.name = "Nicholas Zaillian"

