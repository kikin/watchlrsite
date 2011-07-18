from django import template
from datetime import datetime
from urlparse import urlparse
from operator import attrgetter

from django.conf import settings as app_settings
from django.utils.encoding import force_unicode

from celery import states

from kikinvideo.api.models import UserVideo
from kikinvideo.webapp.helpers import VideoHelper

register = template.Library()

HTML5_SOURCE_WHITELIST = ['espn', 'funnyordie', 'ted']

@register.filter
def pretty_date(time=False):
    """
    Get a datetime object or a int() Epoch timestamp and return a
    pretty string like 'an hour ago', 'Yesterday', '3 months ago',
    'just now', etc
    """
    now = datetime.utcnow()
    if type(time) is int:
        diff = now - datetime.fromtimestamp(time)
    elif isinstance(time,datetime):
        diff = now - time
    elif not time:
        diff = now - now
    second_diff = diff.seconds
    day_diff = diff.days

    if day_diff < 0:
        return ''

    if day_diff == 0:
        if second_diff < 10:
            return "just now"
        if second_diff < 60:
            return str(second_diff) + " seconds ago"
        if second_diff < 120:
            return  "a minute ago"
        if second_diff < 3600:
            return str( second_diff / 60 ) + " minutes ago"
        if second_diff < 7200:
            return "an hour ago"
        if second_diff < 86400:
            return str( second_diff / 3600 ) + " hours ago"
    if day_diff == 1:
        return "Yesterday"
    if day_diff < 7:
        return str(day_diff) + " days ago"
    if day_diff < 31:
        if day_diff < 14:
            return 'last week'
        else:
            return str(day_diff/7) + " weeks ago"
    if day_diff < 365:
        if day_diff < 60:
            return 'a month ago'
        else:
            return str(day_diff/30) + " months ago"
    return str(day_diff/365) + " years ago"


@register.filter
def date_saved(video, user):
    return video.date_saved(user)

@register.filter
def pretty_date_saved(video, user):
    return pretty_date(video.date_saved(user))

@register.filter
def pretty_date_liked(video, user):
    return pretty_date(video.date_liked(user))

@register.filter
def pretty_earliest_date(video, user):
    try:
        user_video = UserVideo.objects.get(video=video, user=user)
        if user_video.saved_timestamp and user_video.liked_timestamp:
            if user_video.saved_timestamp < user_video.liked_timestamp:
                earliest = user_video.saved_timestamp
            else:
                earliest = user_video.liked_timestamp
        elif user_video.liked_timestamp:
            earliest = user_video.liked_timestamp
        else:
            earliest = user_video.saved_timestamp
    except UserVideo.DoesNotExist:
        try:
            user_video = UserVideo.objects\
                            .filter(video=video, liked_timestamp__isnull=False)\
                            .values('liked_timestamp')\
                            .order_by('liked_timestamp')[0:1]\
                            .get()
            earliest = user_video['liked_timestamp']
        except UserVideo.DoesNotExist:
            user_video = UserVideo.objects\
                            .filter(video=video, saved_timestamp__isnull=False)\
                            .values('saved_timestamp')\
                            .order_by('saved_timestamp')[0:1]\
                            .get()
            earliest = user_video['saved_timestamp']
    return pretty_date(earliest)

@register.filter
def total_liked_videos(user):
    return len(user.liked_videos())

@register.filter
def total_saved_videos(user):
    return len(user.saved_videos())

@register.filter
def possessive(value):
    if value[-1] == 's':
        return "%s'" % value
    return "%s's" % value

@register.filter
def source_icon(video):
    #temporary fix for null favicon error Kapil is experiencing
    try:
        favicon = video.source.favicon
        return video.source.favicon
    except Exception:
        return ""

@register.filter
def video_page(video, user):
    user_video = UserVideo.objects.get(video=video, user=user).host
    if not user_video:
        return ""
    return user_video

@register.filter
def source_url_root(video):
    try:
        source_url_components = urlparse(video.source.url)
        return source_url_components.scheme + "://" + source_url_components.hostname
    #going to swallow this...
    except Exception:
        return ""
    
@register.filter
def is_youtube(video):
    return video.source.name == 'YouTube'

@register.filter
def is_vimeo(video):
    return video.source.name == 'Vimeo'

