from django.conf import settings
from django.http import HttpResponse, HttpResponseForbidden, HttpResponseBadRequest
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.db.models.aggregates import Count

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

        location = GEOIP.record_by_addr(request.META['REMOTE_ADDR']) if GEOIP else None
        country = location.get('country_code') if location else None
        city = location.get('city') if location else None

        context = request.META.get('HTTP_REFERER')

        kwargs.update({ 'agent': agent,
                        'version': version,
                        'context': context,
                        'country': country,
                        'city': city })

        return view(request, *args, **kwargs)

    return wrap


@jsonp_view
@geolocate
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
                                       city=kwargs.get('city'))
    return { 'id': activity.id }


@jsonp_view
@geolocate
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
                                 city=kwargs.get('city'))

    return { 'id': event.id }


@jsonp_view
@geolocate
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
                                 city=kwargs.get('city'))

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
    description = [ ('Date', 'date'),
                    ('Campaign', 'string'),
                    ('Cuml. Users', 'number'),
                    ('New Users', 'number'),
                    ('Active Users', 'number'), ]

    try:
        start = datetime.strptime(request.REQUEST['start'], DATE_FORMAT).date()
    except KeyError:
        start = date.today() - timedelta(days=14)
    except (TypeError, ValueError):
        return HttpResponseBadRequest('Start date incorrectly formatted.')

    try:
        end = datetime.strptime(request.REQUEST['end'], DATE_FORMAT).date()
    except KeyError:
        end = date.today() + timedelta(days=1)
    except (TypeError, ValueError):
        return HttpResponseBadRequest('End date incorrectly formatted.')

    data = dict()

    current = start
    while current <= end:
        data[current] = [current, 'null', 0, 0, 0]
        current += timedelta(days=1)

    cumulative_count = User.objects.filter(is_registered=True, date_joined__lt=start).count()

    result = User.objects.filter(is_registered=True, date_joined__gte=start, date_joined__lte=end)\
                         .extra(select={ 'date': 'date(date_joined)' })\
                         .values('id', 'campaign', 'date')\
                         .annotate(Count('id'))

    for row in result:
        key = data[row['date']]
        key[1] = row['campaign'] or 'null'
        key[3] = row['id__count']

    current = start
    while current <= end:
        cumulative_count += data[current][3]
        data[current][2] = cumulative_count
        current += timedelta(days=1)

    result = Activity.objects.exclude(user_id=UNAUTHORIZED_USER)\
                             .exclude(timestamp__lt=start)\
                             .exclude(timestamp__gt=end)\
                             .extra(select={ 'date': 'date(timestamp)' })\
                             .values('id', 'date')\
                             .annotate(Count('id'))

    for row in result:
        data[row['date']][4] = row['id__count']

    data_table = DataTable(description)
    data_table.LoadData(data.values())

    return format_data(data_table, request)


@internal
def views(request):
    description = [ ('Date', 'date'),
                    ('Total Views', 'number'),
                    ('Watchlr', 'number'),
                    ('InSitu', 'number'),
                    ('Leanback', 'number'), ]

    try:
        start = datetime.strptime(request.REQUEST['start'], DATE_FORMAT).date()
    except KeyError:
        start = date.today() - timedelta(days=14)
    except (TypeError, ValueError):
        return HttpResponseBadRequest('Start date incorrectly formatted.')

    try:
        end = datetime.strptime(request.REQUEST['end'], DATE_FORMAT).date()
    except KeyError:
        end = date.today() + timedelta(days=1)
    except (TypeError, ValueError):
        return HttpResponseBadRequest('End date incorrectly formatted.')

    data = dict()

    current = start
    while current <= end:
        data[current] = [current, 0, 0, 0, 0]
        current += timedelta(days=1)

    result = Activity.objects.filter(action__endswith='view', timestamp__gte=start, timestamp__lte=end)\
                             .extra(select={ 'date': 'date(timestamp)' })\
                             .values('action', 'date')\
                             .annotate(Count('action'))

    for row in result:
        if row['action'] == 'view':
            data[row['date']][2] = row['action__count']
        elif row['action'] == 'insitu-view':
            data[row['date']][3] = row['action__count']
        elif row['action'] == 'leanback-view':
            data[row['date']][4] = row['action__count']
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
        end = date.today() + timedelta(days=1)
    except (TypeError, ValueError):
        return HttpResponseBadRequest('End date incorrectly formatted.')

    data = dict()

    current = start
    while current <= end:
        data[current] = [current, 0, 0, 0, 0]
        current += timedelta(days=1)

    result = Activity.objects.filter(action='save', timestamp__gte=start, timestamp__lte=end)\
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
        end = date.today() + timedelta(days=1)
    except (TypeError, ValueError):
        return HttpResponseBadRequest('End date incorrectly formatted.')

    data = dict()

    current = start
    while current <= end:
        data[current] = [current, 0, 0, 0, 0]
        current += timedelta(days=1)

    result = Activity.objects.filter(action='like', timestamp__gte=start, timestamp__lte=end)\
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
        end = date.today() + timedelta(days=1)
    except (TypeError, ValueError):
        return HttpResponseBadRequest('End date incorrectly formatted.')

    data = dict()

    current = start
    while current <= end:
        data[current] = [current, 0]
        current += timedelta(days=1)

    result = Activity.objects.filter(action='follow', timestamp__gte=start, timestamp__lte=end)\
                             .extra(select={ 'date': 'date(timestamp)' })\
                             .values('id', 'date')\
                             .annotate(Count('id'))

    for row in result:
        data[row['date']][1] += row['id__count']

    data_table = DataTable(description)
    data_table.LoadData(data.values())

    return format_data(data_table, request)

