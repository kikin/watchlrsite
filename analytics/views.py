from django.conf import settings
from django.http import HttpResponse, HttpResponseForbidden, HttpResponseBadRequest, HttpResponseNotFound
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.db.models.aggregates import Count
from django.contrib.sessions.models import Session

from analytics.models import Activity, Event, Error, UNAUTHORIZED_USER
from api.models import User
from api.views import jsonp_view
from api.exception import BadRequest
from api.utils import to_jsonp

from datetime import datetime, date, timedelta
from gviz_api import DataTable

import logging
logger = logging.getLogger('kikinvideo')

import pygeoip
try:
    GEOIP = pygeoip.GeoIP(settings.GEOIP_DATABASE_PATH)
except IOError:
    GEOIP = None
    logger.warn('GeoIP database not found. Please check GEOIP_DATABASE_PATH environment variable.')

# Default date format to use when parsing input.
DATE_FORMAT = '%Y-%m-%d'


def internal(view):
    # Decorates a view as accessible from INTERNAL_IPS only.
    def wrapper_view(request, *args, **kwargs):
        remote_addr = request.META.get('HTTP_X_REAL_IP', request.META.get('REMOTE_ADDR', None))
        if not (settings.DEBUG or remote_addr in settings.INTERNAL_IPS):
            return HttpResponseForbidden()
        return view(request, *args, **kwargs)
    return wrapper_view


def geolocate(view):
    def wrap(request, *args, **kwargs):
        agent = request.REQUEST.get('agent')
        version = request.REQUEST.get('version')

        ip_address = request.META['REMOTE_ADDR']

        location = GEOIP.record_by_addr(ip_address) if GEOIP else None
        country = location.get('country_code') if location else None
        city = location.get('city') if location else None

        context = request.META.get('HTTP_REFERER')

        kwargs.update({ 'agent': agent,
                        'version': version,
                        'context': context,
                        'country': country,
                        'city': city,
                        'ip': ip_address })

        return view(request, *args, **kwargs)

    return wrap


def user_context(f):
    def wrap(request, *args, **kwargs):
        user = request.user

        if not user.is_authenticated():
            try:
                # Clients can send session key as a request parameter
                session_key = request.REQUEST['session_id']
                session = Session.objects.get(pk=session_key)

                if not session.expire_date <= datetime.now():
                    uid = session.get_decoded().get('_auth_user_id')
                    request.user = User.objects.get(pk=uid)

            except (KeyError, Session.DoesNotExist):
                pass

        return f(request, *args, **kwargs)

    return wrap


@jsonp_view
@geolocate
@user_context
def action(request, *args, **kwargs):
    user_id = str(request.user.id) if request.user.is_authenticated() else UNAUTHORIZED_USER

    try:
        action = request.REQUEST['action']
    except KeyError:
        raise BadRequest('Missing required parameter: action')

    secondary_id = request.REQUEST.get('id')

    activity = Activity.objects.create(user_id=user_id,
                                       action=action,
                                       secondary_id=secondary_id,
                                       context=kwargs.get('context'),
                                       agent=kwargs.get('agent'),
                                       agent_version=kwargs.get('version'),
                                       country=kwargs.get('country'),
                                       city=kwargs.get('city'),
                                       ip_address=kwargs.get('ip'))
    return { 'id': activity.id }


@jsonp_view
@geolocate
@user_context
def event(request, *args, **kwargs):
    user_id = str(request.user.id) if request.user.is_authenticated() else UNAUTHORIZED_USER

    try:
        name = request.REQUEST['name']
    except KeyError:
        raise BadRequest('Missing required parameter: name')

    value = request.REQUEST.get('value')

    event = Event.objects.create(user_id=user_id,
                                 name=name,
                                 value=value,
                                 context=kwargs.get('context'),
                                 agent=kwargs.get('agent'),
                                 agent_version=kwargs.get('version'),
                                 country=kwargs.get('country'),
                                 city=kwargs.get('city'),
                                 ip_address=kwargs.get('ip'))

    return { 'id': event.id }