# NOTE: THIS IS A STOPGAP.
# KEEP FOR TONIGHT'S DEMO ONLY, THEN
# RESOLVE THE MATTER OF WHY CERTAIN HTML5
# VIDS FAIL TO PLAY IN CHROME
@register.filter
def is_html5_capable(video):
    url_root = source_url_root(video)
    return True in [url_root.find(x) != -1 for x in HTML5_SOURCE_WHITELIST]

@register.filter
def truncate_text(text, letter_count):
    if text and len(text) > letter_count:
        return text[0:letter_count] + '...'
    else:
        return text

@register.filter
def smart_truncate(text, letter_count):
    if not text:
        return ''
    if len(text) > letter_count:
        if text[letter_count] != ' ' and text.find(' ') != -1:
            return text[0:text.rfind(' ')] + '...'
        return text[0:letter_count] + '...'
    else:
        return text

@register.filter
def web_thumbnail_url(video):
    #until integrity assured, return the first of the web-type thumbs
    #associated with video.
    thumbs = video.thumbnails.filter(type='web')
    if len(thumbs) == 0:
        return '/static/images/default_video_icon.png'
    if len(thumbs) > 0:
        return thumbs[0].url
    return ""

@register.filter
def no_likes(video):
    return len(video.all_likers()) == 0

@register.filter
def fb_thumb_small(user_activities, user):
    for user_activity in user_activities:
        if user_activity.user != user:
           return  "https://graph.facebook.com/"+user_activity.user.facebook_uid()+ "/picture?type=square"
    return "https://graph.facebook.com/"+user.facebook_uid()+ "/picture?type=square"

@register.filter
def fb_thumb_href(user_activities, user):
    def get_link(user):
        target = "href=%s" % user.get_absolute_url()
        if not user.is_registered:
            target += " target=_blank"
        return target

    for user_activity in user_activities:
        if user_activity.user != user:
           return get_link(user_activity.user)
    if len(user_activities) == 1:
        return get_link(user_activities[0].user)
    return ""

