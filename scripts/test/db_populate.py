import sys, os

# the settings module is in the project root package 3 dirs up...
# (ASSUMING you are execting this script from within the 
# directory containing it)

sys.path.append(os.path.abspath('../../../'))

os.environ['DJANGO_SETTINGS_MODULE'] = 'kikinvideo.settings'

from kikinvideo.models import *

v_thumb_1 = ThumbnailImage()
v_thumb_1.width = 480
v_thumb_1.height = 360
v_thumb_1.url = 'http://i.ytimg.com/vi/UbDFS6cg1AI/0.jpg'
v_thumb_1.save()

v_source_1 = VideoSource()
v_source_1.domain = 'http://www.youtube.com'
v_source_1.favicon_url = 'http://s.ytimg.com/yt/favicon-vflZlzSbU.ico'
v_source_1.save()

v_1 = Video()

nick = User()
nick.name = "Nicholas Zaillian"

