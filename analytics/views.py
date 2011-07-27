from django.conf import settings
from django.http import HttpResponseForbidden
from django.shortcuts import render_to_response
from django.template import RequestContext

from analytics.models import Activity, Event, Error, UNAUTHORIZED_USER
from api.views import jsonp_view
from api.exception import BadRequest

import logging
logger = logging.getLogger('kikinvideo')

import pygeoip
try:
    GEOIP = pygeoip.GeoIP(settings.GEOIP_DATABASE_PATH)
except IOError:
    GEOIP = None
    logger.warn('GeoIP database not found. Please check GEOIP_DATABASE_PATH environment variable.')


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
    import gviz_api
    from datetime import date

    description = { 'date': ('date', 'Date'),
                    'saves': ('number', 'Videos Saved'),
                    'likes': ('number', 'Videos Liked') }

    data = [{ 'date': date(2011, 7, 21), 'saves': 10, 'likes': 5 },
            { 'date': date(2011, 7, 22), 'saves': 5, 'likes': 2 },
            { 'date': date(2011, 7, 23), 'saves': 14, 'likes': 10 },]

    data_table = gviz_api.DataTable(description)
    data_table.LoadData(data)

    json = data_table.ToJSon()

    return render_to_response('analytics_index.html', { 'json': json }, context_instance=RequestContext(request))
