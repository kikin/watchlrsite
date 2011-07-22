from analytics.models import Activity, Event, UNAUTHORIZED_USER
from api.views import jsonp_view
from api.exception import BadRequest, Unauthorized

@jsonp_view
def action(request):
    if request.user.is_authenticated():
        try:
            action = request.REQUEST['action']
        except KeyError:
            raise BadRequest('Missing required parameter: action')

        secondary_id = request.REQUEST.get('id')
        agent = request.REQUEST.get('agent')
        version = request.REQUEST.get('version')

        activity = Activity.objects.create(user=request.user,
                                           action=action,
                                           secondary_id=secondary_id,
                                           agent=agent,
                                           agent_version=version)
        return { 'id': activity.id }
    else:
        raise Unauthorized()

@jsonp_view
def event(request):
    user_id = str(request.user.id) if request.user.is_authenticated() else UNAUTHORIZED_USER

    try:
        name = request.REQUEST['name']
    except KeyError:
        raise BadRequest('Missing required parameter: name')

    value = request.REQUEST.get('value')
    context = request.META.get('HTTP_REFERER')
    agent = request.REQUEST.get('agent')
    version = request.REQUEST.get('version')

    event = Event.objects.create(user_id=user_id,
                                 name=name,
                                 value=value,
                                 context=context,
                                 agent=agent,
                                 version=version)

    return { 'id': event.id }
