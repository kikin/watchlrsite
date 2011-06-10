from django import template
from datetime import datetime
from urlparse import urlparse
from kikinvideo.api.models import UserVideo

register = template.Library()

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
        return str(day_diff/7) + " weeks ago"
    if day_diff < 365:
        return str(day_diff/30) + " months ago"
    return str(day_diff/365) + " years ago"


@register.filter
def date_saved(video, user):
    return video.date_saved(user)

@register.filter
def pretty_date_saved(video, user):
    return pretty_date(video.date_saved(user))

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
def truncate_text(text, letter_count):
    if len(text) > letter_count:
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
        return '/static/images/default_video_item.png'
    if len(thumbs) > 0:
        return thumbs[0].url
    return ""

@register.filter
def fb_thumb_small(users, user):
    for user_tuple in users:
        if user_tuple[0] != user:
           return  "https://graph.facebook.com/"+user_tuple[0].facebook_uid()+ "/picture?type=square"
    return "https://graph.facebook.com/"+user.facebook_uid()+ "/picture?type=square"

@register.filter
def activity_item_heading(activity_item, user):
    video = activity_item.video
    content = ''
    if activity_item.video in user.liked_videos():
        content = "You"
        if len(activity_item.users) == 1:
            content += " like this."

        elif len(activity_item.users) == 2:
            if activity_item.users[0][0] != user:
                content += ' and <a href="/'+activity_item.users[0][0].username+'">'+activity_item.users[0][0].first_name+'</a> like this.'
            else:
                content += ' and <a href="/'+activity_item.users[1][0].username+'">'+activity_item.users[1][0].first_name+'</a> like this.'
        elif len(activity_item.users) > 2:
            if activity_item.users[0][0] != user:
                content += ', <a href="/'+activity_item.users[0][0].username+'">'+activity_item.users[0][0].first_name+'</a> '
            else:
                content += ', <a href="/'+activity_item.users[0][0].username+'">'+activity_item.users[1][0].first_name+'</a> '
            content += ' and ' + str(len(activity_item.users) - 2) + ' others like this.'
    
    else:
        if len(activity_item.users) == 1:
            content += '<a href="/'+activity_item.users[0][0].username+'">'+activity_item.users[0][0].first_name+'</a> likes this.'
        if len(activity_item.users) == 2:
            content += '<a href="/'+activity_item.users[0][0].username+'">'+activity_item.users[0][0].first_name+'</a> '
            content += 'and <a href="/'+activity_item.users[1][0].username+'">'+activity_item.users[1][0].first_name+'</a> like this.'
        elif len(activity_item.users) > 2:
            content += '<a href="/'+activity_item.users[0][0].username+'">'+activity_item.users[0][0].first_name+'</a> '
            content += 'and ' + str(len(activity_item.users) - 1) + 'others like this.'
    return content