@register.filter
def activity_item_heading(activity_item, user):
    video = activity_item.video
    user_activities = activity_item.user_activities

    all_likers = video.all_likers()

    # A video appears in a user's activity queue under the following scenarios:
    # 1. User (and possibly, others) liked a video.
    # 2. User shared a video on Facebook (and others possibly liked it).
    # 3. One or more of the followed users liked a video.
    # 4. One or more of user's Facebook friends shared a video (and others possibly liked it).

    content = ''
    for user_activity in user_activities:
        if not user_activity.user == user:
            continue

        content = 'You'

        if len(user_activities) == 1 and len(all_likers) == 0:
            content += ' shared...'

        elif len(user_activities) == 1 and len(all_likers) == 1:
            content += ' liked...'

        elif len(user_activities) == 1 and len(all_likers) == 2:
            if user_activity.type == 'like':
                content += ' and 1 other liked...'
            elif user_activity.type == 'share':
                content += ' shared and 1 other liked...'

        elif len(user_activities) == 1 and len(all_likers) > 2:
            if user_activity.type == 'like':
                content += ' and ' + str(len(all_likers) - 1) + ' others liked...'
            elif user_activity.type == 'share':
                content += ' shared and ' + str(len(all_likers)) + ' others liked...'

        elif len(user_activities) == 2 and len(all_likers) == 2:
            if not 'share' in map(attrgetter('type'), user_activities):
                other = user_activities[0].user if not user == user_activities[0].user else user_activities[1].user
                content += ' and <a href="/'+other.username+'">'+other.first_name+'</a> liked...'
            else:
                sharer = map(attrgetter('user'), filter(lambda a: a.type == 'share', user_activities))[0]
                content = '<a '+user_profile_link(sharer)+'>'+sharer.first_name+'</a> shared, You and 1 other liked...'

        elif len(user_activities) >= 2:
            sharers = map(attrgetter('user'), filter(lambda a: a.type == 'share', user_activities))
            if sharers:
                if sharers == [user]:
                    content += ' shared'
                else:
                    other = sharers[0] if not user == sharers[0] else sharers[1]
                    if user in sharers:
                        content += ', <a '+user_profile_link(other)+'>'+other.first_name+'</a> shared'
                    else:
                        content = '<a '+user_profile_link(other)+'>'+other.first_name+'</a> shared'

            likers = map(attrgetter('user'), filter(lambda a: a.type == 'like', user_activities))
            if len(sharers):
                if len(likers) >= 1:
                    if user in likers:
                        content += ', You'
                    else:
                        content += ', <a '+user_profile_link(likers[0].user)+'>'+likers[0].user.first_name+'</a>'

                    other_likers = len(all_likers) - 1
                    if other_likers > 1:
                        content += ' and ' + str(len(all_likers) - 1) + ' others liked...'
                    elif other_likers > 0:
                        content += ' and 1 other liked...'
                    else:
                        content += ' liked...'
                else:
                    content += ', ' + str(len(all_likers)) + ' others liked...'
            else:
                other = likers[0] if not user == likers[0] else likers[1]
                content += ', <a href="/'+other.username+'">'+other.first_name+'</a> '
                if len(all_likers) - 2 == 1:
                    content += ' and 1 other liked...'
                else:
                    content += ' and ' + str(len(all_likers) - 2) + ' others liked...'

        break

    else:
        if len(user_activities) == 1 and len(all_likers) == 0:
            content += '<a '+user_profile_link(user_activities[0].user)+'>'+user_activities[0].user.first_name+'</a> shared...'

        if len(user_activities) == 1 and len(all_likers) == 1:
            if user_activities[0].type == 'like':
                content += '<a href="/'+user_activities[0].user.username+'">'+user_activities[0].user.first_name+'</a> liked...'
            else:
                content += '<a '+user_profile_link(user_activities[0].user)+'>'+user_activities[0].user.first_name+'</a> shared, 1 other liked...'

        elif len(user_activities) == 1 and len(all_likers) == 2:
            content += '<a href="/'+user_activities[0].user.username+'">'+user_activities[0].user.first_name+'</a>'
            content += ' and 1 other liked...'

        elif len(user_activities) == 1 and len(all_likers) > 2:
            content += '<a href="/'+user_activities[0].user.username+'">'+user_activities[0].user.first_name+'</a>'
            content += ' and ' + str(len(all_likers) - 1) + ' others liked...'

        elif len(user_activities) == 2 and len(all_likers) == 1:
            sharer = user_activities[0].user if user_activities[0].type == 'share' else user_activities[1].user
            content += '<a '+user_profile_link(sharer)+'>'+sharer.first_name+'</a> shared, '
            other = user_activities[0].user if not user_activities[0].user == sharer else user_activities[1].user
            content += '<a '+user_profile_link(other)+'>'+other.first_name+'</a> liked...'

        elif len(user_activities) == 2 and len(all_likers) == 2:
            if 'share' in map(attrgetter('type'), user_activities):
                sharer = user_activities[0].user if user_activities[0].type == 'share' else user_activities[1].user
                content += '<a '+user_profile_link(sharer)+'>'+sharer.first_name+'</a> shared, '
                other = user_activities[0].user if not user_activities[0].user == sharer else user_activities[1].user
                content += '<a '+user_profile_link(other)+'>'+other.first_name+'</a> and 1 other liked...'
            else:
                content += '<a href="/'+user_activities[0].user.username+'">'+user_activities[0].user.first_name+'</a>, '
                content += ' and <a href="/'+user_activities[1].user.username+'">'+user_activities[1].user.first_name+'</a> liked...'

        elif len(user_activities) == 2 and len(all_likers) == 3:
            content += '<a href="/'+user_activities[0].user.username+'">'+user_activities[0].user.first_name+'</a>, '
            content += '<a href="/'+user_activities[1].user.username+'">'+user_activities[1].user.first_name+'</a>'
            content += ' and 1 other liked...'

        elif len(user_activities) == 2 and len(all_likers) > 3:
            content += '<a href="/'+user_activities[0].user.username+'">'+user_activities[0].user.first_name+'</a>, '
            content += '<a href="/'+user_activities[1].user.username+'">'+user_activities[1].user.first_name+'</a>'
            content += ' and '+ str(len(all_likers)-2) + ' others liked...'

        elif len(user_activities) > 2:
            content += '<a href="/'+user_activities[0].user.username+'">'+user_activities[0].user.first_name+'</a>, '
            if len(all_likers) - 2 == 1:
                content += ' and 1 other liked...'
            else:
                content += ' and ' + str(len(all_likers) - 1) + ' others liked...'

    return content

@register.filter
def is_shared_activity_item(activity_item):
    return 'share' in map(attrgetter('type'), activity_item.user_activities)

