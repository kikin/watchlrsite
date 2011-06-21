import re
import urllib
import urllib2
import json

from re import sub
from unicodedata import normalize
from time import time
from datetime import datetime, timedelta
from traceback import format_exc
from lxml import etree
from urllib import urlencode

import gdata.youtube
import gdata.youtube.service
from gdata.service import RequestError

from celery.task import task
from celery.task.sets import subtask
from django.utils.html import strip_tags
from django.contrib.sites.models import Site
from django.template.defaultfilters import stringfilter

from api.models import Video, User, Source as VideoSource, Thumbnail, FacebookFriend

import logging
logger = logging.getLogger('kikinvideo')

IPAD_USER_AGENT = 'Mozilla/5.0 (iPad; U; CPU OS 3_2 like Mac OS X; en-us) AppleWebKit/531.21.10 (KHTML, like Gecko) Version/4.0.4 Mobile/7B334b Safari/531.21.10'

class Source(dict):
    FAVICON_FETCHER = 'http://fav.us.kikin.com/favicon/s?%s'

    def __init__(self, name, url, favicon=None):
        self['name'] = name
        self['url'] = url
        if favicon is None:
            self['favicon'] = self.FAVICON_FETCHER % urlencode({'url': url})
        else:
            self['favicon'] = favicon

    def __getattr__(self, name):
        return self[name]


class UrlNotSupported(Exception):
    def __init__(self, url):
        self.url = url

    def __str__(self):
        return str(self.url)


class OEmbed(object):
    def __init__(self, fetchers):
        self.fetchers = fetchers

    def update(self, url, meta, logger):
        video = Video.objects.get(url__exact=url)

        video.title = meta.get('title')

        try:
            video.description = strip_tags(meta['description'])
        except KeyError:
            pass
        except:
            logger.warning('Error cleaning HTML markup from description:%s\n%s' %\
                        (meta['description'], format_exc()))

        video.html_embed_code = meta.get('html')
        video.html5_embed_code = meta.get('html5')

        video.fetched = datetime.utcnow()

        if meta.get('thumbnail_url'):
            video.set_thumbnail(meta['thumbnail_url'],
                                meta['thumbnail_width'],
                                meta['thumbnail_height'],
                                type='web')

        if meta.get('mobile_thumbnail_url'):
            video.set_thumbnail(meta['mobile_thumbnail_url'],
                                meta['mobile_thumbnail_width'],
                                meta['mobile_thumbnail_height'],
                                type='mobile')

        try:
            source = VideoSource.objects.get(name=meta['source'].name)
        except VideoSource.DoesNotExist:
            source = VideoSource.objects.create(name=meta['source'].name,
                                                url=meta['source'].url,
                                                favicon=meta['source'].favicon)

        video.source = source
        video.state = 'fetched'

        video.save()
        return video

    def fetch(self, user_id, url, host, logger):
        logger.info('Fetching metadata for url:%s' % url)

        try:
            meta = Video.objects.get(url__exact=url)
            fetched = meta.fetched

            # Refresh metadata if cache older than a day
            if fetched and (datetime.utcnow() - fetched).days < 1:
                logger.debug('Url cache hit:%s, fetched:%s' % (url, fetched))
                return

        except Video.DoesNotExist:
            pass

        for fetcher in self.fetchers:
            try:
                meta = fetcher.fetch(url, logger, user_id=user_id, host=host)

                logger.debug('Fetched metadata for url:%s through fetcher:%s\n%s' %\
                             (url, str(fetcher), str(meta)))

                # First matched fetcher wins!
                break

            except UrlNotSupported:
                logger.debug('Url:%s not supported by fetcher:%s' % (url, str(fetcher)))
                continue

            except:
                logger.error('Error fetching metadata for url:%s through %s\n%s' %\
                             (url, str(fetcher), format_exc()))

                # Re-raise exception
                raise

        else:
            raise UrlNotSupported(url)

        return self.update(url, meta, logger)