@jsonp_view
@geolocate
@user_context
def error(request, *args, **kwargs):
    user_id = str(request.user.id) if request.user.is_authenticated() else UNAUTHORIZED_USER

    location = request.REQUEST.get('location')
    message = request.REQUEST.get('message')
    exception = request.REQUEST.get('exception')

    error = Error.objects.create(user_id=user_id,
                                 location=location,
                                 message=message,
                                 exception=exception,
                                 context=kwargs.get('context'),
                                 agent=kwargs.get('agent'),
                                 agent_version=kwargs.get('version'),
                                 country=kwargs.get('country'),
                                 city=kwargs.get('city'),
                                 ip_address=kwargs.get('ip'))

    return { 'id': error.id }


@internal
def index(request):
    return render_to_response('analytics_index.html', context_instance=RequestContext(request))


def format_data(data_table, request):
    type = request.REQUEST.get('type')

    if type == 'csv':
        return HttpResponse(data_table.ToCsv(order_by='Date'), mimetype='text/csv')
    elif type == 'html':
        return HttpResponse(data_table.ToHtml(), mimetype='text/html')

    json = data_table.ToJSon(order_by='Date')

    jsonp, mimetype = to_jsonp(json, request)
    return HttpResponse(jsonp, mimetype=mimetype)


@internal
def userbase(request):
    description = [ ('RowType', 'number'),
                    ('Date', 'date'),
                    ('Campaign', 'string'),
                    ('New Users', 'number'),
                    ('Active Users', 'number'),
                    ('Cuml. Users', 'number'), ]

    try:
        start = datetime.strptime(request.REQUEST['start'], DATE_FORMAT).date()
    except KeyError:
        start = date.today() - timedelta(days=14)
    except (TypeError, ValueError):
        return HttpResponseBadRequest('Start date incorrectly formatted.')

    try:
        end = datetime.strptime(request.REQUEST['end'], DATE_FORMAT).date()
    except KeyError:
        end = date.today()
    except (TypeError, ValueError):
        return HttpResponseBadRequest('End date incorrectly formatted.')
    end += timedelta(days=1)

    result = User.objects.filter(is_registered=True)\
                         .exclude(date_joined__gte=start, date_joined__lt=end)\
                         .values('campaign')\
                         .annotate(Count('id', distinct=True))

    cumulative_counts = dict()
    campaigns = set()

    for row in result:
        campaign = row['campaign'] or 'null'
        cumulative_counts[campaign] = row['id__count']

        campaigns.add(campaign)

    data = dict()

    # New users.

    result = User.objects.filter(is_registered=True, date_joined__gte=start, date_joined__lt=end)\
                         .extra(select={ 'date': 'date(date_joined)' })\
                         .values('campaign', 'date')\
                         .annotate(Count('id', distinct=True))

    for row in result:
        key = row['date']
        campaign = row['campaign'] or 'null'

        # RowType = 1 indicates table data - counts grouped by campaign.
        data[(key, campaign)] = [1, key, campaign, row['id__count']]

        campaigns.add(campaign)

    # Active users.

    from django.db import connection
    cursor = connection.cursor()

    cursor.execute('SELECT date(timestamp) AS date, campaign, COUNT(DISTINCT(user_id)) AS count ' + \
                   'FROM analytics_activity a, api_user u WHERE a.user_id = u.user_ptr_id '
                   'AND timestamp >= %s AND timestamp < %s ' + \
                   'GROUP BY date, campaign', [str(start), str(end)])

    while True:
        row = cursor.fetchone()
        if not row:
            break

        key = row[0]
        campaign = row[1] or 'null'
        try:
            data[(key, campaign)].append(row[2])
        except KeyError:
            # No new users for current date and campaign.
            data[(key, campaign)] = [1, key, campaign, 0, row[2]]

        campaigns.add(campaign)

    # Cumulative users.

    current = start
    while current < end:
        new = active = cumulative = 0

        for campaign in campaigns:
            try:
                cumulative_counts[campaign] = cumulative_counts.get(campaign, 0) + data[(current, campaign)][3]

                # No active users for date, campaign - only new users!
                if len(data[(current, campaign)]) < 5:
                    data[(current, campaign)].append(0)

                data[(current, campaign)].append(cumulative_counts[campaign])

                new += data[(current, campaign)][3]
                active += data[(current, campaign)][4]
                
            except KeyError:
                # No new/active users for current date and campaign.
                data[(current, campaign)] = [1, current, campaign, 0, 0, cumulative_counts.setdefault(campaign, 0)]

            cumulative += cumulative_counts[campaign]

        # RowType = 0 indicates chart data - aggregate counts by date.
        data[(current, 'ALL')] = [0, current, 'ALL', new, active, cumulative]

        current += timedelta(days=1)

    data_table = DataTable(description)
    data_table.LoadData(data.values())

    return format_data(data_table, request)


