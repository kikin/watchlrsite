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
    return video.source.favicon

@register.filter
def video_page(video):
    return video.source.url

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
    return text[0:letter_count]