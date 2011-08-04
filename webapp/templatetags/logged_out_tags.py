from django import template

register = template.Library()

@register.filter
def get_campaign(request, fallback):
    return request.REQUEST.get('campaign', fallback)