class EmbedlyFetcher(object):
    # Embed.ly Multi Provider API Endpoint
    OEMBED_API_ENDPOINT = 'http://api.embed.ly/1/oembed'

    OEMBED_SERVICE_ENDPOINT = 'http://api.embed.ly/1/services'

    # URL Schemes Supported
    VIDEO_URL_SCHEMES = [
            re.compile(r'http://.*youtube\.com/watch.*'),
            re.compile(r'http://.*\.youtube\.com/v/.*'),
            re.compile(r'http://youtu\.be/.*'),
            re.compile(r'http://.*\.youtube\.com/user/.*'),
            re.compile(r'http://.*\.youtube\.com/.*#.*/.*'),
            re.compile(r'http://m\.youtube\.com/watch.*'),
            re.compile(r'http://m\.youtube\.com/index.*'),
            re.compile(r'http://.*\.youtube\.com/profile.*'),
            re.compile(r'http://.*justin\.tv/.*'),
            re.compile(r'http://.*justin\.tv/.*/b/.*'),
            re.compile(r'http://.*justin\.tv/.*/w/.*'),
            re.compile(r'http://www\.ustream\.tv/recorded/.*'),
            re.compile(r'http://www\.ustream\.tv/channel/.*'),
            re.compile(r'http://www\.ustream\.tv/.*'),
            re.compile(r'http://qik\.com/video/.*'),
            re.compile(r'http://qik\.com/.*'),
            re.compile(r'http://qik\.ly/.*'),
            re.compile(r'http://.*revision3\.com/.*'),
            re.compile(r'http://.*\.dailymotion\.com/video/.*'),
            re.compile(r'http://.*\.dailymotion\.com/.*/video/.*'),
            re.compile(r'http://(www\.)?collegehumor\.com/video/(?P<id>\d+)'),
            re.compile(r'http://.*twitvid\.com/.*'),
            re.compile(r'http://www\.break\.com/.*/.*'),
            re.compile(r'http://vids\.myspace\.com/index\.cfm\?fuseaction=vids\.individual&videoid.*'),
            re.compile(r'http://www\.myspace\.com/index\.cfm\?fuseaction=.*&videoid.*'),
            re.compile(r'http://www\.metacafe\.com/watch/.*'),
            re.compile(r'http://www\.metacafe\.com/w/.*'),
            re.compile(r'http://blip\.tv/.*'),
            re.compile(r'http://.*\.blip\.tv/.*'),
            re.compile(r'http://video\.google\.com/videoplay\?.*'),
            re.compile(r'http://.*revver\.com/video/.*'),
            re.compile(r'http://video\.yahoo\.com/watch/.*/.*'),
            re.compile(r'http://video\.yahoo\.com/network/.*'),
            re.compile(r'http://.*viddler\.com/explore/.*/videos/.*'),
            re.compile(r'http://liveleak\.com/view\?.*'),
            re.compile(r'http://www\.liveleak\.com/view\?.*'),
            re.compile(r'http://animoto\.com/play/.*'),
            re.compile(r'http://dotsub\.com/view/.*'),
            re.compile(r'http://www\.overstream\.net/view\.php\?oid=.*'),
            re.compile(r'http://www\.livestream\.com/.*'),
            re.compile(r'http://www\.worldstarhiphop\.com/videos/video.*\.php\?v=.*'),
            re.compile(r'http://worldstarhiphop\.com/videos/video.*\.php\?v=.*'),
            re.compile(r'http://teachertube\.com/viewVideo\.php.*'),
            re.compile(r'http://www\.teachertube\.com/viewVideo\.php.*'),
            re.compile(r'http://www1\.teachertube\.com/viewVideo\.php.*'),
            re.compile(r'http://www2\.teachertube\.com/viewVideo\.php.*'),
            re.compile(r'http://bambuser\.com/v/.*'),
            re.compile(r'http://www\.bambuser\.com/v/.*'),
            re.compile(r'http://bambuser\.com/channel/.*'),
            re.compile(r'http://bambuser\.com/channel/.*/broadcast/.*'),
            re.compile(r'http://www\.schooltube\.com/video/.*/.*'),
            re.compile(r'http://bigthink\.com/ideas/.*'),
            re.compile(r'http://bigthink\.com/series/.*'),
            re.compile(r'http://www\.bigthink\.com/ideas/.*'),
            re.compile(r'http://www\.bigthink\.com/series/.*'),
            re.compile(r'http://sendables\.jibjab\.com/view/.*'),
            re.compile(r'http://sendables\.jibjab\.com/originals/.*'),
            re.compile(r'http://www\.xtranormal\.com/watch/.*'),
            re.compile(r'http://socialcam\.com/v/.*'),
            re.compile(r'http://www\.socialcam\.com/v/.*'),
            re.compile(r'http://dipdive\.com/media/.*'),
            re.compile(r'http://dipdive\.com/member/.*/media/.*'),
            re.compile(r'http://dipdive\.com/v/.*'),
            re.compile(r'http://.*\.dipdive\.com/media/.*'),
            re.compile(r'http://.*\.dipdive\.com/v/.*'),
            re.compile(r'http://v\.youku\.com/v_show/.*\.html'),
            re.compile(r'http://v\.youku\.com/v_playlist/.*\.html'),
            re.compile(r'http://www\.snotr\.com/video/.*'),
            re.compile(r'http://snotr\.com/video/.*'),
            re.compile(r'http://video\.jardenberg\.se/.*'),
            re.compile(r'http://www\.whitehouse\.gov/photos-and-video/video/.*'),
            re.compile(r'http://www\.whitehouse\.gov/video/.*'),
            re.compile(r'http://wh\.gov/photos-and-video/video/.*'),
            re.compile(r'http://wh\.gov/video/.*'),
            re.compile(r'http://www\.hulu\.com/watch.*'),
            re.compile(r'http://www\.hulu\.com/w/.*'),
            re.compile(r'http://hulu\.com/watch.*'),
            re.compile(r'http://hulu\.com/w/.*'),
            re.compile(r'http://.*crackle\.com/c/.*'),
            re.compile(r'http://fancast\.com(?P<id>/.+?/videos)'),
            re.compile(r'http://www\.funnyordie\.com/videos/.*'),
            re.compile(r'http://www\.funnyordie\.com/m/.*'),
            re.compile(r'http://funnyordie\.com/videos/.*'),
            re.compile(r'http://funnyordie\.com/m/.*'),
            re.compile(r'http://www\.vimeo\.com/groups/.*/videos/.*'),
            re.compile(r'http://www\.vimeo\.com/.*'),
            re.compile(r'http://vimeo\.com/groups/.*/videos/.*'),
            re.compile(r'http://vimeo\.com/.*'),
            re.compile(r'http://vimeo\.com/m/#/.*'),
            re.compile(r'http://www\.ted\.com/talks/.*\.html.*'),
            re.compile(r'http://www\.ted\.com/talks/lang/.*/.*\.html.*'),
            re.compile(r'http://www\.ted\.com/index\.php/talks/.*\.html.*'),
            re.compile(r'http://www\.ted\.com/index\.php/talks/lang/.*/.*\.html.*'),
            re.compile(r'http://.*nfb\.ca/film/.*'),
            re.compile(r'http://www\.thedailyshow\.com/watch/.*'),
            re.compile(r'http://www\.thedailyshow\.com/full-episodes/.*'),
            re.compile(r'http://www\.thedailyshow\.com/collection/.*/.*/.*'),
            re.compile(r'http://movies\.yahoo\.com/movie/.*/video/.*'),
            re.compile(r'http://movies\.yahoo\.com/movie/.*/trailer'),
            re.compile(r'http://movies\.yahoo\.com/movie/.*/video'),
            re.compile(r'http://www\.colbertnation\.com/the-colbert-report-collections/.*'),
            re.compile(r'http://www\.colbertnation\.com/full-episodes/.*'),
            re.compile(r'http://www\.colbertnation\.com/the-colbert-report-videos/.*'),
            re.compile(r'http://www\.comedycentral\.com/videos/index\.jhtml\?.*'),
            re.compile(r'http://(www\.)?theonion\.com/video\?id=(?P<id>\d+)'),
            re.compile(r'http://(www\.)?theonion\.com/video/.+?,(?P<id>\d+)'),
            re.compile(r'http://www\.theonion\.com/video\?id=.*'),
            re.compile(r'http://theonion\.com/video\?id=.*'),
            re.compile(r'http://wordpress\.tv/.*/.*/.*/.*/'),
            re.compile(r'http://www\.traileraddict\.com/trailer/.*'),
            re.compile(r'http://www\.traileraddict\.com/clip/.*'),
            re.compile(r'http://www\.traileraddict\.com/poster/.*'),
            re.compile(r'http://www\.escapistmagazine\.com/videos/.*'),
            re.compile(r'http://www\.trailerspy\.com/trailer/.*/.*'),
            re.compile(r'http://www\.trailerspy\.com/trailer/.*'),
            re.compile(r'http://www\.trailerspy\.com/view_video\.php.*'),
            re.compile(r'http://www\.atom\.com/.*/.*/'),
            re.compile(r'http://fora\.tv/.*/.*/.*/.*'),
            re.compile(r'http://www\.spike\.com/video/.*'),
            re.compile(r'http://www\.gametrailers\.com/video/.*'),
            re.compile(r'http://gametrailers\.com/video/.*'),
            re.compile(r'http://www\.koldcast\.tv/video/.*'),
            re.compile(r'http://www\.koldcast\.tv/#video:.*'),
            re.compile(r'http://techcrunch\.tv/watch.*'),
            re.compile(r'http://techcrunch\.tv/.*/watch.*'),
            re.compile(r'http://mixergy\.com/.*'),
            re.compile(r'http://video\.pbs\.org/video/.*'),
            re.compile(r'http://www\.zapiks\.com/.*'),
            re.compile(r'http://tv\.digg\.com/diggnation/.*'),
            re.compile(r'http://tv\.digg\.com/diggreel/.*'),
            re.compile(r'http://tv\.digg\.com/diggdialogg/.*'),
            re.compile(r'http://www\.trutv\.com/video/.*'),
            re.compile(r'http://www\.nzonscreen\.com/title/.*'),
            re.compile(r'http://nzonscreen\.com/title/.*'),
            re.compile(r'http://app\.wistia\.com/embed/medias/.*'),
            re.compile(r'http://https://app\.wistia\.com/embed/medias/.*'),
            re.compile(r'http://hungrynation\.tv/.*/episode/.*'),
            re.compile(r'http://www\.hungrynation\.tv/.*/episode/.*'),
            re.compile(r'http://hungrynation\.tv/episode/.*'),
            re.compile(r'http://www\.hungrynation\.tv/episode/.*'),
            re.compile(r'http://indymogul\.com/.*/episode/.*'),
            re.compile(r'http://www\.indymogul\.com/.*/episode/.*'),
            re.compile(r'http://indymogul\.com/episode/.*'),
            re.compile(r'http://www\.indymogul\.com/episode/.*'),
            re.compile(r'http://channelfrederator\.com/.*/episode/.*'),
            re.compile(r'http://www\.channelfrederator\.com/.*/episode/.*'),
            re.compile(r'http://channelfrederator\.com/episode/.*'),
            re.compile(r'http://www\.channelfrederator\.com/episode/.*'),
            re.compile(r'http://tmiweekly\.com/.*/episode/.*'),
            re.compile(r'http://www\.tmiweekly\.com/.*/episode/.*'),
            re.compile(r'http://tmiweekly\.com/episode/.*'),
            re.compile(r'http://www\.tmiweekly\.com/episode/.*'),
            re.compile(r'http://99dollarmusicvideos\.com/.*/episode/.*'),
            re.compile(r'http://www\.99dollarmusicvideos\.com/.*/episode/.*'),
            re.compile(r'http://99dollarmusicvideos\.com/episode/.*'),
            re.compile(r'http://www\.99dollarmusicvideos\.com/episode/.*'),
            re.compile(r'http://ultrakawaii\.com/.*/episode/.*'),
            re.compile(r'http://www\.ultrakawaii\.com/.*/episode/.*'),
            re.compile(r'http://ultrakawaii\.com/episode/.*'),
            re.compile(r'http://www\.ultrakawaii\.com/episode/.*'),
            re.compile(r'http://barelypolitical\.com/.*/episode/.*'),
            re.compile(r'http://www\.barelypolitical\.com/.*/episode/.*'),
            re.compile(r'http://barelypolitical\.com/episode/.*'),
            re.compile(r'http://www\.barelypolitical\.com/episode/.*'),
            re.compile(r'http://barelydigital\.com/.*/episode/.*'),
            re.compile(r'http://www\.barelydigital\.com/.*/episode/.*'),
            re.compile(r'http://barelydigital\.com/episode/.*'),
            re.compile(r'http://www\.barelydigital\.com/episode/.*'),
            re.compile(r'http://threadbanger\.com/.*/episode/.*'),
            re.compile(r'http://www\.threadbanger\.com/.*/episode/.*'),
            re.compile(r'http://threadbanger\.com/episode/.*'),
            re.compile(r'http://www\.threadbanger\.com/episode/.*'),
            re.compile(r'http://vodcars\.com/.*/episode/.*'),
            re.compile(r'http://www\.vodcars\.com/.*/episode/.*'),
            re.compile(r'http://vodcars\.com/episode/.*'),
            re.compile(r'http://www\.vodcars\.com/episode/.*'),
            re.compile(r'http://confreaks\.net/videos/.*'),
            re.compile(r'http://www\.confreaks\.net/videos/.*'),
            re.compile(r'http://video\.allthingsd\.com/video/.*'),
            re.compile(r'http://videos\.nymag\.com/.*'),
            re.compile(r'http://aniboom\.com/animation-video/.*'),
            re.compile(r'http://www\.aniboom\.com/animation-video/.*'),
            re.compile(r'http://clipshack\.com/Clip\.aspx\?.*'),
            re.compile(r'http://www\.clipshack\.com/Clip\.aspx\?.*'),
            re.compile(r'http://grindtv\.com/.*/video/.*'),
            re.compile(r'http://www\.grindtv\.com/.*/video/.*'),
            re.compile(r'http://ifood\.tv/recipe/.*'),
            re.compile(r'http://ifood\.tv/video/.*'),
            re.compile(r'http://ifood\.tv/channel/user/.*'),
            re.compile(r'http://www\.ifood\.tv/recipe/.*'),
            re.compile(r'http://www\.ifood\.tv/video/.*'),
            re.compile(r'http://www\.ifood\.tv/channel/user/.*'),
            re.compile(r'http://logotv\.com/video/.*'),
            re.compile(r'http://www\.logotv\.com/video/.*'),
            re.compile(r'http://lonelyplanet\.com/Clip\.aspx\?.*'),
            re.compile(r'http://www\.lonelyplanet\.com/Clip\.aspx\?.*'),
            re.compile(r'http://streetfire\.net/video/.*\.htm.*'),
            re.compile(r'http://www\.streetfire\.net/video/.*\.htm.*'),
            re.compile(r'http://trooptube\.tv/videos/.*'),
            re.compile(r'http://www\.trooptube\.tv/videos/.*'),
            re.compile(r'http://sciencestage\.com/v/.*\.html'),
            re.compile(r'http://sciencestage\.com/a/.*\.html'),
            re.compile(r'http://www\.sciencestage\.com/v/.*\.html'),
            re.compile(r'http://www\.sciencestage\.com/a/.*\.html'),
            re.compile(r'http://www\.godtube\.com/featured/video/.*'),
            re.compile(r'http://godtube\.com/featured/video/.*'),
            re.compile(r'http://www\.godtube\.com/watch/.*'),
            re.compile(r'http://godtube\.com/watch/.*'),
            re.compile(r'http://www\.tangle\.com/view_video.*'),
            re.compile(r'http://mediamatters\.org/mmtv/.*'),
            re.compile(r'http://www\.clikthrough\.com/theater/video/.*'),
            re.compile(r'http://espn\.go\.com/video/clip.*'),
            re.compile(r'http://espn\.go\.com/.*/story.*'),
            re.compile(r'http://abcnews\.com/.*/video/.*'),
            re.compile(r'http://abcnews\.com/video/playerIndex.*'),
            re.compile(r'http://washingtonpost\.com/wp-dyn/.*/video/.*/.*/.*/.*'),
            re.compile(r'http://www\.washingtonpost\.com/wp-dyn/.*/video/.*/.*/.*/.*'),
            re.compile(r'http://www\.boston\.com/video.*'),
            re.compile(r'http://boston\.com/video.*'),
            re.compile(r'http://www\.facebook\.com/photo\.php.*'),
            re.compile(r'http://www\.facebook\.com/video/video\.php.*'),
            re.compile(r'http://www\.facebook\.com/v/.*'),
            re.compile(r'http://cnbc\.com/id/.*\?.*video.*'),
            re.compile(r'http://www\.cnbc\.com/id/.*\?.*video.*'),
            re.compile(r'http://cnbc\.com/id/.*/play/1/video/.*'),
            re.compile(r'http://www\.cnbc\.com/id/.*/play/1/video/.*'),
            re.compile(r'http://(www\.)cbsnews\.com/video/watch/.*'),
            re.compile(r'http://www\.google\.com/buzz/.*/.*/.*'),
            re.compile(r'http://www\.google\.com/buzz/.*'),
            re.compile(r'http://www\.google\.com/profiles/.*'),
            re.compile(r'http://google\.com/buzz/.*/.*/.*'),
            re.compile(r'http://google\.com/buzz/.*'),
            re.compile(r'http://google\.com/profiles/.*'),
            re.compile(r'http://www\.cnn\.com/video/.*'),
            re.compile(r'http://edition\.cnn\.com/video/.*'),
            re.compile(r'http://money\.cnn\.com/video/.*'),
            re.compile(r'http://today\.msnbc\.msn\.com/id/.*/vp/.*'),
            re.compile(r'http://www\.msnbc\.msn\.com/id/.*/vp/.*'),
            re.compile(r'http://www\.msnbc\.msn\.com/id/.*/ns/.*'),
            re.compile(r'http://today\.msnbc\.msn\.com/id/.*/ns/.*'),
            re.compile(r'http://msn\.foxsports\.com/video/\?vid=(?P<id>[\-a-zA-Z0-9]+)'),
            re.compile(r'http://www\.globalpost\.com/video/.*'),
            re.compile(r'http://www\.globalpost\.com/dispatch/.*'),
            re.compile(r'http://guardian\.co\.uk/.*/video/.*/.*/.*/.*'),
            re.compile(r'http://www\.guardian\.co\.uk/.*/video/.*/.*/.*/.*'),
            re.compile(r'http://bravotv\.com/.*/.*/videos/.*'),
            re.compile(r'http://www\.bravotv\.com/.*/.*/videos/.*'),
            re.compile(r'http://video\.nationalgeographic\.com/.*/.*/.*\.html'),
            re.compile(r'http://dsc\.discovery\.com/videos/.*'),
            re.compile(r'http://animal\.discovery\.com/videos/.*'),
            re.compile(r'http://health\.discovery\.com/videos/.*'),
            re.compile(r'http://investigation\.discovery\.com/videos/.*'),
            re.compile(r'http://military\.discovery\.com/videos/.*'),
            re.compile(r'http://planetgreen\.discovery\.com/videos/.*'),
            re.compile(r'http://science\.discovery\.com/videos/.*'),
            re.compile(r'http://tlc\.discovery\.com/videos/.*'),
            re.compile(r'http://video\.forbes\.com/fvn/.*'),
            ]

    MAX_WIDTH, MAX_HEIGHT = 640, 360

    SITE_EMBED_FIXES = {
        'collegehumor':
            '''<object type="application/x-shockwave-flash"
              data="http://www.collegehumor.com/moogaloop/moogaloop.swf?clip_id=%(id)s&use_node_id=true&fullscreen=1"
              width="600" height="338">
              <param name="allowfullscreen" value="true"/>
              <param name="wmode" value="transparent"/>
              <param name="allowScriptAccess" value="always"/>
              <param name="movie" quality="best"
              value="http://www.collegehumor.com/moogaloop/moogaloop.swf?clip_id=%(id)s&use_node_id=true&fullscreen=1"/>
              <embed src="http://www.collegehumor.com/moogaloop/moogaloop.swf?clip_id=%(id)s&use_node_id=true&fullscreen=1"
              type="application/x-shockwave-flash" wmode="transparent" width="600" height="338"
              allowScriptAccess="always">
              </embed>
            </object>''',
        'theonion':
            '''<object width="480" height="430">
              <param name="allowfullscreen" value="true"/>
              <param name="allowscriptaccess" value="always"/>
              <param name="movie"
              value="http://media.theonion.com/flash/video/embedded_player.swf?&videoid=%(id)s"/>
              <param name="wmode" value="transparent"/>
              <embed src="http://media.theonion.com/flash/video/embedded_player.swf"
              type="application/x-shockwave-flash" allowScriptAccess="always"
              allowFullScreen="true" wmode="transparent" width="480" height="430"
              flashvars="videoid=%(id)s"></embed>
            </object>''',
        'fancast':
            '''<iframe src='http://xfinitytv.comcast.net%(id)s?skipTo=0'
         width='420' height='382' scrolling='no' frameborder='0'></iframe>''',
        'foxsports':
            '''<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="600" height="438">
              <param name="movie" value="http://img.widgets.video.s-msn.com/flash/customplayer/1_0/customplayer.swf" />
              <param name="bgcolor" value="#ffffff" />
              <param name="base" value="." />
              <param name="allowFullScreen" value="true" />
              <param name="allowScriptAccess" value="always" />
              <param name="wmode" value="transparent" />
              <param name="flashvars" value="player.c=v&player.v=%(id)s&mkt=en-us&configCsid=msnvideo&configName=syndicationplayer&from=foxsports_en-us_videocentral&brand=foxsports&fg=" />
              <embed src="http://img.widgets.video.s-msn.com/flash/customplayer/1_0/customplayer.swf" width="600" height="438"
                     type="application/x-shockwave-flash" allowFullScreen="true" allowScriptAccess="always"
                     pluginspage="http://macromedia.com/go/getflashplayer" base="." wmode="transparent"
                     flashvars="player.c=v&player.v=%(id)s&mkt=en-us&configCsid=msnvideo&configName=syndicationplayer&from=foxsports_en-us_videocentral&brand=foxsports&fg=">
              </embed>
            </object>''',
        }

    PRO_OEMBED_API_ENDPOINT = 'http://pro.embed.ly/1/oembed'

    KEY = '59772722865011e088ae4040f9f86dcd'

    def __init__(self):
        self.providers = dict()
        sources = urllib2.urlopen(self.OEMBED_SERVICE_ENDPOINT).read()
        for source in json.loads(sources):
            domain = source['domain']
            if not domain.startswith('http://'):
                domain = 'http://%s' % domain
            self.providers[source['displayname']] = Source(source['displayname'],
                                                           domain,
                                                           source['favicon'])

    def sources(self):
        return self.providers.values()

    def fetch(self, url, logger, **kwargs):
        for regex in self.VIDEO_URL_SCHEMES:
            match = regex.match(url)
            if match:
                break
        else:
            raise UrlNotSupported(url)

        # Embed.ly does not like LiveLeak urls with www prefix
        try:
            index = url.index('www.liveleak.com')
            url = ''.join([url[0:index], 'liveleak.com', url[index + 16:]])
        except ValueError:
            pass

        # Gather options
        params = {'url': url,
                  'maxwidth': self.MAX_WIDTH,
                  'maxheight': self.MAX_HEIGHT,
                  'autoplay': True}

        logger.debug('Fetching Embed.ly metadata for url:%s params:%s' % (url, str(params)))

        # Generate query string
        query = urllib.urlencode(params)

        # API endpoint url
        fetch_url = "%s?%s" % (self.OEMBED_API_ENDPOINT, query)

        r = urllib2.urlopen(fetch_url).read()
        meta = json.loads(r)

        provider = meta['provider_name']

        # Site-specific embed fixes
        try:
            meta['html'] = self.SITE_EMBED_FIXES[provider] % match.groupdict()
        except KeyError:
            pass

        try:
            meta['source'] = self.providers[provider]
        except KeyError:
            meta['source'] = Source(provider, meta['provider_url'])

        try:
            meta['html5'] = self.fetch_html5(url)
        except:
            logger.error('Error fetching HTML5 embed code for: %s' % url)

        # See issue #45
        if meta['provider_name'] and meta['provider_name'].lower().startswith('cnn'):
            try:
                meta['title'] = meta['title'][0:meta['title'].index('cnn')]
            except ValueError:
                pass
            meta['title'] = meta['title'].title()

            # Issue #63
            if meta['html5']:
                try:
                    video_tag = etree.fromstring(meta['html5'])
                    poster = video_tag['poster']

                    poster_match = re.match(r'(.+?\.cnn.)(\d{2,4})x(\d{2,4})\.jpg', poster)
                    if poster_match:
                        meta['thumbnail'] = '%s%dx%d.jpg' % (poster_match.group(1), 320, 240)
                        meta['thumbnail_height'] = meta['thumbnail_width'] = 320, 240

                        meta['mobile_thumbnail_url'] = '%s%dx%d.jpg' % (poster_match.group(1), 120, 90)
                        meta['mobile_thumbnail_height'] = meta['mobile_thumbnail_width'] = 120, 90

                    else:
                        logger.warning('CNN poster url not of expected format:%s' % poster)

                except etree.XMLSyntaxError:
                    logger.warning('Error parsing HTML5 video tag', exc_info=True)

                except KeyError:
                    logger.debug('No poster found for CNN HTML5 video:%s' % url)

        return meta

    def fetch_html5(self, url):
        params = {'url': url, 'autoplay': True, 'key': self.KEY}

        logger.debug('Fetching HTML5 video metadata for URL:%s' % url)

        query = urllib.urlencode(params)

        opener = urllib2.build_opener()
        opener.addheaders = [('User-agent', IPAD_USER_AGENT)]

        fetch_url = '%s?%s' % (self.PRO_OEMBED_API_ENDPOINT, query)

        response = opener.open(fetch_url)

        if not response.getcode() == 200:
            logger.warning('Non-success response code fetching metadata: %s' % fetch_url)
            return None

        content = response.read()
        logger.debug('Embed.ly response for url:%s\n%s' % (url, content))

        meta = json.loads(content)
        return meta.get('html')


