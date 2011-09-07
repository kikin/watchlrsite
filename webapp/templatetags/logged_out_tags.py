from django import template

register = template.Library()

@register.filter
def get_campaign(request, fallback):
    try:
        return request.REQUEST['campaign']
    except KeyError:
        return fallback