@register.filter
def last_element(list):
    return list[-1]

@register.filter
def fetching_data(video):
    if not video.status() == states.SUCCESS:
        return True
    return False
    #Alt implementation (uncomment and use if critical issue arises with
    #with celery task queue).  Simply checks whether a few essential
    #fields of the Video model are None and, if so, assumes data is still
    #being fetched
    #if not video or not video.title or not video.description or not \
    #    video.get_thumbnail().url:
    #    return True
    #return False

@register.filter
def error_fetching_data(video):
    if video.status() in states.PROPAGATE_STATES:
        return True
    return False

@register.filter
def full_name(user):
    if not user.last_name:
        return user.first_name
    if not user.first_name:
        return user.last_name
    return user.first_name + ' ' + user.last_name

#returns either 'mozilla', 'ie', 'safari', 'chrome' or 'other'
@register.filter
def user_agent_class(request):
    u_a = request.META['HTTP_USER_AGENT'].lower()
    if u_a.find('chrome') != -1:
        return 'chrome'
    if u_a.find('safari') != -1:
        return 'safari'
    if u_a.find('internet explorer') != -1:
        return 'ie'
    if u_a.find('gecko') != -1:
        return 'firefox'
    return 'other'

@register.filter
def user_agent_os(request):
    u_a = request.META['HTTP_USER_AGENT'].lower()
    if u_a.find('mac') != -1:
        return 'mac'
    if u_a.find('windows') != -1:
        return 'windows'


@register.inclusion_tag('inclusion_tags/video_player_flash.hfrg')
def video_player_flash(video):
    return { 'video' : video }

@register.inclusion_tag('inclusion_tags/video_player_html5.hfrg')
def video_player_html5(video):
    return { 'video' : video, 'settings' : app_settings }

@register.inclusion_tag('inclusion_tags/video_player.hfrg')
def video_player(video, request):
    return { 'video' : video, 'request':request, 'settings':app_settings }

@register.inclusion_tag('inclusion_tags/fetching_data.hfrg')
def fetching_data_message(video):
    return {'video':video}

@register.inclusion_tag('inclusion_tags/error_fetching_data.hfrg')
def error_fetching_data_message(user, video):
    user_video = UserVideo.objects.get(user=user, video=video)
    return {'video':video, 'user_video': user_video}

@register.inclusion_tag('inclusion_tags/video_queue_item.hfrg', takes_context=True)
def video_queue_item(context):
    queue_ctx = {'user':context['user'], 'video':context['video'],\
                 'display_mode':context['display_mode'], 'request':context['request']}
    if 'profile_owner' in context: queue_ctx['profile_owner'] = context['profile_owner']
    return queue_ctx

@register.inclusion_tag('content/user_dropdown.hfrg')
def liked_by_panel(video):
    return {'video':video, 'users':video.all_likers()}

@register.inclusion_tag('inclusion_tags/video_no_embed.hfrg')
def video_no_embed(video):
    return {'video': video }

@register.filter
def user_profile_link(user):
    target = 'href=%s' % user.get_absolute_url()
    if not user.is_registered:
        target += ' target=_blank'
    return target

@register.filter
def truncate_chars(s, num):
    """
    Template filter to truncate a string to at most num characters respecting word
    boundaries.
    """
    s = force_unicode(s)
    length = int(num)
    if len(s) > length:
        length -= 3
        if s[length-1] == ' ' or s[length] == ' ':
            s = s[:length].strip()
        else:
            words = s[:length].split()
            if len(words) > 1:
                del words[-1]
            s = u' '.join(words)
        s += '...'
    return s

@register.filter
def saved_from(video, user):
    try:
        user_video = UserVideo.objects.get(video=video, user=user)

        try:
            if user_video.video.source.name.lower() == 'facebook':
                return video.url
        except Exception:
            pass

        return user_video.host or video.url

    except UserVideo.DoesNotExist:
        return video.url

@register.filter
def raw_source(video_tag):
    return VideoHelper.source_from_video_tag(video_tag)

@register.filter
def iframe_source(youtube_html5_embed_code):
    return VideoHelper.iframe_source(youtube_html5_embed_code)

@register.inclusion_tag('inclusion_tags/watchlr_player.hfrg', takes_context=True)
def watchlr_player(context):
    return {'video':context['video']}