class YoutubeFetcher(object):
    SOURCE = Source('YouTube',
                    'http://www.youtube.com/',
                    'http://c2548752.cdn.cloudfiles.rackspacecloud.com/youtube.ico')

    YOUTUBE_URL_PATTERNS = [
            re.compile(r'http://.*youtube\.com/watch.*(\?|&)v=(?P<id>[_\-a-zA-Z0-9]+)'),
            re.compile(r'http://.*youtube\.com/v/(?P<id>[_\-a-zA-Z0-9]+)'),
            ]

    YOUTUBE_EMBED_TAG = '''<object width="640" height="360">
  <param value="true" name="allowFullScreen">
  <param value="always" name="allowscriptaccess">
  <param name="movie" value="http://www.youtube.com/v/%(id)s?version=3"></param>
  <embed src="http://www.youtube.com/v/%(id)s?version=3&autoplay=1""
    allowfullscreen="true" allowscriptaccess="always"
    type="application/x-shockwave-flash" width="640" height="360">
  </embed>
</object>'''

    YOUTUBE_HTML5_EMBED_TAG = '''<iframe type="text/html" width="100%%" height="100%%"
    src="http://www.youtube.com/embed/%(id)s?autoplay=1" frameborder="0"></iframe>'''

    def __init__(self):
        self.yt_service = gdata.youtube.service.YouTubeService()
        self.yt_service.ssl = False

    def sources(self):
        return (self.SOURCE,)

    def fetch(self, url, logger, **kwargs):
        match = None
        for pattern in self.YOUTUBE_URL_PATTERNS:
            match = pattern.match(url)
            if match:
                break
        else:
            raise UrlNotSupported(url)

        video_id = match.group('id')
        logger.debug('Fetching YouTube metadata for url:%s id:%s' % (url, video_id))

        meta = dict()
        try:
            entry = self.yt_service.GetYouTubeVideoEntry(video_id=video_id)

            media = entry.media

            meta['title'] = media.title.text

            meta['description'] = None
            if media.description:
                meta['description'] = media.description.text

            rating = entry.rating
            if rating is not None:
                meta['rating'] = {'min': int(rating.min),
                                  'max': int(rating.max),
                                  'average': float(rating.average),
                                  'num_raters': int(rating.num_raters)}

            if media.duration:
                meta['duration'] = {'seconds': int(media.duration.seconds)}

            stats = entry.statistics
            if stats:
                meta['view_count'] = int(stats.view_count)
                meta['favorite_count'] = int(stats.favorite_count)

            if not media.thumbnail or not len(media.thumbnail):
                thumbnail_url_template = 'http://i.ytimg.com/vi/%s/%d.jpg'
                meta['thumbnail_url'] = thumbnail_url_template % (video_id, 0)
                meta['thumbnail_width'], meta['thumbnail_height'] = 480, 360
                meta['mobile_thumbnail_url'] = thumbnail_url_template % (video_id, 2)
                meta['mobile_thumbnail_width'], meta['mobile_thumbnail_height'] = 120, 90
            else:
                thumbnail = media.thumbnail[0]
                meta['thumbnail_url'] = thumbnail.url
                meta['thumbnail_width'] = thumbnail.width
                meta['thumbnail_height'] = thumbnail.height

                mobile_thumbnail = None
                for thumbnail in media.thumbnail:
                    if thumbnail.url.endswith('2.jpg'):
                        mobile_thumbnail = thumbnail
                if mobile_thumbnail:
                    meta['mobile_thumbnail_url'] = mobile_thumbnail.url
                    meta['mobile_thumbnail_width'] = mobile_thumbnail.width
                    meta['mobile_thumbnail_height'] = mobile_thumbnail.height

            meta['embeddable'] = False if entry.noembed else True
            if not meta['embeddable']:
                logger.warning('Youtube video:%s not embeddable' % video_id)

            meta['html'] = self.YOUTUBE_EMBED_TAG % {'id': video_id}
            meta['html5'] = self.YOUTUBE_HTML5_EMBED_TAG % {'id': video_id}

            meta['source'] = self.SOURCE

            return meta

        except RequestError, err:
            logger.error('Invalid video id:%s\n%s' % (video_id, str(err)))
            raise


