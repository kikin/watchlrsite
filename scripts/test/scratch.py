import sys, os

# the settings module is in the project root package 3 dirs up...
# (ASSUMING you are execting this script from within the
# directory containing it)

sys.path.append(os.path.abspath('../../../'))

#in case invoking from top-level project directory...
sys.path.append(os.path.abspath('.'))

os.environ['DJANGO_SETTINGS_MODULE'] = 'kikinvideo.settings'

from kikinvideo.models import *

u = User.objects.get(pk=2)

v = Video.objects.all()[0]
u.like_video(v)

l = u.get_liked_videos()
print l