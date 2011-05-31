import sys, os

# the settings module is in the project root package 3 dirs up...
# (ASSUMING you are execting this script from within the
# directory containing it)

sys.path.append(os.path.abspath('../../../'))

#in case invoking from top-level project directory...
sys.path.append(os.path.abspath('.'))

os.environ['DJANGO_SETTINGS_MODULE'] = 'kikinvideo.settings'

from kikinvideo.models import *
from social_auth.models import UserSocialAuth

Thumbnail.objects.all().delete()

Source.objects.all().delete()
Video.objects.all().delete()
UserSocialAuth.objects.all().delete()
User.objects.all().delete()
UserVideo.objects.all().delete()