class HuluFetcher(object):
    SOURCE = Source('Hulu',
                    'http://www.hulu.com',
                    'http://c2548752.cdn.cloudfiles.rackspacecloud.com/hulu.ico')

    HULU_URL_SCHEME = re.compile(r'http://r\.hulu\.com/videos\?(content_id|eid)=.+')

    HULU_EMBED_TAG = '''<object width="512" height="288">
  <param name="movie" value="http://www.hulu.com/embed/%(eid)s"></param>
  <param name="allowFullScreen" value="true"></param>
  <embed src="http://www.hulu.com/embed/%(eid)s" type="application/x-shockwave-flash"  width="512" height="288" allowFullScreen="true"></embed>
</object>'''

    def sources(self):
        return (self.SOURCE,)

    def fetch(self, url, logger, **kwargs):
        match = self.HULU_URL_SCHEME.match(url)
        if not match:
            raise UrlNotSupported(url)

        logger.debug('Fetching Hulu metadata for url:%s' % url)

        meta = dict()

        response = urllib.urlopen(url)

        if not response.getcode() == 200:
            raise Exception('Non-success response code:%d' % response.getcode())

        xml = response.read()

        logger.debug('Response for url:%s from Hulu:%s' % (url, xml))

        video = etree.fromstring(xml).find('video')

        meta['url'] = '/'.join([video.findtext('id'), video.findtext('canonical-name')])

        meta['title'] = video.findtext('title')
        meta['description'] = video.findtext('description')

        thumbnail_url = video.findtext('thumbnail-url')

        meta['thumbnail_url'] = thumbnail_url

        thumbnail_match = re.search(r'(\d{2,3})x(\d{2,3})_generated', thumbnail_url)
        if thumbnail_match:
            meta['thumbnail_width'], meta['thumbnail_height'] = thumbnail_match.groups()

        meta['html'] = self.HULU_EMBED_TAG % {'eid': video.findtext('eid')}

        meta['duration'] = int(float(video.findtext('duration')))

        meta['rating'] = {'positive': int(video.findtext('positive-votes-count')),
                          'average': float(video.findtext('rating')),
                          'num_raters': int(video.findtext('votes-count'))}

        meta['content_id'] = int(video.findtext('content-id'))
        meta['eid'] = video.findtext('eid')

        meta['video_type'] = video.findtext('video-type')

        meta['source'] = self.SOURCE

        return meta


