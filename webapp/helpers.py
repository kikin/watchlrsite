from BeautifulSoup import BeautifulSoup

class VideoHelper(object):
    @staticmethod
    def source_from_tag(tag_content):
        tag = BeautifulSoup(tag_content)
        video_element = tag.findAll('video')[0]
        if not video_element.source:
            #no source CHILD...
            try:
                source_attr = video_element['source']
                return source_attr
            except KeyError:
                return None
        else:
            try:
                sources = video_element.findAll('source')
                for source in sources:
                    if str(source).find('mp4') > -1:
                        return video_element.source['src']
                    return None
            except KeyError:
                return None