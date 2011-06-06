import lxml.html

from urlparse import urlparse, parse_qs, urlunparse
from urllib import quote, quote_plus
from urlnorm import norm_tuple
from re import match
from time import mktime

class MalformedURLException(Exception):
    def __init__(self, url):
        self.url = url

    def __str__(self):
        return str(self.url)


def url_fix(url, charset='utf-8'):
    if isinstance(url, unicode):
        url = url.encode(charset, 'ignore')

    scheme, netloc, path, params, query, fragment = urlparse(url)

    if not netloc:
        raise MalformedURLException(url)

    if netloc.endswith('youtube.com'):
        params = parse_qs(query + fragment)
        try:
            # Of the form http://www.youtube.com/v/<video_id>(?|&)foo=bar
            matched = match('^/(v|embed)/([^?&]+)', path)
            if matched:
                video_id = matched.group(2)
            else:
                video_id = params['v'][0]
            scheme = 'http'
            netloc = 'www.youtube.com'
            path = '/watch'
            query = 'v=%s' % video_id
            fragment = params = ''
        except KeyError:
            raise MalformedURLException(url)

    elif netloc.endswith('vimeo.com'):
        try:
            scheme = 'http'
            netloc = 'www.vimeo.com'
            path = path[path.rindex('/') + 1:]
            query = params = fragment = ''
        except ValueError:
            raise MalformedURLException(url)

    elif netloc in ['facebook.com', 'www.facebook.com']:
        params = parse_qs(query + fragment)
        try:
            video_id = params['video_id'][0]
            scheme = 'https'
            netloc = 'graph.facebook.com'
            path = '/%s' % video_id
            query = params = fragment = ''
        except KeyError:
            vid_match = match('/v/([0-9]+)$', path)
            if not vid_match:
                raise MalformedURLException(url)
            scheme = 'http'
            netloc = 'www.facebook.com'
            query = params = fragment = ''

    else:
        path = quote(path, '/%')
        query = quote_plus(query, ':&=')

    return urlunparse(norm_tuple(scheme, netloc, path, params, query, fragment))


def top_level_domain(url):
    scheme, netloc, path, params, query, fragment = urlparse(url)
    parts = netloc.split('.')
    return '.'.join(parts[-2:])


def latin1_to_ascii(unicrap):
    """This replaces UNICODE Latin-1 characters with
    something equivalent in 7-bit ASCII. All characters in the standard
    7-bit ASCII range are preserved. In the 8th bit range all the Latin-1
    accented letters are stripped of their accents. Anything not
    converted is deleted.
    """
    xlate = {0xc0: 'A', 0xc1: 'A', 0xc2: 'A', 0xc3: 'A', 0xc4: 'A', 0xc5: 'A',
             0xc6: 'Ae', 0xc7: 'C',
             0xc8: 'E', 0xc9: 'E', 0xca: 'E', 0xcb: 'E',
             0xcc: 'I', 0xcd: 'I', 0xce: 'I', 0xcf: 'I',
             0xd0: 'Th', 0xd1: 'N',
             0xd2: 'O', 0xd3: 'O', 0xd4: 'O', 0xd5: 'O', 0xd6: 'O', 0xd8: 'O',
             0xd9: 'U', 0xda: 'U', 0xdb: 'U', 0xdc: 'U',
             0xdd: 'Y', 0xde: 'th', 0xdf: 'ss',
             0xe0: 'a', 0xe1: 'a', 0xe2: 'a', 0xe3: 'a', 0xe4: 'a', 0xe5: 'a',
             0xe6: 'ae', 0xe7: 'c',
             0xe8: 'e', 0xe9: 'e', 0xea: 'e', 0xeb: 'e',
             0xec: 'i', 0xed: 'i', 0xee: 'i', 0xef: 'i',
             0xf0: 'th', 0xf1: 'n',
             0xf2: 'o', 0xf3: 'o', 0xf4: 'o', 0xf5: 'o', 0xf6: 'o', 0xf8: 'o',
             0xf9: 'u', 0xfa: 'u', 0xfb: 'u', 0xfc: 'u',
             0xfd: 'y', 0xfe: 'th', 0xff: 'y'}

    r = ''
    for i in unicrap:
        if xlate.has_key(ord(i)):
            r += xlate[ord(i)]
        elif ord(i) >= 0x80:
            pass
        else:
            r += i
    return r


def remove_html(html):
    """Removes ALL html tags from `html`"""
    if isinstance(html, basestring):
        if len(html):
            try:
                return lxml.html.fromstring(html).text_content()
            except Exception, e:
                raise ValueError(str(e))
    raise TypeError('Input parameter should be string or unicode object')


def epoch(dt):
    return mktime(dt.timetuple())