@internal
def views(request):
    description = [ ('Date', 'date'),
                    ('Total Views', 'number'),
                    ('Watchlr', 'number'),
                    ('InSitu', 'number'),
                    ('Leanback', 'number'),
                    ('Facebook', 'number'), ]

    try:
        start = datetime.strptime(request.REQUEST['start'], DATE_FORMAT).date()
    except KeyError:
        start = date.today() - timedelta(days=14)
    except (TypeError, ValueError):
        return HttpResponseBadRequest('Start date incorrectly formatted.')

    try:
        end = datetime.strptime(request.REQUEST['end'], DATE_FORMAT).date()
    except KeyError:
        end = date.today()
    except (TypeError, ValueError):
        return HttpResponseBadRequest('End date incorrectly formatted.')
    end += timedelta(days=1)

    data = dict()

    current = start
    while current < end:
        data[current] = [current, 0, 0, 0, 0, 0]
        current += timedelta(days=1)

    result = Activity.objects.filter(action__endswith='view', timestamp__gte=start, timestamp__lt=end)\
                             .extra(select={ 'date': 'date(timestamp)' })\
                             .values('action', 'date')\
                             .annotate(Count('action'))

    for row in result:
        if row['action'] == 'view':
            data[row['date']][2] = row['action__count']
        elif row['action'] == 'insitu-view' or row['action'] == 'instu-view':
            data[row['date']][3] = row['action__count']
        elif row['action'] == 'leanback-view':
            data[row['date']][4] = row['action__count']
        elif row['action'] == 'facebook-view':
            data[row['date']][5] = row['action__count']
        else:
            continue
        data[row['date']][1] += row['action__count']
        
    data_table = DataTable(description)
    data_table.LoadData(data.values())

    return format_data(data_table, request)


@internal
def saves(request):
    description = [ ('Date', 'date'),
                    ('Total Saves', 'number'),
                    ('Plugin', 'number'),
                    ('Bookmarklet', 'number'),
                    ('Watchlr', 'number'), ]

    try:
        start = datetime.strptime(request.REQUEST['start'], DATE_FORMAT).date()
    except KeyError:
        start = date.today() - timedelta(days=14)
    except (TypeError, ValueError):
        return HttpResponseBadRequest('Start date incorrectly formatted.')

    try:
        end = datetime.strptime(request.REQUEST['end'], DATE_FORMAT).date()
    except KeyError:
        end = date.today()
    except (TypeError, ValueError):
        return HttpResponseBadRequest('End date incorrectly formatted.')
    end += timedelta(days=1)

    data = dict()

    current = start
    while current < end:
        data[current] = [current, 0, 0, 0, 0]
        current += timedelta(days=1)

    result = Activity.objects.filter(action='save', timestamp__gte=start, timestamp__lt=end)\
                             .exclude(user_id=UNAUTHORIZED_USER)\
                             .extra(select={ 'date': 'date(timestamp)' })\
                             .values('agent', 'date')\
                             .annotate(Count('agent'))

    for row in result:
        if row['agent'] == 'webapp':
            data[row['date']][4] = row['agent__count']
        elif row['agent'] == 'plugin':
            data[row['date']][2] = row['agent__count']
        elif row['agent'] == 'bookmarklet':
            data[row['date']][3] = row['agent__count']
        else:
            continue
        data[row['date']][1] += row['agent__count']

    data_table = DataTable(description)
    data_table.LoadData(data.values())

    return format_data(data_table, request)


