from BeautifulSoup import BeautifulSoup

class VideoHelper(object):
    @staticmethod
    def source_from_video_tag(tag_content):
        tag = BeautifulSoup(tag_content)
        video_element = tag.findAll('video')[0]
        if not video_element.source:
            #no source CHILD...
            try:
                return video_element['source']
            except KeyError:
                try:
                    return video_element['src']
                except KeyError:
                    return None
        else:
            try:
                sources = video_element.findAll('source')
                for source in sources:
                    if str(source).find('mp4') > -1:
                        try:
                            media_attr = source['media']
                            if media_attr.find('screen') > 0:
                                return source['src']
                        except KeyError:
                            pass
                #if there wasn't an mp4 source with 'media' == 'screen',
                #return first mp4 source...
                for source in sources:
                    if str(source).find('mp4') > -1:
                        return video_element.source['src']
                return None
            except KeyError:
                return None

    @staticmethod
    def iframe_source(tag_content):
        tag = BeautifulSoup(tag_content)
        iframe = tag.findAll('iframe')[0]
        try:
            return iframe['src']
        except KeyError:
            return None