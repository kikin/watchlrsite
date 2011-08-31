from BeautifulSoup import BeautifulSoup

class VideoTagParseException(Exception):
    def __init__(self, reason):
        self.reason = reason
    def __str__(self):
        return self.reason

    
class VideoHelper(object):

    @staticmethod
    def source_from_video_tag(tag_content):
        """
        >>> ted = '''<video width="100%" height="100%" id="html5_video" controls="controls" poster="http://images.ted.com/images/ted/tedindex/embed-posters/MattCutts-2011U.embed_thumbnail.jpg" autobuffer="autobuffer"><source src="http://www.ted.com/talks/download/video/11817/talk/1183" type="video/mp4; codecs='avc1.42E01E, mp4a.40.2'" media="all"></source><source src="http://www.ted.com/talks/download/video/11818/talk/1183" type="video/mp4; codecs='avc1.42E01E, mp4a.40.2'" media="only screen and (min-device-width: 481px)"></source></video>'''
        >>> VideoHelper.source_from_video_tag(ted)
        u'http://www.ted.com/talks/download/video/11818/talk/1183'
        >>> espn = '''<video style="" id="VE33998760348762" preload="none" height="100%" width="100%" src="http://brsseavideo-ak.espn.go.com/motion/dm_110826_mlb_bbtn_informationage.mp4" poster="http://a.espncdn.com/media/motion/2011/0826/dm_110826_mlb_bbtn_informationage.jpg" controls="controls"></video>'''
        >>> VideoHelper.source_from_video_tag(espn)
        u'http://brsseavideo-ak.espn.go.com/motion/dm_110826_mlb_bbtn_informationage.mp4'
        >>> espn_ooyala = '''<video width="768" height="432" controls="controls" poster=""><source type="video/mp4" src="http://vod.espn.go.com/motion/2011/0830/com_110830_nhra_nitrorewind.m3u8?js=1"></source></video>'''
        >>> VideoHelper.source_from_video_tag(espn_ooyala)
        u'http://vod.espn.go.com/motion/2011/0830/com_110830_nhra_nitrorewind.m3u8?js=1'
        >>> cnn = '''<video width="100%" height="100%" id="cnnVPFlashLargeContainer_html5videoplayer" poster="http://i2.cdn.turner.com/money/video/smallbusiness/2011/08/29/smb_irene_damage_nj.cnnmoney.576x324.jpg" controls="controls" src="http://ht3.cdn.turner.com/money/big//smallbusiness/2011/08/29/smb_irene_damage_nj.cnnmoney_cnn_iphone_wifi_hi.mp4"></video>'''
        >>> VideoHelper.source_from_video_tag(cnn)
        u'http://ht3.cdn.turner.com/money/big//smallbusiness/2011/08/29/smb_irene_damage_nj.cnnmoney_cnn_iphone_wifi_hi.mp4'
        >>> funny_or_die = '''<video width="100%" height="100%" controls poster="http://assets0.ordienetworks.com/tmbs/a450a422ed/fullsize_2.jpg?82488feb" tabindex="0"><source src="http://videos0.ordienetworks.com/videos/a450a422ed/iphone_wifi.mp4" type="video/mp4"></source><source src="http://videos0.ordienetworks.com/videos/a450a422ed/iphone_edge.3gp" type="video/mp4"></source><source src="http://videos0.ordienetworks.com/videos/a450a422ed/iphone.mov" type="video/mp4"></source></video>'''
        >>> VideoHelper.source_from_video_tag(funny_or_die)
        u'http://videos0.ordienetworks.com/videos/a450a422ed/iphone_wifi.mp4'
        """

        tag = BeautifulSoup(tag_content)

        video_element = tag.find('video')
        if not video_element:
            raise VideoTagParseException('Missing video tag')

        sources = video_element.findAll('source')

        if not sources:
            #no source CHILD...
            try:
                return video_element['source']
            except KeyError:
                try:
                    return video_element['src']
                except KeyError:
                    raise VideoTagParseException('Video tag missing source attribute')

        else:
            valid_sources = []

            for source in sources:
                try:
                    if source['type'].find('video/mp4') == -1:
                        if source['src'].find('.mp4') == -1 and source['src'].find('.m3u8') == -1:
                            continue
                except KeyError:
                    continue

                valid_sources.append(source)

                try:
                    if not source['media'].find('screen') == -1:
                        return source['src']
                except KeyError:
                    pass

            # If no source with media type 'screen' found, use first valid source in list.
            if valid_sources:
                try:
                    return valid_sources[0]['src']
                except KeyError:
                    raise VideoTagParseException('Source tag missing source attribute')

            else:
                raise VideoTagParseException('No valid source tags found')

    @staticmethod
    def iframe_source(tag_content):
        """
        >>> vimeo = '''<iframe src="http://player.vimeo.com/video/8569187?title=0&amp;byline=0&amp;portrait=0&amp;autoplay=1" width="100%" height="100%" frameborder="0"></iframe>'''
        >>> VideoHelper.iframe_source(vimeo)
        u'http://player.vimeo.com/video/8569187?title=0&byline=0&portrait=0&autoplay=1'
        >>> youtube = '''<iframe type="text/html" width="100%" height="100%" src="http://www.youtube.com/embed/NgQY_bsUfHY?autoplay=1" frameborder="0"></iframe>'''
        >>> VideoHelper.iframe_source(youtube)
        u'http://www.youtube.com/embed/NgQY_bsUfHY?autoplay=1'
        """

        tag = BeautifulSoup(tag_content)

        iframe = tag.find('iframe')
        if not iframe:
            raise VideoTagParseException('Missing iframe tag')

        try:
            return iframe['src']
        except KeyError:
            raise VideoTagParseException('Iframe tag missing src parameter')

    @staticmethod
    def swf_source_from_object_tag(tag_content):
        """
        >>> bithink = '''<object id="flashObj" width="440" height="356" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,47,0"><param name="movie" value="http://c.brightcove.com/services/viewer/federated_f9?isVid=1&isUI=1"></param><param name="bgcolor" value="#FFFFFF"></param><param name="flashVars" value="@videoPlayer=723404781001&autoStart=false&playerID=651017566001&domain=embed&dynamicStreaming=true"></param><param name="base" value="http://admin.brightcove.com"></param><param name="seamlesstabbing" value="false"></param><param name="allowFullScreen" value="true"></param><param name="swLiveConnect" value="true"></param><param name="allowScriptAccess" value="always"></param><embed src="http://c.brightcove.com/services/viewer/federated_f9?isVid=1&isUI=1" bgcolor="#FFFFFF" flashvars="@videoPlayer=723404781001&playerID=651017566001&domain=embed&dynamicStreaming=true&autoStart=false" base="http://admin.brightcove.com" name="flashObj" width="440" height="356" seamlesstabbing="false" type="application/x-shockwave-flash" allowfullscreen="true" allowscriptaccess="always" swliveconnect="true" pluginspage="http://www.macromedia.com/shockwave/download/index.cgi?P1_Prod_Version=ShockwaveFlash"></embed></object>'''
        >>> VideoHelper.swf_source_from_object_tag(bithink)
        u'http://c.brightcove.com/services/viewer/federated_f9?isVid=1&isUI=1&@videoPlayer=723404781001&autoStart=true&playerID=651017566001&domain=embed&dynamicStreaming=true'
        """

        tag = BeautifulSoup(tag_content)

        object = tag.find('object')
        if not object:
            raise VideoTagParseException('Missing object tag')

        movie = flashVars = None
        for param in object.findAll('param'):
            name = param.get('name')
            if name == 'movie':
                movie = param['value']
            elif name == 'flashVars':
                flashVars = param['value']
                flashVars = flashVars.replace('&amp;', '&')
                flashVars = flashVars.replace('autoStart=false', 'autoStart=true')

        if movie is None:
            raise VideoTagParseException('Missing movie parameter')
        if flashVars is None:
            raise VideoTagParseException('Missing flashVars parameter')

        sep = '&' if movie.find('?') != -1 else '?'
        return '%s%c%s' % (movie, sep, flashVars)