class MockHuluFetcher(object):
    HULU_EMBED_URL_SCHEME = re.compile(r'http://r\.hulu\.com/videos\?eid=(.+)')

    def sources(self):
        return (HuluFetcher.SOURCE,)

    def fetch(self, url, logger, **kwargs):
        match = self.HULU_EMBED_URL_SCHEME.match(url)
        if not match:
            raise UrlNotSupported(url)

        eid = match.group(1)

        logger.debug('Mock Hulu fetcher formulating embed code for url:%s' % url)

        meta = {'html': HuluFetcher.HULU_EMBED_TAG % {'eid': eid}}

        meta['source'] = HuluFetcher.SOURCE

        return meta


class MockLiveLeakFetcher(object):
    SOURCE = Source('LiveLeak',
                    'http://www.liveleak.com/',
                    'http://c2548752.cdn.cloudfiles.rackspacecloud.com/liveleak.ico')

    LIVELEAK_URL_SCHEME = re.compile(r'http://(www\.)?liveleak\.com/view\?i=(.+)')

    LIVELEAK_EMBED_TAG = '''<object width="450" height="370">
  <param name="movie" value="http://www.liveleak.com/e/%(id)s"></param>
  <param name="wmode" value="transparent"></param>
  <param name="allowfullscreen" value="true"></param>
  <param name="allowscriptaccess" value="always"></param>
  <param name="flashvars" value="autostart=true"></param>
  <embed src="http://www.liveleak.com/e/%(id)s"
         type="application/x-shockwave-flash" wmode="transparent"
         allowfullscreen="true" allowscriptaccess="always"
         width="450" height="370" falshvars="autostart=true"></embed>
</object>'''

    def sources(self):
        return (self.SOURCE,)

    def fetch(self, url, logger, **kwargs):
        match = self.LIVELEAK_URL_SCHEME.match(url)
        if not match:
            raise UrlNotSupported(url)

        id = match.group(2)

        logger.debug('Mock LiveLeak fetcher formulating embed code for url:%s' % url)

        meta = {'html': self.LIVELEAK_EMBED_TAG % {'id': id}}

        meta['source'] = self.SOURCE

        return meta


