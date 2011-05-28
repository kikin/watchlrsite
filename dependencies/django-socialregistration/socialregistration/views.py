import uuid

from django.conf import settings
from django.template import RequestContext
from django.core.urlresolvers import reverse
from django.shortcuts import render_to_response
from django.utils.translation import gettext as _
from django.http import HttpResponseRedirect

try:
    from django.views.decorators.csrf import csrf_protect
    has_csrf = True
except ImportError:
    has_csrf = False

from django.contrib.auth.models import User
from django.contrib.auth import login, authenticate, logout as auth_logout
from django.contrib.sites.models import Site

from socialregistration.forms import UserForm
from socialregistration.utils import (OAuthClient, OAuthTwitter,
    OpenID, _https, DiscoveryFailure)
from socialregistration.models import FacebookProfile, TwitterProfile, OpenIDProfile
from socialregistration import signals 


FB_ERROR = _('We couldn\'t validate your Facebook credentials')

GENERATE_USERNAME = bool(getattr(settings, 'SOCIALREGISTRATION_GENERATE_USERNAME', False))

def _get_next(request):
    """
    Returns a url to redirect to after the login
    """
    if 'next' in request.session:
        next = request.session['next']
        del request.session['next']
        return next
    elif 'next' in request.GET:
        return request.GET.get('next')
    elif 'next' in request.POST:
        return request.POST.get('next')
    else:
        return getattr(settings, 'LOGIN_REDIRECT_URL', '/')

def _login(request, user, profile, client):
    login(request, user)
    signals.login.send(sender = profile.__class__, 
                                  user = user,
                                  profile = profile, 
                                  client = client)

def _connect(user, profile, client):
    signals.connect.send(sender = profile.__class__,
                                    user = user,
                                    profile = profile,
                                    client = client)

def setup(request, template='socialregistration/setup.html',
    form_class=UserForm, extra_context=dict(), initial=dict()):
    """
    Setup view to create a username & set email address after authentication
    """
    try:
        social_user = request.session['socialregistration_user']
        social_profile = request.session['socialregistration_profile']
        social_client = request.session['socialregistration_client']
    except KeyError:
        return render_to_response(
            template, dict(error=True), context_instance=RequestContext(request))

    if GENERATE_USERNAME:
        social_user.username = str(uuid.uuid4())[:30]
        social_user.save()

        social_profile.user = social_user
        social_profile.save()

        user = social_profile.authenticate()

    else:
        if not request.method == "POST":
            form = form_class(social_user, social_profile, initial=initial)
            extra_context.update({'form': form})
            return render_to_response(template, extra_context,
                                      context_instance = RequestContext(request))

        form = form_class(social_user, social_profile, request.POST, initial=initial)

        if form.is_valid():
            form.save(request = request)
            user = form.profile.authenticate()
            
        else:
            extra_context.update({'form': form})
            return render_to_response(template, extra_context,
                                      context_instance = RequestContext(request))
    
    social_client.request = request
     
    # Removing unused bits. It's important to remove the
    # client from the session because the session gets written
    # to the storage on login and the client holds the request,
    # which is going to fail. Might be worth to change the 
    # clients to not hold the whole request.
    if 'socialregistration_user' in request.session:
        del request.session['socialregistration_user']
    if 'socialregistration_profile' in request.session:
        del request.session['socialregistration_profile']
    if 'socialregistration_client' in request.session:
        del request.session['socialregistration_client']

    _connect(user, social_profile, social_client)
    _login(request, user, social_profile, social_client)

    return HttpResponseRedirect(_get_next(request))


if has_csrf:
    setup = csrf_protect(setup)

def facebook_login(request, template='socialregistration/facebook.html',
    extra_context=dict(), account_inactive_template='socialregistration/account_inactive.html'):
    """
    View to handle the Facebook login
    """

    if request.facebook.uid is None:
        extra_context.update(dict(error=FB_ERROR))
        return render_to_response(template, extra_context,
            context_instance=RequestContext(request))

    user = authenticate(uid=request.facebook.uid)

    if user is None:
        request.session['socialregistration_user'] = User()
        request.session['socialregistration_profile'] = FacebookProfile(uid=request.facebook.uid)
        request.session['socialregistration_client'] = request.facebook
        request.session['next'] = _get_next(request)
        return HttpResponseRedirect(reverse('socialregistration_setup'))

    if not user.is_active:
        return render_to_response(account_inactive_template, extra_context,
            context_instance=RequestContext(request))

    _login(request, user, FacebookProfile.objects.get(user = user), request.facebook)

    return HttpResponseRedirect(_get_next(request))

def facebook_connect(request, template='socialregistration/facebook.html',
    extra_context=dict()):
    """
    View to handle connecting existing django accounts with facebook
    """
    if request.facebook.uid is None or request.user.is_authenticated() is False:
        extra_context.update(dict(error=FB_ERROR))
        return render_to_response(template, extra_context,
            context_instance=RequestContext(request))

    try:
        profile = FacebookProfile.objects.get(uid=request.facebook.uid)
    except FacebookProfile.DoesNotExist:
        profile = FacebookProfile.objects.create(user=request.user,
            uid=request.facebook.uid)
        _connect(request.user, profile, request.facebook)

    return HttpResponseRedirect(_get_next(request))

