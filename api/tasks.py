import re
import urllib
import urllib2
import json

from time import time
from datetime import datetime
from traceback import format_exc
from lxml import etree
from urllib import urlencode

import gdata.youtube
import gdata.youtube.service
from gdata.service import RequestError

from celery.decorators import task
from django.utils.html import strip_tags

from api.models import Video, Thumbnail, Source as VideoSource

import logging
logger = logging.getLogger('kikinvideo')

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

        try:
            thumbnail = Thumbnail(url=meta['thumbnail_url'],
                                  width=meta['thumbnail_width'],
                                  height=meta['thumbnail_height'],
                                  video=video)

            thumbnail.save()

            video.thumbnails.add(thumbnail)

        except KeyError:
            pass

        try:
            mobile_thumbnail = Thumbnail(type='mobile',
                                         url=meta['mobile_thumbnail_url'],
                                         width=meta['mobile_thumbnail_width'],
                                         height=meta['mobile_thumbnail_height'],
                                         video=video)

            mobile_thumbnail.save()

            video.thumbnails.add(mobile_thumbnail)

        except KeyError:
            pass

        try:
            source = VideoSource.objects.get(url__exact=meta['source'].url)
        except VideoSource.DoesNotExist:
            source = VideoSource(name=meta['source'].name,
                                 url=meta['source'].url,
                                 favicon=meta['source'].favicon)

            source.save()

        video.source = source

        video.save()

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

        self.update(url, meta, logger)
        logger.info('Updated url:%s with metadata' % url)


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
            re.compile(r'http://blip\.tv/file/.*'),
            re.compile(r'http://.*\.blip\.tv/file/.*'),
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

    IPAD_USER_AGENT = 'Mozilla/5.0 (iPad; U; CPU OS 3_2 like Mac OS X; en-us) AppleWebKit/531.21.10 (KHTML, like Gecko) Version/4.0.4 Mobile/7B334b Safari/531.21.10'

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

        return meta

    def fetch_html5(self, url):
        params = {'url': url, 'autoplay': True, 'key': self.KEY}

        logger.debug('Fetching HTML5 video metadata for URL:%s' % url)

        query = urllib.urlencode(params)

        opener = urllib2.build_opener()
        opener.addheaders = [('User-agent', self.IPAD_USER_AGENT)]

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
        meta['mobile_thumbnail_width'], meta['thumbnail_height'] = 100, 75

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
                meta = fetcher.fetch(url, **kwargs)
                return meta
            except UrlNotSupported:
                pass
        else:
            raise UrlNotSupported(url)

    def fetch(self, url, logger, **kwargs):
        match = self.FACEBOOK_URL_SCHEME.match(url)
        if not match:
            raise UrlNotSupported(url)

        logger.debug('Fetching Facebook metadata for url:%s' % url)

        user = User.get(pk=kwargs['user_id'])
        access_token = user.facebook_access_token()

        url = '%s?%s' % (url, urlencode({'access_token': access_token}))
        response = json.loads(urllib2.urlopen(url).read())

        # Facebook sometimes does this for facebook-videos!
        if response == False:
            fb_url = self.EMBEDLY_FACEBOOK_URL % match.group(1)
            meta = self.forward(fb_url, **kwargs)

        else:
            # Link to original video?
            try:
                meta = self.forward(response['link'])

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


_fetchers = [
#        YoutubeFetcher(),
#        VimeoFetcher(),
#        MockHuluFetcher(),
#        AolVideoFetcher(),
#        CBSNewsFetcher(),
#        FoxFetcher(),
        EmbedlyFetcher(),
        ]

_facebook_fetcher = FacebookFetcher(_fetchers)

_fetcher = OEmbed([_facebook_fetcher] + _fetchers)

@task
def fetch(user_id, url, host):
    _fetcher.fetch(user_id, url, host, fetch.get_logger())