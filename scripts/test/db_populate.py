import sys, os, datetime

# the settings module is in the project root package 3 dirs up...
# (so following path mod assumes you are executing this script from within
# its containing directory)
sys.path.append(os.path.abspath('../../../'))

#in case invoking from top-level project directory...
sys.path.append(os.path.abspath('.'))

os.environ['DJANGO_SETTINGS_MODULE'] = 'kikinvideo.settings'

from kikinvideo.models import *

def print_video_titles(videos):
    print ' | '.join([video.title for video in videos])

v_thumb_1 = Thumbnail()
v_thumb_1.width = 480
v_thumb_1.height = 360
v_thumb_1.url = 'http://i.ytimg.com/vi/UbDFS6cg1AI/0.jpg'
v_thumb_1.save()

v_thumb_2 = Thumbnail()
v_thumb_2.width = 480
v_thumb_2.height = 360
v_thumb_2.url = "http://i2.ytimg.com/vi/Q_3GgAALPkQ/0.jpg"
v_thumb_2.save()

v_source_1 = Source()
v_source_1.url = 'http://www.youtube.com'
v_source_1.favicon = 'http://s.ytimg.com/yt/favicon-vflZlzSbU.ico'
v_source_1.save()

v_1 = Video()
v_1.url = "http://www.youtube.com/watch?v=UbDFS6cg1AI"
v_1.title='Can I Kick It?'
v_1.description = "See Music Videos http://www.bvmtv.com/ that you CAN'T See on You Tube! even some X RATED music videos! +Live Chat and Embed video codes.   Pete Rock & C.L. Smooth were an influential rap group from Mount Vernon, New York. They made their debut in the rap world with their 1991 EP, All Souled Out. It sold moderately well enough to justify Elektra Records clearing"
v_1.thumbnail = v_thumb_1
v_1.source = v_source_1
v_1.fetched = datetime.utcnow()
v_1.save()

v_2 = Video()
v_2.url = "http://www.youtube.com/watch?v=Q_3GgAALPkQ"
v_2.title='KMD - Peachfuzz (Video) '
v_2.description = "FROM THE ALBUM \"MR. HOOD\" (1991). Click here: http://www.youtube.com/subscription_center?add_user=kennylavish to subscribe.  View my channels: http://www.youtube.com/kennylavish & http://www.youtube.com/kennylavishTV.  Please comment and rate this video... Peace!!"
v_2.thumbnail = v_thumb_2
v_2.source = v_source_1
v_2.fetched = datetime.utcnow()
v_2.save()

#
# Note: use following facebook account for testing:
# email: kikintestaccount@yahoo.com
# password : savemore
#
user_1 = User()
user_1.first_name = "Joe"
user_1.last_name = "Smith"
user_1.email = "kikintestaccount@yahoo.com"
user_1.save()

user_video_1 = UserVideo(user=user_1, video=v_1)
user_video_1.liked = True
user_video_1.watched = True
user_video_1.liked_timestamp = user_video_1.watched_timestamp = datetime.utcnow()
user_video_1.save()

user_video_2 = UserVideo(user=user_1, video=v_2)
user_video_2.saved = True
user_video_2.saved_timestamp = datetime.utcnow()
user_video_2.save()

# Only 'Can I Kick It?'
print_video_titles(user_1.liked_videos())

# Videos saved by default - Both 'Can I Kick It?' and 'KMD - Peachfuzz (Video) '
print_video_titles(user_1.saved_videos())

user_1.like_video(v_2)
# Both videos now
print_video_titles(user_1.liked_videos())

user_1.remove_video(v_1)
# Only 'KMD - Peachfuzz (Video) '
print_video_titles(user_1.saved_videos())

user_1.unlike_video(v_2)
# Only 'Can I Kick It?'
print_video_titles(user_1.liked_videos())