def logout(request, redirect_url=None):
    """
    Logs the user out of django. This is only a wrapper around
    django.contrib.auth.logout. Logging users out of Facebook for instance
    should be done like described in the developer wiki on facebook.
    http://wiki.developers.facebook.com/index.php/Connect/Authorization_Websites#Logging_Out_Users
    """
    auth_logout(request)

    url = redirect_url or getattr(settings, 'LOGOUT_REDIRECT_URL', '/')

    return HttpResponseRedirect(url)

def twitter(request, account_inactive_template='socialregistration/account_inactive.html',
    extra_context=dict(), client_class=None):
    """
    Actually setup/login an account relating to a twitter user after the oauth
    process is finished successfully
    """
    client = client_class(
        request, settings.TWITTER_CONSUMER_KEY,
        settings.TWITTER_CONSUMER_SECRET_KEY,
        settings.TWITTER_REQUEST_TOKEN_URL,
    )

    user_info = client.get_user_info()

    if request.user.is_authenticated():
        # Handling already logged in users connecting their accounts
        try:
            profile = TwitterProfile.objects.get(twitter_id=user_info['id'])
        except TwitterProfile.DoesNotExist: # There can only be one profile!
            profile = TwitterProfile.objects.create(user=request.user, twitter_id=user_info['id'])
            _connect(user, profile, client)

        return HttpResponseRedirect(_get_next(request))

    user = authenticate(twitter_id=user_info['id'])

    if user is None:
        profile = TwitterProfile(twitter_id=user_info['id'])
        user = User()
        request.session['socialregistration_profile'] = profile
        request.session['socialregistration_user'] = user
        # Client is not pickleable with the request on it
        client.request = None
        request.session['socialregistration_client'] = client
        request.session['next'] = _get_next(request)
        return HttpResponseRedirect(reverse('socialregistration_setup'))

    if not user.is_active:
        return render_to_response(
            account_inactive_template,
            extra_context,
            context_instance=RequestContext(request)
        )

    _login(request, user, TwitterProfile.objects.get(user = user), client)

    return HttpResponseRedirect(_get_next(request))

def oauth_redirect(request, consumer_key=None, secret_key=None,
    request_token_url=None, access_token_url=None, authorization_url=None,
    callback_url=None, parameters=None, client_class = None):
    """
    View to handle the OAuth based authentication redirect to the service provider
    """
    request.session['next'] = _get_next(request)
    client = client_class(request, consumer_key, secret_key,
        request_token_url, access_token_url, authorization_url, callback_url, parameters)
    return client.get_redirect()

def oauth_callback(request, consumer_key=None, secret_key=None,
    request_token_url=None, access_token_url=None, authorization_url=None,
    callback_url=None, template='socialregistration/oauthcallback.html',
    extra_context=dict(), parameters=None, client_class = None):
    """
    View to handle final steps of OAuth based authentication where the user
    gets redirected back to from the service provider
    """
    client = client_class(request, consumer_key, secret_key, request_token_url,
        access_token_url, authorization_url, callback_url, parameters)

    extra_context.update(dict(oauth_client=client))
    if not client.is_valid():
        return render_to_response(
            template, extra_context, context_instance=RequestContext(request)
        )

    # We're redirecting to the setup view for this oauth service
    return HttpResponseRedirect(reverse(client.callback_url))

def openid_redirect(request, client_class = None):
    """
    Redirect the user to the openid provider
    """
    request.session['next'] = _get_next(request)
    request.session['openid_provider'] = request.GET.get('openid_provider')

    client = client_class(
        request,
        'http%s://%s%s' % (
            _https(),
            Site.objects.get_current().domain,
            reverse('openid_callback')
        ),
        request.GET.get('openid_provider')
    )
    try:
        return client.get_redirect()
    except DiscoveryFailure:
        request.session['openid_error'] = True
        return HttpResponseRedirect(settings.LOGIN_URL)

def openid_callback(request, template='socialregistration/openid.html',
    extra_context=dict(), account_inactive_template='socialregistration/account_inactive.html',
    client_class = None):
    """
    Catches the user when he's redirected back from the provider to our site
    """
    client = client_class(
        request,
        'http%s://%s%s' % (
            _https(),
            Site.objects.get_current().domain,
            reverse('openid_callback')
        ),
        request.session.get('openid_provider')
    )

    if client.is_valid():
        identity = client.result.identity_url
        if request.user.is_authenticated():
            # Handling already logged in users just connecting their accounts
            try:
                profile = OpenIDProfile.objects.get(identity=identity)
            except OpenIDProfile.DoesNotExist: # There can only be one profile with the same identity
                profile = OpenIDProfile.objects.create(user=request.user,
                    identity=identity)
                _connect(user, profile, client)

            return HttpResponseRedirect(_get_next(request))

        user = authenticate(identity=identity)
        if user is None:
            request.session['socialregistration_user'] = User()
            request.session['socialregistration_profile'] = OpenIDProfile(
                identity=identity
            )
            # Client is not pickleable with the request on it
            client.request = None
            request.session['socialregistration_client'] = client
            return HttpResponseRedirect(reverse('socialregistration_setup'))

        if not user.is_active:
            return render_to_response(
                account_inactive_template,
                extra_context,
                context_instance=RequestContext(request)
            )

        _login(request, user, OpenIDProfile.objects.get(user = user), client)
        return HttpResponseRedirect(_get_next(request))

    return render_to_response(
        template,
        dict(),
        context_instance=RequestContext(request)
    )