@internal
def likes(request):
    description = [ ('Date', 'date'),
                    ('Total Likes', 'number'),
                    ('Plugin', 'number'),
                    ('Bookmarklet', 'number'),
                    ('Watchlr', 'number'), ]

    try:
        start = datetime.strptime(request.REQUEST['start'], DATE_FORMAT).date()
    except KeyError:
        start = date.today() - timedelta(days=14)
    except (TypeError, ValueError):
        return HttpResponseBadRequest('Start date incorrectly formatted.')

    try:
        end = datetime.strptime(request.REQUEST['end'], DATE_FORMAT).date()
    except KeyError:
        end = date.today()
    except (TypeError, ValueError):
        return HttpResponseBadRequest('End date incorrectly formatted.')
    end += timedelta(days=1)

    data = dict()

    current = start
    while current < end:
        data[current] = [current, 0, 0, 0, 0]
        current += timedelta(days=1)

    result = Activity.objects.filter(action='like', timestamp__gte=start, timestamp__lt=end)\
                             .exclude(user_id=UNAUTHORIZED_USER)\
                             .extra(select={ 'date': 'date(timestamp)' })\
                             .values('agent', 'date')\
                             .annotate(Count('agent'))

    for row in result:
        if row['agent'] == 'webapp':
            data[row['date']][4] = row['agent__count']
        elif row['agent'] == 'plugin':
            data[row['date']][2] = row['agent__count']
        elif row['agent'] == 'bookmarklet':
            data[row['date']][3] = row['agent__count']
        else:
            continue
        data[row['date']][1] += row['agent__count']

    data_table = DataTable(description)
    data_table.LoadData(data.values())

    return format_data(data_table, request)


@internal
def follows(request):
    description = [ ('Date', 'date'), ('Follows', 'number'), ]

    try:
        start = datetime.strptime(request.REQUEST['start'], DATE_FORMAT).date()
    except KeyError:
        start = date.today() - timedelta(days=14)
    except (TypeError, ValueError):
        return HttpResponseBadRequest('Start date incorrectly formatted.')

    try:
        end = datetime.strptime(request.REQUEST['end'], DATE_FORMAT).date()
    except KeyError:
        end = date.today()
    except (TypeError, ValueError):
        return HttpResponseBadRequest('End date incorrectly formatted.')
    end += timedelta(days=1)

    data = dict()

    current = start
    while current < end:
        data[current] = [current, 0]
        current += timedelta(days=1)

    result = Activity.objects.filter(action='follow', timestamp__gte=start, timestamp__lt=end)\
                             .exclude(user_id=UNAUTHORIZED_USER)\
                             .extra(select={ 'date': 'date(timestamp)' })\
                             .values('id', 'date')\
                             .annotate(Count('id'))

    for row in result:
        data[row['date']][1] += row['id__count']

    data_table = DataTable(description)
    data_table.LoadData(data.values())

    return format_data(data_table, request)


@internal
def memcache_status(request):

    # See http://effbot.org/zone/django-memcached-view.htm

    try:
        import memcache
    except ImportError:
        return HttpResponseNotFound()

    cache_config = settings.CACHES['default']
    
    if not cache_config['BACKEND'].endswith('MemcachedCache'):
        return HttpResponseNotFound()

    host = memcache._Host(cache_config['LOCATION'][0])
    host.connect()
    host.send_cmd('stats')

    class Stats:
        pass

    stats = Stats()

    while 1:
        line = host.readline().split(None, 2)
        if line[0] == 'END':
            break
        stat, key, value = line
        try:
            # convert to native type, if possible
            value = int(value)
            if key == 'uptime':
                value = timedelta(seconds=value)
            elif key == 'time':
                value = datetime.fromtimestamp(value)
        except ValueError:
            pass
        setattr(stats, key, value)

    host.close_socket()

    return render_to_response(
        'memcached_status.html', dict(
            stats=stats,
            hit_rate=100 * stats.get_hits / stats.cmd_get,
            time=datetime.now(), # server time
        ))

