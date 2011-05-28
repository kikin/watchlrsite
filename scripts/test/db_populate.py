import sys, os

# the settings module is in the project root package 3 dirs up...
# (ASSUMING you are execting this script from within the 
# directory containing it)

sys.path.append(os.path.abspath('../../../'))

os.environ['DJANGO_SETTINGS_MODULE'] = 'kikinvideo.settings'

from kikinvideo.models import *

nick = User()
nick.name = "Nicholas Zaillian"