class VimeoFetcher(object):
    SOURCE = Source('Vimeo',
                    'http://vimeo.com/',
                    'http://c2548752.cdn.cloudfiles.rackspacecloud.com/vimeo.ico')

    VIMEO_URL_PATTERNS = [
            re.compile(r'http://(www\.)?vimeo\.com/(\d+)'),
            re.compile(r'http://(www\.)?vimeo\.com/groups/\d+/videos/(\d+)'),
            re.compile(r'http://(www\.)?vimeo\.com/m/#/(\d+)'),
            ]

    VIMEO_API_REQUEST = 'http://vimeo.com/api/v2/video/%s.json'

    VIMEO_EMBED_TAG = '''<object width="640" height="360">
  <param name="allowfullscreen" value="true" />
  <param name="allowscriptaccess" value="always" />
  <param name="movie" value="http://vimeo.com/moogaloop.swf?clip_id=%(id)s&server=vimeo.com&show_title=0&show_byline=0&show_portrait=0&fullscreen=1&autoplay=1" />
  <embed src="http://vimeo.com/moogaloop.swf?clip_id=%(id)s&server=vimeo.com&show_title=0&show_byline=0&show_portrait=0&fullscreen=1&autoplay=1"
         type="application/x-shockwave-flash" allowfullscreen="true" allowscriptaccess="always" width="640" height="360"></embed>
</object>'''

    VIMEO_HTML5_EMBED_TAG = '''<iframe src="http://player.vimeo.com/video/%(id)s?title=0&amp;byline=0&amp;portrait=0&amp;autoplay=1"
    width="100%%" height="100%%" frameborder="0"></iframe>'''

    def sources(self):
        return (self.SOURCE,)

    def fetch(self, url, logger, **kwargs):
        id = None
        for regex in self.VIMEO_URL_PATTERNS:
            match = regex.match(url)
            if match:
                id = match.group(2)
                break
        else:
            raise UrlNotSupported(url)

        logger.debug('Fetching Vimeo metadata for url:%s' % url)

        response = urllib.urlopen(self.VIMEO_API_REQUEST % id)
        if not response.getcode() == 200:
            logger.error('Received non-success response from vimeo: %d\n%s' %\
                         (response.getcode(), response.read()))
            raise Exception('Non-success response code:%d' % response.getcode())

        video = json.loads(response.read())[0]

        meta = dict()

        meta['title'] = video['title']
        meta['description'] = video['description']

        meta['duration'] = {'seconds': int(video['duration'])}

        meta['rating'] = {'likes': video['stats_number_of_likes']}
        meta['view_count'] = video['stats_number_of_plays']

        meta['thumbnail_url'] = video['thumbnail_medium']
        meta['thumbnail_width'], meta['thumbnail_height'] = 200, 150

        meta['mobile_thumbnail_url'] = video['thumbnail_small']
        meta['mobile_thumbnail_width'], meta['mobile_thumbnail_height'] = 100, 75

        meta['html'] = self.VIMEO_EMBED_TAG % {'id': id}
        meta['html5'] = self.VIMEO_HTML5_EMBED_TAG % {'id': id}

        meta['source'] = self.SOURCE

        return meta


class FacebookFetcher(object):
    SOURCE = Source('Facebook',
                    'http://facebook.com/',
                    'http://c2548752.cdn.cloudfiles.rackspacecloud.com/facebook.ico')

    FACEBOOK_URL_SCHEME = re.compile(r'https://graph\.facebook\.com/(.+)')
    EMBEDLY_FACEBOOK_URL = 'http://www.facebook.com/v/%s'

    def __init__(self, fetchers):
        self.fetchers = fetchers

    def sources(self):
        return (self.SOURCE,)

    def forward(self, url, logger, **kwargs):
        for fetcher in self.fetchers:
            try:
                logger.debug('Forwarding metadata fetched for url:%s by fetcher:%s' %\
                             (url, str(fetcher)))
                return fetcher.fetch(url, logger, **kwargs)
            except UrlNotSupported:
                pass
        else:
            raise UrlNotSupported(url)

    def fetch(self, url, logger, **kwargs):
        match = self.FACEBOOK_URL_SCHEME.match(url)
        if not match:
            raise UrlNotSupported(url)

        logger.debug('Fetching Facebook metadata for url:%s' % url)

        user = User.objects.get(pk=kwargs['user_id'])
        access_token = user.facebook_access_token()

        url = '%s?%s' % (url, urlencode({'access_token': access_token}))
        response = json.loads(urllib2.urlopen(url).read())

        # Facebook sometimes does this for facebook-videos!
        if not response:
            fb_url = self.EMBEDLY_FACEBOOK_URL % match.group(1)
            meta = self.forward(fb_url, logger, **kwargs)

        else:
            # Link to original video?
            try:
                meta = self.forward(response['link'], logger)

            except KeyError:
                meta = dict()

                meta['title'] = response.get('name')

                meta['description'] = None
                meta['description'] = response['description']

                meta['thumbnail_url'] = response.get('picture')
                meta['thumbnail_width'], meta['thumbnail_height'] = 160, 90

                meta['html'] = response['embed_html']

                meta['source'] = self.SOURCE

        return meta


class AolVideoFetcher(object):
    SOURCE = Source('AOL Video', 'http://video.aol.com/')

    KIKIN_APP_ID = '4d003ed1274b76fa0'

    API_REQUEST_TEMPLATE = 'http://xml.truveo.com/apiv3?appid=%s&method=truveo.videos.getVideos&query=id:%s&results=1&format=json'

    AOL_VIDEO_URL_SCHEME = re.compile(r'http://video.aol.com/video(-detail)?/.+?/(?P<id>\d+)')

    def sources(self):
        return (self.SOURCE,)

    def fetch(self, url, logger, **kwargs):
        match = self.AOL_VIDEO_URL_SCHEME.match(url)
        if not match:
            raise UrlNotSupported(url)

        logger.debug('Fetching AOL Video metadata for url:%s' % url)

        fetch_url = self.API_REQUEST_TEMPLATE % (self.KIKIN_APP_ID, match.group('id'))

        response = json.loads(urllib.urlopen(fetch_url).read())

        code = response['response']['status']['code']
        if not code == 200:
            logger.error('Non-success response code:%d\n%s' % (code, str(response)))
            raise Exception('Received non-success response code: %d' % code)

        videoset = response['response']['data']['results']['videoSet']
        video = videoset['videos'][0]

        meta = dict()

        meta['title'] = video['title']
        meta['description'] = video['description']

        meta['thumbnail_url'] = video['thumbnailURLLarge']
        meta['thumbnail_width'], meta['thumbnail_height'] = 400, 300

        meta['mobile_thumbnail_url'] = video['thumbnailURL']
        meta['mobile_thumbnail_width'], meta['mobile_thumbnail_height'] = 120, 90

        meta['html'] = video['videoPlayerEmbedTag']

        meta['duration'] = {'seconds': video['runtime']}

        meta['rating'] = {'min': 1,
                          'max': 5,
                          'average': video['userRating'],
                          'num_raters': video['userRatingCount']}

        meta['view_count'] = video['viewCount']
        meta['favorite_count'] = video['favoriteCount']

        meta['source'] = self.SOURCE

        return meta


