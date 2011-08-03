from BeautifulSoup import BeautifulSoup
from urllib import quote

class VideoTagParseException(Exception):
    def __init__(self, reason):
        self.reason = reason
    def __str__(self):
        return self.reason

    
class VideoHelper(object):
    @staticmethod
    def source_from_video_tag(tag_content):
        tag = BeautifulSoup(tag_content)

        video_element = tag.find('video')
        if not video_element:
            raise VideoTagParseException('Missing video tag')

        if not video_element.source:
            #no source CHILD...
            try:
                return video_element['source']
            except KeyError:
                try:
                    return video_element['src']
                except KeyError:
                    raise VideoTagParseException('Video tag missing source attribute')
        else:
            sources = video_element.findAll('source')

            for source in sources:
                if str(source).find('.mp4') > -1 or str(source).find('.m3u8') > -1:
                    try:
                        if source['media'] == 'screen':
                            return source['src']
                    except KeyError:
                        pass

            # If there wasn't an mp4 source with 'media' == 'screen', return first valid source.
            try:
                for source in sources:
                    if str(source).find('.mp4') > -1 or str(source).find('.m3u8') > -1:
                        return video_element.source['src']

                raise VideoTagParseException('No MP4 video source found')

            except KeyError:
                raise VideoTagParseException('Source tag missing source attribute')

    @staticmethod
    def iframe_source(tag_content):
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

        if movie is None:
            raise VideoTagParseException('Missing movie parameter')
        if flashVars is None:
            raise VideoTagParseException('Missing flashVars parameter')

        sep = '&' if movie.find('?') != -1 else '?'
        return quote('%s%c%s' % (movie, sep, flashVars))
