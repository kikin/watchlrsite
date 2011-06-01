import sys, os, datetime

# the settings module is in the project root package 3 dirs up...
# (ASSUMING you are execting this script from within the
# directory containing it)

sys.path.append(os.path.abspath('../../../'))

#in case invoking from top-level project directory...
sys.path.append(os.path.abspath('.'))

os.environ['DJANGO_SETTINGS_MODULE'] = 'kikinvideo.settings'

from kikinvideo.api.models import *

User(first_name='John', last_name='Everyman', email='john.everyman@everywhere.com').save()

v_source_1 = Source()
v_source_1.url = 'http://www.youtube.com'
v_source_1.favicon = 'http://s.ytimg.com/yt/favicon-vflZlzSbU.ico'
v_source_1.save()

v_1 = Video()
v_1.url = "http://www.youtube.com/watch?v=UbDFS6cg1AI"
v_1.title = 'Can I Kick It?'
v_1.description = "See Music Videos http://www.bvmtv.com/ that you CAN'T See on You Tube! even some X RATED music videos! +Live Chat and Embed video codes.   Pete Rock & C.L. Smooth were an influential rap group from Mount Vernon, New York. They made their debut in the rap world with their 1991 EP, All Souled Out. It sold moderately well enough to justify Elektra Records clearing"
v_1.source = v_source_1
v_1.fetched = datetime.utcnow()
v_1.save()
v_1.thumbnails.add(Thumbnail(url='http://i.ytimg.com/vi/UbDFS6cg1AI/0.jpg', width=480, height=360))

v_2 = Video()
v_2.url = "http://www.youtube.com/watch?v=Q_3GgAALPkQ"
v_2.title = 'KMD - Peachfuzz (Video) '
v_2.description = "FROM THE ALBUM \"MR. HOOD\" (1991). Click here: http://www.youtube.com/subscription_center?add_user=kennylavish to subscribe.  View my channels: http://www.youtube.com/kennylavish & http://www.youtube.com/kennylavishTV.  Please comment and rate this video... Peace!!"
v_2.source = v_source_1
v_2.fetched = datetime.now()
v_2.html_embed_code = """<embed width="640" height="360" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" "="" src="http://www.youtube.com/v/Q_3GgAALPkQ?version=3&autoplay=1">"""
v_2.save()
v_2.thumbnails.add(Thumbnail(url='http://i2.ytimg.com/vi/Q_3GgAALPkQ/0.jpg', width=480, height=360))

u = User.objects.all()[0]
u.like_video(v_1)
u.save_video(v_2)