class CBSNewsFetcher(object):
    SOURCE = Source('CBS News', 'http://www.cbsnews.com/')

    CBS_URL_SCHEME = re.compile(r'http://(www\.)cbsnews\.com/video/watch/\?video_id=(\d+)')

    CBS_EMBED_TEMPLATE = '<embed src="http://cnettv.cnet.com/av/video/cbsnews/atlantis2/cbsnews_player_embed.swf" ' +\
                         'scale="noscale" salign="lt" type="application/x-shockwave-flash" background="#333333" width="425" height="279"' +\
                         'allowFullScreen="true" allowScriptAccess="always" ' +\
                         'FlashVars="si=254&uvpc=http://cnettv.cnet.com/av/video/cbsnews/atlantis2/uvp_cbsnews.xml&contentType=videoId' +\
                         '&contentValue=%s&ccEnabled=false&amp;hdEnabled=false&fsEnabled=true&shareEnabled=false&' +\
                         'dlEnabled=false&subEnabled=false&playlistDisplay=none&playlistType=none&playerWidth=425&playerHeight=239&' +\
                         'vidWidth=425&vidHeight=239&autoplay=true&bbuttonDisplay=none&playOverlayText=PLAY%%20CBS%%20NEWS%%20VIDEO&' +\
                         'refreshMpuEnabled=true&shareUrl=%s&adEngine=dart&adPreroll=true&adPrerollType=PreContent&adPrerollValue=1"/>'

    def sources(self):
        return (self.SOURCE,)

    def fetch(self, url, logger, **kwargs):
        match = self.CBS_URL_SCHEME.match(url)
        if not match:
            raise UrlNotSupported(url)

        logger.debug('Formulating CBSNews embed code for url:%s' % url)

        meta = dict()

        meta['html'] = self.CBS_EMBED_TEMPLATE % (match.group(2), kwargs.get('host'))
        meta['source'] = self.SOURCE

        return meta


class FoxFetcher(object):
    SOURCES = {'news': Source('FOX News', 'http://www.foxnews.com/'),
               'business': Source('FOX Business', 'http://www.foxbusiness.com')}

    FOX_URL_SCHEME = re.compile(r'http://video\.fox(business|news)\.com/v/(\d+).*')

    FOX_EMBED_TEMPLATE = '''<object width="640" height="360"
  data="http://video.foxnews.com/assets/akamai/FoxNewsPlayer.swf"
  type="application/x-shockwave-flash">
  <param value="high" name="quality">
  <param value="always" name="allowScriptAccess">
  <param value="transparent" name="wMode">
  <param value="true" name="swLiveConnect">
  <param value="true" name="autoplay">
  <param value="true" name="allowfullscreen">
  <param value="%s" name="flashVars">
</object>'''

    FOX_FLASHVARS = {
        'location': None,
        'core_ads_enabled': 'true',
        'core_omniture_player_name': 'fullpage',
        'core_omniture_account': 'foxnewsmaven',
        'core_ad_player_name': 'fullpage',
        'core_yume_ad_library_url': 'http://video.fox%s.com/assets/akamai/yume_ad_library.swf',
        'core_yume_player_url': 'http://video.fox%s.com/assets/akamai/yume_player_4x3.swf',
        'auto_play': 'true',
        'video_id': None,
        'settings_url': 'http://video.fox%s.com/assets/akamai/resources/conf/config-fb.xml?b',
        'show_autoplay_overlay': 'true',
        'auto_play_list': 'false',
        'cache_bust_key': None,
        'autoplay': 'false',
        'data_feed_url': 'http://video.fox%s.com/v/feed/video/%s.js?template=grab',
        }

    def sources(self):
        return self.SOURCES.values()

    def fetch(self, url, logger, **kwargs):
        match = self.FOX_URL_SCHEME.match(url)
        if not match:
            raise UrlNotSupported(url)

        domain, vid = match.groups()

        logger.debug('Formulating FOX %s embed code for url:%s' % (domain, url))

        flashvars = dict.copy(self.FOX_FLASHVARS)
        flashvars['location'] = url

        for key in ('core_yume_player_url',
                    'core_yume_ad_library_url',
                    'settings_url'):
            flashvars[key] = flashvars[key] % domain

        if match.group(1) == 'business':
            flashvars['core_omniture_account'] = 'foxnewsbusinessmaven'

        flashvars['data_feed_url'] = flashvars['data_feed_url'] % (domain, vid)
        flashvars['video_id'] = vid

        flashvars['cache_bust_key'] = int(time())

        meta = dict()
        meta['html'] = self.FOX_EMBED_TEMPLATE % urlencode(flashvars)

        meta['source'] = self.SOURCES[domain]

        return meta


class ESPNFetcher(object):
    SOURCE = Source('ESPN',
                    'http://espn.com/',
                    'http://c2548752.cdn.cloudfiles.rackspacecloud.com/espn.ico')

    ESPN_URL_SCHEME = re.compile(r'http://espn\.go\.com/video/clip\?id=([0-9]+)')

    IMAGE_SCHEME = re.compile(r'(http://assets\.espn\.go\.com/media/motion/)(.+)_thumbnail_wsmall(\.jpg)', re.IGNORECASE)

    ESPN_EMBED_TEMPLATE = '''<object width="576" height="324" type="application/x-shockwave-flash"
    data="http://assets.espn.go.com/espnvideo/mpf32/prod/r_3_2_0_15/ESPN_Player.swf?id=%s">
        <param name="flashVars" value="SWID=ECF783CB-BE64-4821-994E-5172301DE983&amp;adminOver=3805638&amp;player=videoHub09&amp;height=324&amp;width=576&amp;autostart=true&amp;localSite=undefined&amp;pageName=undefined">
        <param name="bgcolor" value="#000000">
        <param name="wmode" value="transparent">
        <param name="allowscriptaccess" value="always">
        <param name="quality" value="autohigh">
        <param name="align" value="t">
        <param name="swliveconnect" value="true">
        <param name="menu" value="false">
        <param name="play" value="true">
        <param name="allowfullscreen" value="true">
        <param name="seamlesstabbing" value="true">
    </object>'''

    ESPN_HTML5_EMBED_TEMPLATE = '''<video width="100%%" height="100%%" preload="none" style="z-index:inherit; position: relative;"
    data-track-start="true" data-track-mid="true" data-track-end="true" tabindex="0" controls
    src="http://brsseavideo-ak.espn.go.com/motion/%(id)s.mp4" poster="http://assests.espn.go.com/media/motion/%(id)s.jpg">
    </video>'''

    def sources(self):
        return (self.SOURCE,)

    def fetch(self, url, logger, **kwargs):
        logger.debug('ESPN fetcher received url:%s' % url)

        match = self.ESPN_URL_SCHEME.match(url)
        if not match:
            raise UrlNotSupported(url)
        id = match.group(1)

        opener = urllib2.build_opener()
        opener.addheaders = [('User-agent', IPAD_USER_AGENT)]

        tree = etree.parse(urllib2.urlopen(url), etree.HTMLParser())

        meta = dict()

        meta['title'] = tree.find('/head/title').text

        for tag in tree.findall('/head/meta'):
            try:
                if tag.attrib['name'] == 'description':
                    meta['description'] = tag.attrib['content']
            except KeyError:
                pass

            try:
                if tag.attrib['property'] == 'og:image':
                    image = tag.attrib['content']
                else:
                    raise KeyError()
            except KeyError:
                continue

            image_match = self.IMAGE_SCHEME.match(image)
            if not image_match:
                raise Exception('Image url:%s not of expected format' % image)

            meta['mobile_thumbnail_url'] = image
            meta['mobile_thumbnail_width'], meta['mobile_thumbnail_height'] = 110, 61

            meta['thumbnail_url'] = ''.join(image_match.groups())
            meta['thumbnail_width'], meta['thumbnail_height'] = 576, 324


        if 'thumbnail_url' not in meta:
            raise Exception('Meta tag "og:image" missing')

        meta['html'] = self.ESPN_EMBED_TEMPLATE % id
        meta['html5'] = self.ESPN_HTML5_EMBED_TEMPLATE % {'id': image_match.group(2)}

        meta['source'] = self.SOURCE

        return meta


