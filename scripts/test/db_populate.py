import sys, os, datetime

# the settings module is in the project root package 3 dirs up...
# (so following path mod assumes you are executing this script from within
# its containing directory)
sys.path.append(os.path.abspath('../../../'))

#in case invoking from top-level project directory...
sys.path.append(os.path.abspath('.'))

os.environ['DJANGO_SETTINGS_MODULE'] = 'kikinvideo.settings'

from kikinvideo.models import *

v_thumb_1 = ThumbnailImage()
v_thumb_1.width = 480
v_thumb_1.height = 360
v_thumb_1.url = 'http://i.ytimg.com/vi/UbDFS6cg1AI/0.jpg'
v_thumb_1.save()

v_thumb_2 = ThumbnailImage()
v_thumb_2.width=480
v_thumb_2.height = 360
v_thumb_2.url = "http://i2.ytimg.com/vi/Q_3GgAALPkQ/0.jpg"
v_thumb_2.save()

v_source_1 = VideoSource()
v_source_1.domain = 'http://www.youtube.com'
v_source_1.favicon_url = 'http://s.ytimg.com/yt/favicon-vflZlzSbU.ico'
v_source_1.save()

v_1 = Video()
v_1.url = "http://www.youtube.com/watch?v=UbDFS6cg1AI"
v_1.title='Can I Kick It?'
v_1.description = "See Music Videos http://www.bvmtv.com/ that you CAN'T See on You Tube! even some X RATED music videos! +Live Chat and Embed video codes.   Pete Rock & C.L. Smooth were an influential rap group from Mount Vernon, New York. They made their debut in the rap world with their 1991 EP, All Souled Out. It sold moderately well enough to justify Elektra Records clearing"
v_1.thumbnail = v_thumb_1
v_1.source = v_source_1
v_1.last_updated = datetime.now()
v_1.save()

v_2 = Video()
v_2.url = "http://www.youtube.com/watch?v=Q_3GgAALPkQ"
v_2.title='KMD - Peachfuzz (Video) '
v_2.description = "FROM THE ALBUM \"MR. HOOD\" (1991). Click here: http://www.youtube.com/subscription_center?add_user=kennylavish to subscribe.  View my channels: http://www.youtube.com/kennylavish & http://www.youtube.com/kennylavishTV.  Please comment and rate this video... Peace!!"
v_2.thumbnail = v_thumb_2
v_2.source = v_source_1
v_2.last_updated = datetime.now()
v_2.save()

User.objects.get(pk=2).save_video(v_2)

#
# Note: use following facebook account for testing:
# email: kikintestaccount@yahoo.com
# password : savemore
#
user_1 = User()
user_1.name = "Joe Smith"
user_1.email = "kikintestaccount@yahoo.com"
user_1.save()

user_1_likes_v1 = UserLikedVideo(user=user_1, video=v_1)
user_1_likes_v1.save()

user_1_saved_v1 = UserSavedVideo(user=user_1, video=v_1)
user_1_saved_v1.save()

user_1_watched_v1 = UserWatchedVideo(user=user_1, video=v_1)
user_1_watched_v1.save()

liked = user_1.liked_videos.all()[0]

liked_info = UserLikedVideo.objects.filter(user__exact=user_1, video__exact=liked)

print liked_info[0].video.title
print liked_info[0].date