_fetchers = [
        YoutubeFetcher(),
        VimeoFetcher(),
        MockHuluFetcher(),
        AolVideoFetcher(),
        CBSNewsFetcher(),
        FoxFetcher(),
        ESPNFetcher(),
        EmbedlyFetcher(),
        ]

_facebook_fetcher = FacebookFetcher(_fetchers)

_fetcher = OEmbed([_facebook_fetcher] + _fetchers)

@task(max_retries=5, default_retry_delay=300)
def fetch(user_id, url, host, callback=None):
    try:
        video = _fetcher.fetch(user_id, url, host, fetch.get_logger())
        if callback is not None:
            subtask(callback).delay(video)

    except UrlNotSupported:
        pass

    except Exception, exc:
        fetch.retry(exc=exc)


# Read username blacklist file on module load
read_user_blacklist = False
if not read_user_blacklist:
    import os.path
    user_blacklist_file = os.path.join(os.path.dirname(__file__), 'data', 'blacklisted_usernames')
    with open(user_blacklist_file, 'r') as f:
        user_blacklist = frozenset([line.strip() for line in f.readlines()])
    read_user_blacklist = True


def slugify(username, id):
    '''
    Normalizes string, converts to lowercase, removes non-alphanumeric characters (including spaces).
    Also, checks and appends offset integer to ensure that username is unique.

    >>> slugify('whatsherface', 123)
    u'whatsherface'
    >>> User.objects.create(username='whatsherface')
    <User: whatsherface>
    >>> slugify('whatsherface', 123)
    u'whatsherface1'
    >>> slugify('whats_her_face', 123)
    u'whatsherface1'
    >>> slugify('whatsherface2', 123)
    u'whatsherface2'
    >>> slugify('admin', 123)
    u'user0'
    >>> User.objects.create(username='user0')
    <User: user0>
    >>> slugify('about', 123)
    u'user01'
    '''
    username = normalize('NFKD', username).encode('ascii', 'ignore')
    username = basename = unicode(sub('[^0-9a-zA-Z\.]+', '', username).strip().lower())

    if username.lower() in user_blacklist:
        logger.info('User:%s tried to use a blocked username:%s' % (id, username))
        username = basename = u'user0'

    counter = 1
    while True:
        try:
            found = User.objects.get(username=username)
            if found.id == id:
                return username
        except User.DoesNotExist:
            break
        username = '%s%d' % (basename, counter)
        counter += 1

    return username

slugify.is_safe = True
slugify = stringfilter(slugify)


@task
def push_like_to_fb(video, user):
    from social_auth.backends.facebook import FACEBOOK_SERVER
    def encode(text):
        if isinstance(text, unicode):
            return text.encode('utf-8')
        return text

    logger = push_like_to_fb.get_logger()

    if not user.preferences()['syndicate'] == 1:
        logger.debug('Not pushing to FB for user:%s' % user.username)
        return

    server_name = Site.objects.get_current().domain

    params = {'access_token': user.facebook_access_token(),
              'link': '%s/%s' % (server_name, video.get_absolute_url()),
              'caption': server_name,
              'name': encode(video.title),
              'description': encode(video.description),
              'message': 'likes \'%s\'' % encode(video.title)}

    try:
        params['picture'] = video.get_thumbnail().url
    except Thumbnail.DoesNotExist:
        pass

    url = 'https://%s/me/feed' % FACEBOOK_SERVER
    try:
        response = json.loads(urllib2.urlopen(url, urlencode(params)).read())
        logger.debug('Facebook post id: %s' % response['id'])
    except:
        logger.exception('Could not post to Facebook')


@task(max_retries=3)
def fetch_facebook_friends(user):
    from social_auth.backends.facebook import FACEBOOK_SERVER
    from social_auth.models import UserSocialAuth

    logger = fetch_facebook_friends.get_logger()
    logger.info('Fetching facebook friends for user:%s' % user.username)

    try:
        params = {'access_token': user.facebook_access_token()}
        url = 'https://%s/me/friends?%s' % (FACEBOOK_SERVER, urllib.urlencode(params))

        response = urllib2.urlopen(url)

        code = response.getcode()
        if not code == 200:
            logger.error('Facebook server responded with code=%s when fetching friends' % code)
            return fetch_facebook_friends.retry()

        content = response.read()
        try:
            friends = json.loads(content)['data']
        except (TypeError, ValueError, KeyError):
            raise Exception('Facebook friends response not valid JSON:\n%s' % content)

        for friend in friends:
            try:
                fb_identity = UserSocialAuth.objects.get(uid=friend['id'])
                fb_friend = fb_identity.user

            except UserSocialAuth.DoesNotExist:
                parts = friend['name'].split(None, 2)
                if len(parts) == 2:
                    first, last = parts
                    username = slugify('.'.join([first, last]), -1)
                else:
                    first, last = parts[0], ''
                    username = slugify(first, -1)

                fb_friend = User.objects.create(first_name=first, last_name=last, username=username, is_registered=False)
                UserSocialAuth.objects.create(user=fb_friend, uid=friend['id'], provider='facebook')

            try:
                FacebookFriend.objects.get(user=user, fb_friend=fb_friend)
            except FacebookFriend.DoesNotExist:
                FacebookFriend.objects.create(user=user, fb_friend=fb_friend)

        user.fb_friends_fetched = datetime.utcnow()
        user.save()

        logger.info('Fetched %s facebook friends for user:%s' % (len(friends), user.username))

    except urllib2.URLError, exc:
        logger.error('Error opening facebook friends resource', exc_info=True)
        return fetch_facebook_friends.retry(exc=exc)


@task
def refresh_friends_list():
    logger = refresh_friends_list.get_logger()

    for user in User.objects.filter(is_registered=True):

        # Skip over users who have been refreshed in the last hour
        if user.fb_friends_fetched and datetime.utcnow() - user.fb_friends_fetched < timedelta(hours=1):
            logger.debug('Skipping over user:%s, last refresh:%s' % (user.username, user.fb_friends_fetched))
            continue

        fetch_facebook_friends.delay(user)
