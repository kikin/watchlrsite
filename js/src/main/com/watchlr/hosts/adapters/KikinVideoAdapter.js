$.Class.extend("com.watchlr.hosts.adapters.KikinVideoAdapter", {
    getInstance : function() {
        if (!this._instance) {
            var adapter = $cws.services.getService('HostService').getAdapter('KikinVideoAdapter');
            this._instance = adapter ? new adapter() : null;
        }

        return this._instance;
    },
    stats : {
        reset: function() {
            this.enabled = 0;
            return this;
        },
        toLogString: function() {
            if (this.enabled == 0) {
                return '';
            } else {
                return 'KikinVideoAdapter:annotated='+this.enabled;
            }
        }
    }
}, {
    BORDER_WIDTH : 5,
    WATCHLR_COM : 'http://www.watchlr.com/',
    _popupMonitor : null,
    _connectionPopup : null,

    /**
    * list of videos on the page
    */
    videos: [],

    /** currently selected video. */
    selectedVideo: null,

    /** number of kikin supported videos found on page. */
    _videosFound : 0,

    /** div tag to create border around video. */
    kikinVideoBorder: null,

    _showFbPushDialog: false,

    /** list of services supported by kikin. */
    services : [
        {
            domains: ['youtube.com', 's.ytimg.com', 'youtube-nocookie.com'],
            source_regex: [/youtube.com\/v\/([\_\-a-zA-Z0-9]+)/, /youtube\.com\/embed\/([\_\-a-zA-Z0-9]+)/, /youtube-nocookie.com\/v\/([\_\-a-zA-Z0-9]+)/],
            flash_regex: [/&video_id=([\_\-a-zA-Z0-9]+)/i],
            url_regex: [/youtube\.com\/watch\?v=([\_\-a-zA-Z0-9]+)/i],
            url: 'http://www.youtube.com/watch?v='
        },
        {
            domains: ['vimeo.com', 'vimeocdn.com'],
            source_regex: [/vimeo\.com\/video\/([0-9]+)/i, /vimeo\.com\/moogaloop\.swf.*clip_id=([0-9]+)/i],
            flash_regex: [/&clip_id=([0-9]+)/i],
            url_regex: [/vimeo\.com\/([0-9]+)/i],
            url: 'http://www.vimeo.com/'
        },
        {
            domains: ['facebook.com'],
            source_regex: [],
            flash_regex: [/video_id=([0-9]+)/],
            url_regex: [/facebook\.com\/video\/video\.php\?v=([0-9]+)/i],
            url: 'http://www.facebook.com/v/'
        },
        {
            domains: ['cdn.turner.com/cnn', 'cdn.turner.com/money'],
            source_regex: [/videoId=([^&]+)/i, /video\/(.+)d+xd+\.jpg/i, /money\/video\/(.+)d+xd+\.jpg/i],
            flash_regex: [/contentId=([^&]+)/i],
            url_regex: [/cnn\.com\/video\/.\/video\/([^&]+)/i],
            url: 'http://www.cnn.com/video/?/video/'
        },
        /*
        {
            domains: ['justin.tv'],
            source_regex: [],
            flash_regex: [/(channel=([^&]+).*&archive_id=([0-9]+))|(archive_id=([0-9]+).*&channel=([^&]+))/i],
            url_regex: [/justin.tv\/([^&]+).*\/b\/([0-9]+)/i],
            url: function(x) {
                if (x[5]) {
                    var channel = x[6], archive = x[5];
                } else {
                    var channel = x[2], archive = x[3];
                }
                return 'http://www.justin.tv/' + channel + '/b/' + archive;
            }
        },
        */
        {
            domains: ['ustream.tv'],
            source_regex: [],
            flash_regex: [/channelid=([^&]+)/i, /cid=([^&]+)/i],
            url_regex: [/ustream\.tv\/channel\/([^&]+)/i],
            url: 'http://www.ustream.tv/channel/'
        },
        {
            domains: ['ustream.tv'],
            source_regex: [],
            flash_regex: [/vid=([0-9]+)/i],
            url_regex: [/ustream\.tv\/recorded\/([0-9]+)/i],
            url: 'http://www.ustream.tv/recorded/'
        },
        {
            domains: ['revision3.com'],
            source_regex: [/revision3\.com\/player/],
            flash_regex: [],
            url_regex: [/(http:\/\/revision3\.com\/.*)/i],
            use_location: true,
            location_regex: /revision3\.com\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+(\/|\?.*|$)$/,
            url: ''
        },
        /*
        {
            domains: ['dailymotion.com'],
            source_regex: [/dailymotion\.com\/swf\/video\/([a-zA-Z0-9]+)/, /dailymotion\.com\/swf\/([a-zA-Z0-9]+)/, /dailymotion\.com\/.*\/video\/([a-zA-Z0-9]+)\.mp4/],
            flash_regex: [/"videoId":"([a-zA-Z0-9]+)"/, /www.dailymotion.com\/video\/([a-zA-Z0-9]+)_/],
            url_regex: [/dailymotion\.com\/video\/([a-zA-Z0-9_\-]+)/],
            url: 'http://www.dailymotion.com/video/'
        },
        {
            domains: ['collegehumor.com'],
            source_regex: [/clip_id=([0-9]+)/i],
            flash_regex: [/clip_id=([0-9]+)/i],
            url_regex: [/collegehumor\.com\/video:([0-9]+)/i],
            url: 'http://www.collegehumor.com/video/'
        },
        */
        {
            domains: ['twitvid.com'],
            source_regex: [/twitvid.com\/player\/([A-Z0-9]+)/],
            flash_regex: [/twitvid.com\/playVideo_([A-Z0-9]+)/],
            url_regex: [/twitvid\.com\/([A-Z0-9]+)/],
            url: 'http://www.twitvid.com/'
        },
        /*
        {
            domains: ['break.com'],
            source_regex: [],
            flash_regex: [/sLink=(.*)&EmbedSEOLinkKeywords/],
            url_regex: [/(http:\/\/.*\.break\.com\/.*)/i],
            url: ''
        },
        {
            domains: ['myspace.com/videos'],
            source_regex: [/&amp;el=(.*)&amp;on/, /&el=(.*)&on/],
            flash_regex: [],
            url_regex: [/(http:\/\/www\.myspace.com\/index\.cfm\?fuseaction=.*&videoid.*)/, /(http:\/\/vids\.myspace\.com\/index\.cfm\?fuseaction=vids\.individual&videoid.*)/],
            url: ''
        },
        {
            domains: ['mediaservices.myspace.com'],
            source_regex: [/embed\.aspx\/m=([0-9]+)/],
            flash_regex: [],
            url_regex: [/myspace\.com\/video\/vid\/([0-9]+)/i],
            url: 'http://www.myspace.com/video/vid/'
        },
        {
            // metacafe
            domains: ['mcstatic.com'],
            source_regex: [],
            flash_regex: [/pageURL=([^&]+)/],
            url: ''
        },
        {
            domains: ['metacafe.com'],
            source_regex: [/metacafe\.com\/fplayer\/([0-9]+)\//],
            flash_regex: [],
            url_regex: [/metacafe\.com\/watch\/([0-9]+)/i],
            url: 'http://www.metacafe.com/watch/'
        },
        */
        {
            domains: ['blip.tv'],
            source_regex: [/http:\/\/blip\.tv\/play\/([A-Za-z0-9]+)/],
            flash_regex: [],
            url_regex: [/blip\.tv\/players\/episode\/([A-Za-z0-9]+)/],
            url: 'http://blip.tv/players/episode/'
        },
        {
            domains: ['blip.tv'],
            source_regex: [/blip\.tv\/scripts\/flash\/stratos\.swf/],
            flash_regex: [],
            url_regex: [/(http:\/\/blip\.tv\/file\/[0-9]+)/i],
            use_location: true,
            location_regex: /blip\.tv\/[\-a-z]+\/[\-a-z0-9]+/,
            url: ''
        },
        /*
        {
            domains: ['video.google.com'],
            source_regex: [/docid=([\-0-9]+)/i],
            flash_regex: [],
            url_regex: [/video\.google\.com\/videoplay\?docid=([\-0-9]+)/i],
            url: 'http://video.google.com/videoplay?docid='
        },
        {
            domains: ['revver.com'],
            source_regex: [/mediaId=([0-9]+)/],
            flash_regex: [/mediaId=([0-9]+)/],
            url_regex: [/revver\.com\/video\/([0-9]+)/i],
            url: 'http://revver.com/video/'
        },
        {
            domains: ['viddler.com'],
            source_regex: [/viddler\.com\/player/],
            flash_regex: [],
            url_regex: [/(http:\/\/.*viddler\.com\/explore\/.*\/videos\/.*)/i],
            use_location: true,
            location_regex: /viddler\.com\/explore\/.+?\/videos\/.+/,
            url: ''
        },
        {
            domains: ['liveleak.com'],
            source_regex: [/liveleak\.com\/e\/([0-9a-z]+_[0-9]+)/],
            flash_regex: [/token=([0-9a-z]+_[0-9]+)/],
            url_regex: [/liveleak\.com\/view\?i=([0-9a-z]+_[0-9]+)/i],
            url: 'http://liveleak.com/view?i='
        },
        {
            domains: ['dotsub.com'],
            source_regex: [/dotsub\.com\/media\/([\-0-9a-z]+)/],
            flash_regex: [/uuid=([\-0-9a-z]+)/],
            url_regex: [/dotsub\.com\/view\/([\-0-9a-z]+)/i],
            url: 'http://dotsub.com/view/'
        },
        {
            domains: ['overstream.net'],
            source_regex: [],
            flash_regex: [/oid=([0-9a-z]+)/],
            url_regex: [/overstream\.net\/view\.php\?oid=([0-9a-z]+)/i],
            url: 'http://www.overstream.net/view.php?oid='
        },
        {
            domains: ['livestream.com'],
            source_regex: [],
            flash_regex: [/(channel=([^&]+).*&clip=([_\-a-zA-Z0-9]+))|(clip=([_\-a-zA-Z0-9]+).*&channel=([^&]+))/i],
            url_regex: [/livestream\.com\/([^&]+)\/video\?clipId=\/([_\-a-zA-Z0-9]+)/],
            url: function(x) {
                if (x[5]) {
                    var channel = x[6], clip = x[5];
                } else {
                    var channel = x[2], clip = x[3];
                }
                return 'http://www.livestream.com/' + channel + '/video?clipId=' + clip;
            }
        },
        {
            domains: ['worldstarhiphop.com'],
            source_regex: [/worldstarhiphop\.com\/videos\/e\/[0-9]+\/(wshh[a-zA-Z0-9]+)/],
            flash_regex: [/vl=(wshh[a-zA-Z0-9]+)/],
            url_regex: [/worldstarhiphop\.com\/videos\/video\.php\?v=(wshh[a-zA-Z0-9]+)/i],
            url: 'http://www.worldstarhiphop.com/videos/video.php?v='
        },
        {
            domains: ['teachertube.com'],
            source_regex: [],
            flash_regex: [/pg=video_([0-9]+)/],
            url_regex: [/teachertube\.com\/viewVideo\.php\?video_id=([0-9]+)/i],
            url: 'http://www.teachertube.com/viewVideo.php?video_id='
        },
        {
            domains: ['teachertube.com'],
            source_regex: [],
            flash_regex: [/viewKey=([A-Z0-9]+)/i],
            url_regex: [/teachertube\.com\/view_video\.php\?viewkey=([A-Z0-9]+)/i],
            url: 'http://www.teachertube.com/view_video.php?viewkey='
        },
        {
            domains: ['bambuser.com'],
            source_regex: [/vid=([0-9]+)/],
            flash_regex: [],
            url_regex: [/bambuser\.com\/v\/([0-9]+)/i, /bambuser\.com\/.*\/([0-9]+)/i],
            url: 'http://www.bambuser.com/v/'
        },
        {
            domains: ['schooltube.com'],
            source_regex: [/schooltube\.com\/v\/[a-z0-9]+/],
            flash_regex: [],
            url_regex: [/(http:\/\/www\.schooltube\.com\/video\/[a-z0-9]+\/[\-a-zA-Z0-9]+)/i],
            use_location: true,
            location_regex: /schooltube\.com\/video\/[a-z0-9]+\/[\-a-zA-Z0-9]+/,
            url: ''
        },
        */
        {
            domains: ['bigthink.com'],
            source_regex: [/embeds\/video_idea\/([0-9]+)/],
            flash_regex: [],
            url_regex: [/bigthink\.com\/ideas\/([0-9]+)/i],
            url: 'http://www.bigthink.com/ideas/'
        },
        {
            domains: ['brightcove.com'],
            source_regex: [/brightcove\.com\/.+?&playerID=651017566001&/],
            flash_regex: [],
            use_location: true,
            location_regex: /bigthink\.com\/ideas\/[0-9]+/
        },
        {
            domains: ['brightcove.com'],
            source_regex: [/brightcove\.com\/.+?&playerID=651017566001&/],
            flash_regex: [],
            use_location: true,
            location_regex: /bigthink\.com\/series\/[0-9]+/
        },
        /*
        {
            domains: ['xtranormal.com'],
            source_regex: [],
            flash_regex: [/&link=([^&]+)/],
            url_regex: [/(http:\/\/www\.xtranormal\.com\/[^&]+)/i],
            url: ''
        },
        {
            domains: ['socialcam.com'],
            source_regex: [/socialcam\.com\/videos\/([a-zA-Z0-9]+)/],
            flash_regex: [/&id=video_([a-zA-Z0-9]+)/],
            url_regex: [/socialcam\.com\/v\/([a-zA-Z0-9]+)/i],
            url: 'http://socialcam.com/v/'
        },
        */
        {
            domains: ['dipdive.com'],
            source_regex: [/&itemID=([0-9]+)/i, /play\.dipdive\.com\/i\/([0-9]+)/],
            flash_regex: [/&mediaID=([0-9]+)/i],
            url_regex: [/dipdive\.com\/media\/([0-9]+)/i],
            url: 'http://dipdive.com/media/'
        },
        /*
        {
            domains: ['snotr.com'],
            source_regex: [/snotr\.com\/embed\/([0-9]+)/],
            flash_regex: [/video=([0-9]+)/i],
            url_regex: [/snotr.com\/video\/([0-9]+)/i],
            url: 'http://www.snotr.com/video/'
        },
        */
        {
            domains: ['whitehouse.gov'],
            source_regex: [],
            flash_regex: [/&share_url=([^&]+)/],
            url_regex: [/(http:\/\/www\.whitehouse\.gov\/photos-and-video\/video\/.*)/i, /(http:\/\/www\.whitehouse\.gov\/video\/.*)/i, /(http:\/\/wh\.gov\/photos-and-video\/video\/.*)/i, /(http:\/\/wh\.gov\/video\/.*)/i],
            url: ''
        },
        /*
        {
            domains: ['hulu.com'],
            source_regex: [/hulu\.com\/embed\/([_\-a-zA-Z0-9]+)/],
            flash_regex: [],
            url: 'http://r.hulu.com/videos?eid='
        },
        {
            domains: ['crackle.com'],
            source_regex: [/crackle\.com\/flash/],
            flash_regex: [],
            url_regex: [/(http:\/\/(www\.)?crackle.com\/c\/.*)/i],
            use_location: true,
            location_regex: /http:\/\/(www\.)?crackle.com\/c\//,
            url: ''
        },
        {
            domains: ['xfinitytv.comcast.net'],
            source_regex: [/xfinitytv\.comcast\.net(\/[^?]+)/],
            flash_regex: [/<videoUrl>(.+?)<\/videoUrl>/],
            url_regex: [/fancast\.com\/(.+?\/videos)/i],
            url: 'http://www.fancast.com'
        },
        */
        {
            domains: ['funnyordie.com', 'ordienetworks.com'],
            source_regex: [],
            flash_regex: [/key=([a-zA-Z0-9]+)/],
            url_regex: [/funnyordie\.com\/videos\/([a-zA-Z0-9]+)/i],
            url: 'http://www.funnyordie.com/videos/'
        },
        {
            domains: ['ted.com'],
            source_regex: [],
            flash_regex: [/&adKeys=talk=([^;]+)/],
            url_regex: [/ted\.com\/talks\/([^;]+)\.html/i],
            url: function(id) { return 'http://www.ted.com/talks/' + id[1] + '.html'; }
        },
        {
            domains: ['espn.go.com'],
            source_regex: [/espn\.go\.com\/espnvideo\/.+\?id=([0-9]+)/, /espn\.go\.com\/.+\?mediaId=([0-9]+)/],
            flash_regex: [/^id=([0-9]+)$/],
            url_regex: [/espn\.go\.com\/.+\/video\/.+\?videoId=([0-9]+)/i, /espn\.go\.com\/video\/clip\?id=([0-9]+)/i],
            url: 'http://espn.go.com/video/clip?id='
        } //,
        /*
        {
            domains: ['mtvnservices.com'],
            source_regex: [],
            flash_regex: [/sid=The_Daily_Show_.+?&/],
            url_regex: [/(http:\/\/(www\.)?thedailyshow\.com\/(full-episodes|watch)\/.+)/],
            use_location: true,
            location_regex: /http:\/\/(www\.)?thedailyshow\.com\/(full-episodes|watch)\/.+/,
            url: ''
        },
        {
            domains: ['mtvnservices.com'],
            source_regex: [],
            flash_regex: [/sid=Colbert_.+?&/],
            url_regex: [/(http:\/\/(www\.)?colbertnation\.com\/(full-episodes|the-colbert-report-videos)\/.+)/i],
            use_location: true,
            location_regex: /http:\/\/(www\.)?colbertnation\.com\/(full-episodes|the-colbert-report-videos)\/.+/,
            url: ''
        },
        {
            domains: ['mtvnservices.com'],
            source_regex: [/media\.mtvnservices\.com\/mgid:cms:video:comedycentral\.com:([0-9]+)/],
            flash_regex: [],
            url_regex: [/comedycentral\.com\/videos\/index\.jhtml\?.*?videoId=([0-9]+)/i],
            url: 'http://www.comedycentral.com/videos/index.jhtml?videoId='
        },
        {
            domains: ['theonion.com'],
            source_regex: [/theonion\.com\/video_embed\/\?id=([0-9]+)/],
            flash_regex: [],
            url_regex: [/theonion\.com\/video\?id=([0-9]+)/i],
            url: 'http://www.theonion.com/video?id='
        },
        {
            domains: ['theonion.com'],
            source_regex: [/media\.theonion\.com\/flash/],
            flash_regex: [],
            url_regex: [/(http:\/\/(www\.)?theonion\.com\/video\/.+)/],
            use_location: true,
            location_regex: /http:\/\/(www\.)?theonion\.com\/video\/.+/,
            url: ''
        },
        {
            domains: ['video.forbes.com'],
            source_regex: [/images\.forbes\.com\/video\/r2iversion77\/_assets\/swf\/VideoPlayer\.swf/],
            flash_regex: [],
            url_regex: [/(http:\/\/video\.forbes\.com\/fvn\/[\-a-zA-Z0-9]+\/[\-a-zA-Z0-9]+)/],
            use_location: true,
            location_regex: /video\.forbes\.com\/fvn\/[\-a-zA-Z0-9]+\/[\-a-zA-Z0-9]+/
        },
        {
            domains: ['forbes.com/video'],
            source_regex: [/&video=([\-a-zA-Z0-9]+\/[\-a-zA-Z0-9]+)/],
            flash_regex: [],
            url: 'http://video.forbes.com/fvn/'
        },
        {
            domains: ['brightcove.com'],
            source_regex: [/brightcove\.com.+?&publisherID=71683906001&/],
            flash_regex: [],
            url_regex: [/(http:\/\/video\.aol\.com\/video-detail\/.+?\/[0-9]+)/i],
            use_location: true,
            location_regex: /http:\/\/video\.aol\.com\/video-detail\/.+?\/[0-9]+/,
            url: ''
        },
        {
            domains: ['brightcove.com'],
            source_regex: [/brightcove\.com\/.+?&purl=([^&]+?video\.aol\.com\/video\/[^&]+)/],
            url_regex: [/(http:\/\/video\.aol\.com\/video\/[^&]+)/i],
            flash_regex: [],
            url: ''
        },
        {
            // Bravo TV videos are hosted on nbcuni.com
            domains: ['video.nbcuni.com'],
            source_regex: [/video\.nbcuni\.com\/outlet\/embed\/OutletEmbeddedPlayerLoader.swf/],
            flash_regex: [],
            url_regex: [/(http:\/\/.+?\.bravotv\.com\/.+\/videos\/.+)/],
            use_location: true,
            location_regex: /bravotv\.com\/.+\/videos\/.+$/,
            url: ''
        },
        {
            domains: ['cnettv.cnet.com/av/video/cbsnews'],
            source_regex: [],
            flash_regex: [/&shareUrl=http:\/\/www\.cbsnews\.com\/video\/watch\/\?id=([0-9]+n)&/, /&linkUrl=http:\/\/www\.cbsnews\.com\/video\/watch\/\?id=([0-9]+n)&/],
            url: 'http://www.cbsnews.com/video/watch/?id='
        },
        {
            domains: ['a.abcnews.com'],
            source_regex: [],
            flash_regex: [/&showId=([0-9]+)&/],
            url: 'http://abcnews.com/video/playerIndex/?id='
        },
        {
            // Tech crunch
            domains: ['player.ooyala.com'],
            source_regex: [],
            flash_regex: [/&embedCode=([0-9a-zA-Z]+)&/],
            url: 'http://techcrunch.tv/watch?id='
        }
        */
    ],

    /** Run method for video adapter. */
    attach: function() {
        var fn = $.proxy(function() { setTimeout($.proxy(this._onHashChange, this), 1000); }, this);
        /*$(window).hashchange()
        if (window.addEventListener) {
            window.addEventListener('hashchange', fn, false);
        } else {
            window.onhashchange = fn;
        } */

        // $(window).addEvent("load", fn);
        fn();
    },

    _onHashChange: function(e) {
        var embeds = this._findFlashVideoCandidates();
        if (embeds)
            this._findFlashVideos(embeds);

        if ((this.videos.length > 0) && !this.kikinVideoBorder) {
            this._createKikinBorder();
        }
    },

    debug : function(str) {
        //if (!$ks.__PRODUCTION__) {
            try {
                // console.log(str);
                // alert(str);
            } catch (e) {}
        //}
    },

    /**
    * find all the videos on the page
    */
    _findFlashVideoCandidates: function() {
        try {
            var embeds = [];

            var embed_tags = $('embed');
            // this.debug('Found ' + embed_tags.length + ' embeds');
            for (var i = 0; i < embed_tags.length; i++) {
                embeds.push(embed_tags[i]);
            }

            var objects = $('object');
            // this.debug('Found ' + objects.length + ' objects');
            for (var i = 0; i < objects.length; i++) {
                if (!/<embed/i.test(objects[i].innerHTML) || (!/<object/i.test(objects[i].innerHTML))) {
                    embeds.push(objects[i]);
                }
            }

            var iframes = $('iframe');
            // this.debug('Found ' + iframes.length + ' iframes');
            for (var i = 0; i < iframes.length; i++) {
                embeds.push(iframes[i]);
            }

            var videos = $('video');
            // this.debug('Found ' + videos.length + ' videos');
            for (var i = 0; i < videos.length; i++) {
                embeds.push(videos[i]);
            }

            return embeds;
        } catch (err) {
            // alert("from: _findFlashVideoCandidates of base KikinVideoAdapter. \n Reason:" + err);
            //$kat.trackError({from: "_findFlashVideoCandidates of base KikinVideoAdapter.", exception:err});
        }

        return null;
    },

    _findFlashVideos: function(embeds) {
        try {
            // this.debug('Searching through ' + embeds.length + ' candidates');
            for (var i = 0; i < embeds.length; i++) {
                var embedTag = $(embeds[i]);
                if (embedTag.kikinVideoId != null) {
                    continue;
                }

                var videoUrl = this._findVideoUrl(embeds[i]);
                // this.debug("Adding video for embed:" + embeds[i] + " and url: " + videoUrl);
                if (videoUrl) {
                    this._addVideo(embeds[i], videoUrl);
                }
            }

            if (this.videos.length > this._videosFound) {
                this._videosFound = this.videos.length;
                /*$kat.track('VideoAdapterEvt', 'SupportedVideoFound', {
                    campaign: window.location.host
                });*/

                //TODO: Enable this part for getting info

                $cws.WatchlrRequests.sendVideosInfoRequest($.proxy(this._onVideosInfoReceived, this), this.videos);
            }

            // this.debug("Number of videos found:" + this.videos.length);
        } catch (err) {
            // alert("from: _findFlashVideos of base KikinVideoAdapter. \nReason:" + err);
            // $kat.trackError({from: "_findFlashVideos of base KikinVideoAdapter.", exception:err});
        }
    },

    _findVideoUrl: function(embed) {
        var src = this._getNodeValue(embed, 'src') || this._getNodeValue(embed, 'data');
        var flashvars = this._getNodeValue(embed, 'flashvars');

        if (src.indexOf('/') == 0) {
            src = this._qualifyURL(src);
        } else if (src.indexOf('http://') == -1) {
            src = this._qualifyURL('/' + src);
        }

        // this.debug('Flashvars:' + flashvars);
        // this.debug('src:' + src);

        for (var j = 0; j < this.services.length; j++) {
            if (src && this._isSupportedDomain(src, this.services[j].domains)) {
                var match = { passed: false },
                	oService = this.services[j];

                if (flashvars) {
                    this._extractId(flashvars, oService.flash_regex, match);
                }

                if (!match.passed && !match.video_id) {
                    // this.debug('oService.source_regex: ' + oService.source_regex);
                    this._extractId(src, oService.source_regex, match);
                }

                if (match.passed) {
                    if (oService.use_location != undefined) {
                        if (oService.use_location && oService.location_regex.test(window.location.href)) {
                            // this.debug('Using location: ' + window.location.href);
                            return window.location.href;
                        }
                    } else if (match.video_id) {
                        // this.debug('Found video with id: ' + match.video_id);
                        if (typeof(oService.url) == 'function') {
                            // this.debug('Using URL:' + oService.url(match.video_id));
                            return oService.url(match.video_id);
                        } else {
                            // this.debug("Video ids:" + match.video_id);
                            // this.debug("Video id:" + match.video_id[1]);
                            // this.debug('Using URL:' + (oService.url + match.video_id[1]));
                            return oService.url + match.video_id[1];
                        }
                    }
                }
            }
        }

        return "";
    },

    _addVideo : function(embed, videoUrl) {
        try {
            // create the video object
            var onmouseout= (embed ? embed.onmouseout : null);
            var onmouseover = (embed ? embed.onmouseover : null);
            var video = {
                url                 : videoUrl,
                mouseover           : onmouseover,
                mouseout            : onmouseover,
                saved               : false,
                videoSelected       : false,
                saveButtonSelected  : false,
                coordinates         : null,
                tracked             : false,
                liked               : false,
                likes               : 0,
                saves               : 0,
                id                  : (this.videos.length + 1)
            };

            if (embed)
                this._addMouseEvents(embed);

            // assign the video id to embed object
            embed.kikinVideoId = video.id;

            // push the video object to list.
            this.videos.push(video);

            return video;
        } catch (err) {
            // alert("from: _addVideo of base KikinVideoAdapter. \n Reason:" + err);
            // $kat.trackError({from: "_addVideo of base KikinVideoAdapter.", msg:"Error while adding kikin video.", exception:err});
        }
    },

    _addMouseEvents : function(embed) {
        //$(embed).mouseenter(function() { alert('onmoueseenter'); });
        // $(embed).mouseleave(function() { alert('onmoueseleave'); });

        // add mouse events to the object
        var _onVideoMouseOver = $.proxy(this._onVideoMouseOver, this);
        var _onVideoMouseOut = $.proxy(this._onVideoMouseOut, this);

        /*if (embed.nodeName.toLowerCase() == 'iframe') {
            $(embed).mouseenter(_onVideoMouseOver);
            $(embed).mouseleave(_onVideoMouseOut);
            return;
        } */

        // We try to listen mouse events for video in all the possible ways.
        // Different players fire events in different way. For eg.
        // 1. Youtube will fire the event on 'onmouseover'
        // 2. Collegehumour will fire event on 'addEventListener' in Firefox/Chrome and 'attachEvent' in IE
        // 3. Vimeo will always fire the event on 'addEventListener' (even for IE7 and IE8)
        try {
            embed.onmouseover = _onVideoMouseOver;
            embed.onmouseout = _onVideoMouseOut;
            // this.debug('Added mouse events successfully for embed:' + embed);
        } catch (e) {
            // alert("From: _addMouse events. \n Reason:" + e);
        }

        // If attachEvent is supported listen mouse events using attachEvent
        if (embed.attachEvent) {
            try {
                embed.attachEvent('onmouseover', _onVideoMouseOver);
                embed.attachEvent('onmouseout', _onVideoMouseOut);
                // this.debug('Attached mouse events successfully for embed:' + embed);
            } catch (e) {
                // alert("From: _addMouse events. \n Reason:" + e);
            }
        }

        // If addEventListener is supported listen mouse events using addEventListener
        if (embed.addEventListener) {
            try {
                embed.addEventListener('mouseover', _onVideoMouseOver, false);
                embed.addEventListener('mouseoout', _onVideoMouseOut, false);
                // this.debug('Added events listeners for mouse events successfully for embed:' + embed);
            } catch (e) {
                // alert("From: _addMouse events. \n Reason:" + e);
            }
        }
    },

    _getNodeValue: function (obj, id) {
        //var value = $(obj).attr(id);
        var value = "";
        for (var i = 0; i < obj.attributes.length; i++) {
            if (obj.attributes[i].nodeName.toLowerCase() == id) {
                value += obj.attributes[i].nodeValue;
                break;
            }
        }

        var params = $(obj).find('param');
        if (params) {
            for (var i = 0; i < params.length; i++) {
                if (params[i].name.toLowerCase() == id) {
                    value += params[i].value;
                    break;
                }
            }
        }

        return decodeURIComponent(value);
    },

    _isSupportedDomain: function(src, domains) {
        for (var i = 0; i < domains.length; i++) {
            // this.debug('Testing against domain: ' + domains[i] + ' with src: ' + src);
            if (src.indexOf(domains[i]) != -1) {
                // this.debug('Matched domain ' + domains[i]);
                return true;
            }
        }
        return false;
    },

    _extractId: function(str, patterns, match) {
        for (var i = 0; i < patterns.length; i++) {
            // this.debug('Matching: ' + patterns[i] + ' against ' + str);
            var videoId = patterns[i].exec(str);
            if (videoId) {
                // this.debug('Matched: ' + str + " \tfor pattern:" + patterns[i]);
                match.passed = true;
                match.video_id = videoId;
                return;
            }
        }
    },

    _escapeHTML: function(s) {
        return s.split('&').join('&amp;').split('<').join('&lt;').split('"').join('&quot;');
    },

    _qualifyURL: function(url) {
        var el = document.createElement('div');
        el.innerHTML = '<a href="' + this._escapeHTML(url) + '">x</a>';
        return el.firstChild.href;
    },

    _createKikinBorder : function() {
        try {
            $($('head').get(0)).append('<link rel="stylesheet" type="text/css" href="http://fonts.googleapis.com/css?family=PT%20Sans">');
            $cwutil.Styles.insert('VideoBorderStyles', document);
            // create a div tag for the video
            $(document.body).append($cws.html['VideoBorder']);
            this.kikinVideoBorder = $('#watchlr-video-border');

            $(this.kikinVideoBorder).find('#like-btn-text').html(this._localize('like'));

            $(this.kikinVideoBorder).find('#watchlr-logo').click($.proxy(this._handleVisitingVideoPageRequested, this));
            $(this.kikinVideoBorder).find('#watch-later-btn-img').click($.proxy(this._onSaveButtonClicked, this));
            $(this.kikinVideoBorder).find('#watch-later-btn-text').click($.proxy(this._onSaveButtonClicked, this));
            $(this.kikinVideoBorder).find('#like-btn-img').click($.proxy(this._onLikeButtonClicked, this));
            $(this.kikinVideoBorder).find('#like-btn-text').click($.proxy(this._onLikeButtonClicked, this));

            $(this.kikinVideoBorder).find('#options-button').mouseenter($.proxy(this._onSaveButtonMouseOver, this));
            $(this.kikinVideoBorder).find('#options-button').mouseleave($.proxy(this._onSaveButtonMouseOut, this));

            $(this.kikinVideoBorder).find('#watchlr-logo').mouseenter($.proxy(this._onWatclrLogoMouseEnter, this));
            $(this.kikinVideoBorder).find('#watch-later-btn-img').mouseenter($.proxy(this._onSaveButtonMouseEnter, this));
            $(this.kikinVideoBorder).find('#watch-later-btn-text').mouseenter($.proxy(this._onSaveButtonMouseEnter, this));
            $(this.kikinVideoBorder).find('#like-btn-img').mouseenter($.proxy(this._onLikeButtonMouseEnter, this));
            $(this.kikinVideoBorder).find('#like-btn-text').mouseenter($.proxy(this._onLikeButtonMouseEnter, this));

            $(this.kikinVideoBorder).find('#watchlr-logo').mouseleave($.proxy(this._onWatclrLogoMouseLeave, this));
            $(this.kikinVideoBorder).find('#watch-later-btn-img').mouseleave($.proxy(this._onSaveButtonMouseLeave, this));
            $(this.kikinVideoBorder).find('#watch-later-btn-text').mouseleave($.proxy(this._onSaveButtonMouseLeave, this));
            $(this.kikinVideoBorder).find('#like-btn-img').mouseleave($.proxy(this._onLikeButtonMouseLeave, this));
            $(this.kikinVideoBorder).find('#like-btn-text').mouseleave($.proxy(this._onLikeButtonMouseLeave, this));

        } catch (e) {
            // alert("from: createKikinBorder of base KikinVideoAdapter. \nReason:" + e);
            // $kat.trackError({from:"createKikinBorder of base KikinVideoAdapter", msg: "Unable to create the border around video.", exception:e});
        }
    },

    /**
    * draw the border around the flash videos on the page.
    */
    _drawKikinBorder: function(left, top, width, height, saved, liked, likes) {
        if (!this.kikinVideoBorder) {
            this._createKikinBorder();
        }

        if ((left >= 0 )&& (top >= 0) && width && height && this.kikinVideoBorder) {
            try {
                // set the position and dimensions for the left border
                var leftBorderStyle = {
                    'left'   : '' + (left - this.BORDER_WIDTH) + 'px',
                    'top'    : '' + top + 'px',
                    'width'  : '' + this.BORDER_WIDTH + 'px',
                    'height' : '' + height + 'px'
                };
                $(this.kikinVideoBorder).find('#left-border').css(leftBorderStyle);


                // this.debug("Left border is created with dimensions:" + leftBorder.style.left + "," + leftBorder.style.top + ", " + leftBorder.style.width + ", " + leftBorder.style.height);

                // set the position and dimensions for the right border
                var rightBorderStyle = {
                    'left'   : '' + (left + width) + 'px',
                    'top'    : '' + top + 'px',
                    'width'  : '' + this.BORDER_WIDTH + 'px',
                    'height' : '' + height + 'px'
                };
                $(this.kikinVideoBorder).find('#right-border').css(rightBorderStyle);


                // this.debug("Right border is created with dimensions:" + rightBorder.style.left + "," + rightBorder.style.top + ", " + rightBorder.style.width + ", " + rightBorder.style.height);

                // set the position and dimensions for the top border
                var topBorderStyle = {
                    'left'   : '' + (left - this.BORDER_WIDTH) + 'px',
                    'top'    : '' + (top - this.BORDER_WIDTH) + 'px',
                    'width'  : '' + (width + (2 * this.BORDER_WIDTH)) + 'px',
                    'height' : '' + this.BORDER_WIDTH + 'px'
                };
                $(this.kikinVideoBorder).find('#top-border').css(topBorderStyle);

                // this.debug("Top border is created with dimensions:" + topBorder.style.left + "," + topBorder.style.top + ", " + topBorder.style.width + ", " + topBorder.style.height);

                // set the position and dimensions for the bottom border
                var bottomBorderStyle = {
                    'left'   : '' + (left - this.BORDER_WIDTH) + 'px',
                    'top'    : '' + (top + height) + 'px',
                    'width'  : '' + (width + (2 * this.BORDER_WIDTH)) + 'px',
                    'height' : '' + this.BORDER_WIDTH + 'px'
                };
                var bottomBorder = $(this.kikinVideoBorder).find('#bottom-border');
                $(bottomBorder).css(bottomBorderStyle);

                if (saved) {
                    $(this.kikinVideoBorder).find('#watch-later-btn-text').html(this._localize('btnSaved'));
                    $(this.kikinVideoBorder).find('#watch-later-btn-img').removeClass();
                    $(this.kikinVideoBorder).find('#watch-later-btn-img').addClass("watchlr-image saved-button-image");
                } else if (!this.selectedVideo.savingVideo) {
                    $(this.kikinVideoBorder).find('#watch-later-btn-text').html(this._localize('btnSave'));
                    $(this.kikinVideoBorder).find('#watch-later-btn-img').removeClass();
                    $(this.kikinVideoBorder).find('#watch-later-btn-img').addClass("watchlr-image watch-later-button-image");
                }


                var kikinLikeBtn = $(this.kikinVideoBorder).find('#like-btn-img');
                var likeBtnText = $(this.kikinVideoBorder).find('#like-btn-text');
                // var kikinLikeBtnText = $(this.kikinVideoBorder).find('#kikinLikeBtnText');
                if (liked) {
                    $(kikinLikeBtn).removeClass();
                    $(kikinLikeBtn).addClass('watchlr-image like-button-image');
                    $(likeBtnText).html(this._localize('liked'));
                } else {
                    $(kikinLikeBtn).removeClass();
                    $(kikinLikeBtn).addClass('watchlr-image unlike-button-image');
                    $(likeBtnText).html(this._localize('like'));
                }

                var saveButton =  $(this.kikinVideoBorder).find('#options-button');
                var saveButtonTop = parseInt($(bottomBorder).css('top'));

                var saveButtonLeft = parseInt($(bottomBorder).css('left')) +
                                     parseInt($(bottomBorder).css('width')) -
                                     (parseInt($(saveButton).css('width')) + /*paddign*/23);

                $(saveButton).css({
                    'left' : '' + saveButtonLeft + 'px',
                    'top'  : '' + saveButtonTop + 'px'
                });

                $(this.kikinVideoBorder).show();
            } catch (e) {
                // alert('from: drawKikinBorder of base KikinVideoAdapter. \nReason:' + e);
                // $kat.trackError({from: "drawKikinBorder of base KikinVideoAdapter", msg: "Unable to reposition border around video.", exception:e});
            }
        }
    },

    /**
     * retrieves the coordinates for the video
     * @param embed
     */
    _getVideoCoordinates: function(embed) {
        try {
            // this.debug("Get called in base class getVideoCoordinates");
            var videoWidth = embed.clientWidth || embed.width;
            if (!videoWidth) {
                videoWidth = this._getNodeValue(embed, 'width');
            }

            var videoHeight = embed.clientHeight || embed.height;
            if (!videoHeight) {
                videoHeight = this._getNodeValue(embed, 'height');
            }

            var parent = embed;
            var offsetLeft = 0;
            var offsetTop = 0;
            // Calculate the absolute position of the video
            while (parent && (parent != document.body)) {
                offsetLeft += parent.offsetLeft;
                offsetTop += parent.offsetTop;
                var oldParent = parent;
                parent = parent.offsetParent;

                // if the element has set the scroll property,
                // then calculate the relative position of video in the view port.
                // relative position of video in context of view port can be calculated using
                // offsetLeft = element.scrollLeft - (absolute position of video in the element)
                // offsetTop = element.scrollTop - (absolute position of video in the element)
                var parentElement = oldParent;
                while (parentElement && (parentElement != parent)) {
                    // alert(parentElement);
                    // this.debug('Parent element: ' + parentElement.tagName);
                    var overFlow = $(parentElement).css('overflow');
                    if (overFlow && (overFlow == "scroll" || overFlow == "auto")) {
                        if (parentElement.scrollLeft) {
                            // this.debug('Left scroll is:' + parentElement.scrollLeft);
                            offsetLeft -= parentElement.scrollLeft;
                        }
                        if (parentElement.scrollTop) {
                            // this.debug('Top scroll is:' + parentElement.scrollTop);
                            offsetTop -= parentElement.scrollTop;
                        }

                    } else {
                        var overFlowX = $(parentElement).css('overflow-x');
                        if (overFlowX && (overFlowX == "scroll" || overFlowX == "auto")  && parentElement.scrollLeft) {
                            // this.debug("scroll left position is: " + parentElement.scrollLeft);
                            offsetLeft -= parentElement.scrollLeft;
                        }

                        var overFlowY = $(parentElement).css('overflow-y');
                        if (overFlowY && (overFlowY == "scroll" || overFlowY == "auto") && parentElement.scrollTop) {
                            // this.debug("scroll top position is: " + parentElement.scrollTop);
                            offsetTop -= parseInt(parentElement.scrollTop);
                        }
                    }

                    parentElement = $(parentElement).parent().get(0);
                }

                // this.debug("Offset Left:" + offsetLeft + " \t Offset Top: " + offsetTop);
            }

            var coordinates = {
                left    : offsetLeft,
                top     : offsetTop,
                width   : videoWidth,
                height  : videoHeight
            };

            return coordinates;
        } catch (e) {
            // alert('from: getVideoCoordinates of base KikinVideoAdapter. \nReason:' + e);
            // $kat.trackError({from: "getVideoCoordinates of base KikinVideoAdapter", msg: "Unable to calculate the coordinates for video.", exception:e});
        }

        return null;
    },

    /**
     * when user mouse overs the video
     * @param e
     */
    _onVideoMouseOver: function(e) {
        try {
            var evt = e;
            if (!evt)
                evt = window.event;

            // If there is no event, we cannot find the target, and thus, we cannot find the video ID
            // associated with the target. So ignore the event
            if (!evt)
                return;

            var target = evt.target;
            if (!target)
                target = evt.srcElement;

            // this.debug("Video mouse over for target:" + (target ? target.nodeName : "not found"));

            if (target) {
                if (target.nodeType == 3) {
                    target = target.parentNode;
                }

                // get the kikin video id
                var kikinVideoId = target.kikinVideoId;
                if (kikinVideoId === null || kikinVideoId == undefined) {
                    var embedTags = target.getElementsByTagName('embed');
                    if (embedTags.length == 1) {
                        kikinVideoId = embedTags[0].kikinVideoId;
                    }
                }

                // this.debug("Video id associated with target:" + kikinVideoId);

                // if kikin video is is valid
                // draw the border around video
                if (kikinVideoId) {
                    var selectedVideo = this.videos[kikinVideoId - 1];

                    try {
                        if (!selectedVideo.tracked) {
                            /*$kat.track('VideoAdapterEvt', 'VideoMouseOver', {
                                campaign: window.location.host
                            });*/
                            selectedVideo.tracked = true;
                        }
                    } catch (err) {}

                    // if selected video is different than the video saved in the object
                    // hide the saved object video if it is visible
                    if (this.selectedVideo && (this.selectedVideo != selectedVideo)) {
                        $(this.kikinVideoBorder).fadeOut();
                        // this.kikinVideoBorder.style.visibility = "hidden";
                        this.selectedVideo.videoSelected = false;
                        this.selectedVideo.shareButtonSelected = false;
                    }

                    // set the new selected video
                    this.selectedVideo = selectedVideo;



                    // calculate the coordinates for video
                    selectedVideo.coordinates = this._getVideoCoordinates(target);

                    if (selectedVideo.coordinates) {
                        // this.debug("Coordinates for video:" + selectedVideo.coordinates.left + ", " + selectedVideo.coordinates.top + ", " + selectedVideo.coordinates.width + ", " + selectedVideo.coordinates.height);

                        // draw the border around video
                        this._drawKikinBorder(selectedVideo.coordinates.left,
                                              selectedVideo.coordinates.top,
                                              selectedVideo.coordinates.width,
                                              selectedVideo.coordinates.height,
                                              selectedVideo.saved,
                                              selectedVideo.liked,
                                              selectedVideo.likes);
                    }

                    selectedVideo.videoSelected = true;

                    try {
                        // call the original mouseover event
                        if (selectedVideo.onmouseover) {
                            selectedVideo.onmouseover();
                        }
                    } catch (e) {}
                }
            }
        } catch (err) {
            // alert('from: onVideoMouseOver of base KikinVideoAdapter. \nReason:' + err);
            // $kat.trackError({from: "onVideoMouseOver of base KikinVideoAdapter", exception:err});
        }
    },

    /**
     * on mouse out from video
     * @param e
     */
    _onVideoMouseOut: function(e) {
        try {

            var evt = e;
            if (!evt)
                evt = window.event;

            // If there is no event, we cannot find the target, and thus, we cannot find the video ID
            // associated with the target. So ignore the event
            if (!evt)
                return;

            var target = evt.target;
            if (!target)
                target = evt.srcElement;

            // this.debug("Video mouse out for target:" + (target ? target.nodeName : "not found"));

            if (target) {
                if (target.nodeType == 3) {
                    target = target.parentNode;
                }

                // fetch the kikin video id
                var kikinVideoId = target.kikinVideoId;
                if (kikinVideoId === null || kikinVideoId == undefined) {
                    var embedTags = target.getElementsByTagName('embed');
                    if (embedTags.length == 1) {
                        kikinVideoId = embedTags[0].kikinVideoId;
                    }
                }

                // this.debug("Video id associated with target:" + kikinVideoId);

                // if kikin video id is valid
                if (kikinVideoId >= 0) {
                    // set the selected video property to false
                    var selectedVideo = this.videos[parseInt(kikinVideoId, 10) - 1];
                    selectedVideo.videoSelected = false;

                    // hide the border after a second
                    setTimeout($.proxy(function() {
                        var selectedVideo = this.selectedVideo;

                        // if mouse is not over the video or share button of the video
                        // hide the video
                        if (selectedVideo &&
                        	!selectedVideo.shareButtonSelected &&
                            !selectedVideo.videoSelected &&
                            !this.selectedVideo.savingVideo &&
                            !this.selectedVideo.likingVideo)
                        {
                            // $(this.kikinVideoBorder).css('visibility', 'hidden');
                            $(this.kikinVideoBorder).fadeOut();
                        }
                    }, this), 1000);


                    try {
                        if (selectedVideo.onmouseout) {
                            selectedVideo.onmouseout();
                        }
                    }  catch (e) {}
                }
            }
        } catch (err) {
            // alert('from: onVideoMouseOut of base KikinVideoAdapter. \nReason:' + err);
            // $kat.trackError({from: "onVideoMouseOut of base KikinVideoAdapter", exception:err});
        }
    },

    /**
     * on mouse over share button
     * @param e
     */
    _onSaveButtonMouseOver: function(e) {
        try {
            // this.debug("On button mouse over");
            if (e) e.stopPropagation();

            this.selectedVideo.shareButtonSelected = true;
        } catch (err) {
            // alert('from: onSaveButtonMouseOver of base KikinVideoAdapter. \nReason:' + err);
            // $kat.trackError({from: "onSaveButtonMouseOver of base KikinVideoAdapter", exception:err});
        }
    },

    /**
     * on mouse out of share button
     * @param e
     */
    _onSaveButtonMouseOut: function(e) {
        try {
            if (e) e.stopPropagation();

            // this.debug("On button mouse out");

            this.selectedVideo.shareButtonSelected = false;

            // hide the border after 1 second
            setTimeout($.proxy(function() {

                // if mouse is not over share button or video,
                // hide the border
                var selectedVideo = this.selectedVideo;
                if (!selectedVideo.shareButtonSelected &&
                    !selectedVideo.videoSelected &&
                    !this.selectedVideo.savingVideo &&
                    !this.selectedVideo.likingVideo)
                {
                    $(this.kikinVideoBorder).fadeOut();
                }
            }, this), 1000);
        } catch (err) {
            // alert('from: onSaveButtonMouseOut of base KikinVideoAdapter. \nReason:' + err);
            // $kat.trackError({from: "onSaveButtonMouseOut of base KikinVideoAdapter", exception:err});
        }
    },

    _onWatclrLogoMouseEnter : function(e) {
        try {
            if (e) e.stopPropagation();

            var watchlrLogoImg = $(this.kikinVideoBorder).find('#watchlr-logo');
            $(watchlrLogoImg).removeClass();
            $(watchlrLogoImg).addClass('watchlr-image watchlr-logo-hover-image');
        } catch (err) {
            // alert('from: _onWatclrLogoMouseEnter of base KikinVideoAdapter. \nReason:' + err);
            // $kat.trackError({from: "onSaveButtonMouseOut of base KikinVideoAdapter", exception:err});
        }
    },

    _onSaveButtonMouseEnter : function(e) {
        try {
            if (e) e.stopPropagation();

            var watchLaterButtonImg = $(this.kikinVideoBorder).find('#watch-later-btn-img');
            $(watchLaterButtonImg).removeClass();
            if (this.selectedVideo.saved) {
                $(watchLaterButtonImg).addClass('watchlr-image saved-button-hover-image');
            } else {
                $(watchLaterButtonImg).addClass('watchlr-image watch-later-button-hover-image');
            }

            var watchLaterButtonText = $(this.kikinVideoBorder).find('#watch-later-btn-text');
            $(watchLaterButtonText).css({
                'text-decoration': 'underline',
                'color': '#000000'
            });

        } catch (err) {
            // alert('from: _onSaveButtonMouseEnter of base KikinVideoAdapter. \nReason:' + err);
            // $kat.trackError({from: "onSaveButtonMouseOut of base KikinVideoAdapter", exception:err});
        }
    },

    _onLikeButtonMouseEnter : function(e) {
        try {
            if (e) e.stopPropagation();

            var likeButtonImg = $(this.kikinVideoBorder).find('#like-btn-img');

            if (this.selectedVideo.liked) {
                // $(likeButtonImg).removeClass();
                // $(likeButtonImg).addClass('watchlr-image like-button-hover-image');
            } else {
                $(likeButtonImg).removeClass();
                $(likeButtonImg).addClass('watchlr-image unlike-button-hover-image');
            }

            var likeButtonText = $(this.kikinVideoBorder).find('#like-btn-text');
            $(likeButtonText).css({
                'text-decoration': 'underline',
                'color': '#000000'
            });

        } catch (err) {
            // alert('from: _onLikeButtonMouseEnter of base KikinVideoAdapter. \nReason:' + err);
            // $kat.trackError({from: "onSaveButtonMouseOut of base KikinVideoAdapter", exception:err});
        }
    },

    _onWatclrLogoMouseLeave : function(e) {
        try {
            if (e) e.stopPropagation();

            var watchlrLogoImg = $(this.kikinVideoBorder).find('#watchlr-logo');
            $(watchlrLogoImg).removeClass();
            $(watchlrLogoImg).addClass('watchlr-image watchlr-logo-image');
        } catch (err) {
            // alert('from: _onWatclrLogoMouseLeave of base KikinVideoAdapter. \nReason:' + err);
            // $kat.trackError({from: "onSaveButtonMouseOut of base KikinVideoAdapter", exception:err});
        }
    },

    _onSaveButtonMouseLeave : function(e) {
        try {
            if (e) e.stopPropagation();

            var watchLaterButtonImg = $(this.kikinVideoBorder).find('#watch-later-btn-img');
            $(watchLaterButtonImg).removeClass();
            if (this.selectedVideo.saved) {
                $(watchLaterButtonImg).addClass('watchlr-image saved-button-image');
            } else {
                $(watchLaterButtonImg).addClass('watchlr-image watch-later-button-image');
            }

            var watchLaterButtonText = $(this.kikinVideoBorder).find('#watch-later-btn-text');
            $(watchLaterButtonText).css({
                'text-decoration': 'none',
                'color': '#ffffff'
            });

        } catch (err) {
            // alert('from: _onSaveButtonMouseLeave of base KikinVideoAdapter. \nReason:' + err);
            // $kat.trackError({from: "onSaveButtonMouseOut of base KikinVideoAdapter", exception:err});
        }
    },

    _onLikeButtonMouseLeave : function(e) {
        try {
            if (e) e.stopPropagation();

            var likeButtonImg = $(this.kikinVideoBorder).find('#like-btn-img');
            $(likeButtonImg).removeClass();
            if (this.selectedVideo.liked) {
                $(likeButtonImg).addClass('watchlr-image like-button-image');
            } else {
                $(likeButtonImg).addClass('watchlr-image unlike-button-image');
            }

            var likeButtonText = $(this.kikinVideoBorder).find('#like-btn-text');
            $(likeButtonText).css({
                'text-decoration': 'none',
                'color': '#ffffff'
            });

        } catch (err) {
            // alert('from: _onLikeButtonMouseLeave of base KikinVideoAdapter. \nReason:' + err);
            // $kat.trackError({from: "onSaveButtonMouseOut of base KikinVideoAdapter", exception:err});
        }
    },

    /**
     * when user clicks the share button
     * share the video
     *
     * @param e
     */
    _onSaveButtonClicked: function(e) {
        try {
            if (e) e.stopPropagation();
            var target = e.target;

            // this.debug("On button mouse clicked");

            try {
                // this.debug("Is video saved:" + this.selectedVideo.saved);
                if (!this.selectedVideo.saved) {

                    // change the save button to saving spinner
                    var saveButton = $(this.kikinVideoBorder).find('#watch-later-btn-img');
                    $(saveButton).removeClass();
                    $(saveButton).addClass("watchlr-image spinner-image");

                    // change the save button text to saving...
                    $($(this.kikinVideoBorder).find('#watch-later-btn-text')).html(this._localize('btnSaving'));

                    this.selectedVideo.savingVideo = true;
                    $cws.WatchlrRequests.sendSaveVideoRequest($.proxy(this._updateButtonState, this), this.selectedVideo.url);
                    /*$kat.track('Video', 'SaveVideoClk', {
                        campaign: window.location.host
                    });*/
                } else {
                    window.open(this.WATCHLR_COM);
                    /*$kat.track('Video', 'ToVKikinCom', {
                        campaign: window.location.host
                    });*/
                }
            } catch (e) {
                // alert('from: onSaveButtonClicked of base KikinVideoAdapter. \nReason:' + e);
                // $kat.trackError({ from: 'onSaveButtonClicked of base KikinVideoAdapter', msg: 'error while saving video', exception: e });
            }
        } catch (err) {
            // alert('from: onSaveButtonClicked of base KikinVideoAdapter. \nReason:' + err);
            // $kat.trackError({from: "onSaveButtonClicked of base KikinVideoAdapter", exception:err});
        }
    },

    /**
     * when user clicks the like button
     * like the video
     *
     * @param e
     */
    _onLikeButtonClicked: function(e) {
        try {
            if (e) e.stopPropagation();
            var target = e.target;

            // this.debug("On button mouse clicked");

            try {
                // change the like button to saving spinner
                var likeButton = $(this.kikinVideoBorder).find('#like-btn-img');
                $(likeButton).removeClass();
                $(likeButton).addClass("watchlr-image spinner-image");

                // change the save button text to liking...
                // $($(this.kikinVideoBorder).find('#watch-later-btn-text')).html(this._localize('btnSaving'));

                this.selectedVideo.likingVideo = true;

                // If we don't have to show the push to facebook dialog, then make the request to server
                // else we are going to make the call when user closes the push to facebook dialog.

                if (!this.selectedVideo.liked) {
                    if (this._showFbPushDialog) {
                        var oAlert = new $cwui.modalwin.FirstVideoLikedWindow();
                        oAlert.bind('close', $.proxy(this._onPushToFacebookWindowClosed, this));
                        oAlert.bind('visituserprofilepage', $.proxy(this._handleVisitingVideoPageRequested, this));
                        oAlert.show();
                    } else {
                        $cws.WatchlrRequests.sendVideoLikedRequest($.proxy(this._onVideoLiked, this), this.selectedVideo.url);
                        //$kat.track('Video', 'LikeVideoClk', {
                        //    campaign: window.location.host
                        //});
                    }
                } else {
                    window.open(this.WATCHLR_COM + '#!/liked_queue');
                }

                /*if (this._showFbPushDialog) {
                    var oAlert = new $cwui.modalwin.FirstVideoLikedWindow();
                    oAlert.bind('close', $.proxy(this._onPushToFacebookWindowClosed, this));
                    oAlert.bind('visituserprofilepage', $.proxy(this._handleVisitingVideoPageRequested, this));
                    oAlert.show();
                } else {
                    if (!this.selectedVideo.liked) {
                        $cws.WatchlrRequests.sendVideoLikedRequest($.proxy(this._onVideoLiked, this), this.selectedVideo.url);
                        //$kat.track('Video', 'LikeVideoClk', {
                        //    campaign: window.location.host
                        //});
                    } else {
                        // $cws.WatchlrRequests.sendVideoUnlikedRequest($.proxy(this._onVideoLiked, this), this.selectedVideo.url);
                        //$kat.track('Video', 'UnlikeVideoClk', {
                        //    campaign: window.location.host
                        //});
                    }
                } */
            } catch (e) {
                // alert('from: onLikeButtonClicked of base KikinVideoAdapter. \nReason:' + e);
                // $kat.trackError({ from: 'onLikeButtonClicked of base KikinVideoAdapter', msg: 'error while liking video', exception: e });
            }
        } catch (err) {
            // alert('from: onLikeButtonClicked of base KikinVideoAdapter. \nReason:' + err);
        }
    },

    /**
	 * determine if the popup window is closed, when it is call the commonCallback
	 */
	_monitorPopup: function() {
        // this.debug("Window is created:" + (this._connectionPopup==null));
        // this.debug("Window is closed:" + (this._connectionPopup.closed));
		if(this._connectionPopup==null || this._connectionPopup.closed){
			this._popupMonitor = false;
			this._commonCallback();
		} else if(this._popupMonitor){
            // console.log("Checking again");
			setTimeout($.proxy(this._monitorPopup, this), 600);
		}
	},

    _commonCallback: function() {
        // this.debug('get called in common callback');
        if (this.selectedVideo.savingVideo) {
            $cws.WatchlrRequests.sendSaveVideoRequest($.proxy(this._updateButtonState, this), this.selectedVideo.url);
        } else if (this.selectedVideo.likingVideo) {
            // this.debug('making the request for fetching user info');
            $cws.WatchlrRequests.sendUserProfileRequest($.proxy(this.onUserProfileReceived, this));
        }
    },

    _handleFacebookConnectionCancelled: function() {
        if (this.selectedVideo.savingVideo) {
            this.selectedVideo.savingVideo = false;

            // change the save button to saving spinner
            var saveButton = $(this.kikinVideoBorder).find('#watch-later-btn-img');
            $(saveButton).removeClass();
            $(saveButton).addClass("watchlr-image watch-later-button-image");

            // change the save button text to saving...
            $($(this.kikinVideoBorder).find('#watch-later-btn-text')).html(this._localize('btnSave'));

            var oAlert = new $cwui.modalwin.AlertWindow(
                this._localize('errorDlgTitle'),
                this._localize('errorDlgMsg')
            );
            oAlert.show();

        } else if (this.selectedVideo.likingVideo) {
            this.selectedVideo.likingVideo = false;

            // change the like button to saving spinner
            var saveButton = $(this.kikinVideoBorder).find('#like-btn-img');
            $(saveButton).removeClass();

            // change the save button text to liking...
            // $($(this.kikinVideoBorder).find('#watch-later-btn-text')).html(this._localize('btnSaving'));

            if (!this.selectedVideo.liked) {
                var oAlert = new $cwui.modalwin.AlertWindow(
                    this._localize('errorDlgLikeTitle'),
                    this._localize('errorDlgLikeMsg')
                );
                oAlert.show();
                $(saveButton).addClass("watchlr-image unlike-button-image");
            } else {
                var oAlert = new $cwui.modalwin.AlertWindow(
                    this._localize('errorDlgUnlikeTitle'),
                    this._localize('errorDlgUnlikeMsg')
                );
                oAlert.show();
                $(saveButton).addClass("watchlr-image like-button-image");
            }
        }

        /*$kat.track('VideoAdapterEvt', 'LoginCancel', {
            campaign: window.location.host
        });*/
    },

    _handleFacebookConnectionRequested: function() {
        var url = this.WATCHLR_COM + 'login/facebook?next=' + encodeURIComponent(this.WATCHLR_COM+'static/html/connectWindow.html?connected=true&code=200');
        this._connectionPopup = window.open(url, '_blank', 'location=1, width=' + 800 + ',height=' + 600 + ',left=' + 200 + ',top=' + 200);
        this._popupMonitor = true;
        this._monitorPopup();
    },

    _handleVisitingVideoPageRequested: function() {
        window.open(this.WATCHLR_COM);
    },

    /** When video is saved. */
    _updateButtonState: function(data) {
        try {
            // this.debug("Data received from server:" + data);
            if(this.selectedVideo){
                var buttonText = "";
                var res = null;
                if (typeof data == "object") {
                    res = data;
                } else {
                    res = JSON.decode(data);
                }

                var videoSavedSuccessfully = false;
                if (res && res.success && res.result && res.result.saved) {
                    videoSavedSuccessfully = true;
                } else {
                    if (res) {
                        switch (res.code) {

                            case 400: {
                                videoSavedSuccessfully = true;
                                break;
                            }

                            case 401: {
                                // this.debug("Session sent was an invalid session");
                                var oAlert = new $cwui.modalwin.FacebookConnectWindow();
                                oAlert.bind('close', $.proxy(this._handleFacebookConnectionCancelled, this));
                                oAlert.bind('connect', $.proxy(this._handleFacebookConnectionRequested, this));
                                oAlert.bind('visituserprofilepage', $.proxy(this._handleVisitingVideoPageRequested, this));
                                oAlert.show();
                                break;
                            }

                            default: {
                                var oAlert = new $cwui.modalwin.AlertWindow(
                                    this._localize('errorDlgTitle'),
                                    this._localize('errorDlgMsg')
                                );
                                oAlert.show();
                                // alert('from: updateButtonState of base KikinVideoAdapter. \nReason:' + 'Unable to save video');
                                // $kat.trackError({from: "updateButtonState of base KikinVideoAdapter", msg:"Unable to save video. Error code:" + res.code + ", Error:" + res.error});
                            }
                        }
                    } else {
                        var oAlert = new $cwui.modalwin.AlertWindow(
                            this._localize('errorDlgTitle'),
                            this._localize('errorDlgMsg')
                        );

                        // alert('from: updateButtonState of base KikinVideoAdapter. \nReason:' + 'Unable to save video');
                        //$kat.trackError({from: "updateButtonState of base KikinVideoAdapter", msg:"Unable to save video. Reason:" + (res ? res.error : "Result is null")});
                    }
                }

                var saveButtonText = $(this.kikinVideoBorder).find('#watch-later-btn-text');
                var saveButtonImg = $(this.kikinVideoBorder).find('#watch-later-btn-img');
                $(saveButtonImg).removeClass();
                if (videoSavedSuccessfully) {
                    this.selectedVideo.savingVideo = false;
                    this.selectedVideo.saved = true;
                    $(saveButtonText).html(this._localize('btnSaved'));
                    $(saveButtonImg).addClass("watchlr-text saved-button-image");

                    // video Id can be 0;
                    if (res.result) {
                        var oResult = res.result;
                        if (oResult.id != null && oResult.id != undefined)
                            this.selectedVideo.videoId = oResult.id;
                        if(oResult.emptyq) {
                            var oAlert = new $cwui.modalwin.VideoSavedWindow();
                            oAlert.bind('close', $.proxy(this._onSavedWindowClosed, this));
                            oAlert.bind('visituserprofilepage', $.proxy(this._handleVisitingVideoPageRequested, this));
                            oAlert.show();
                        }
                    }

                } else {
                    $(saveButtonText).html(this._localize('btnSave'));
                    $(saveButtonImg).addClass("watchlr-text watch-later-button-text");
                }

                // hide the border after 1 second
                setTimeout($.proxy(function() {
                    // if mouse is not over share button or video,
                    // hide the border
                    var selectedVideo = this.selectedVideo;
                    if (!selectedVideo.shareButtonSelected &&
                        !selectedVideo.videoSelected &&
                        !this.selectedVideo.savingVideo &&
                        !this.selectedVideo.likingVideo)
                    {
                        $(this.kikinVideoBorder).fadeOut();
                    }
                }, this), 1000);
            }
        } catch (err) {
            // alert('from: updateButtonState of base KikinVideoAdapter. \nReason:' + err);
            // $kat.trackError({from: "updateButtonState of base KikinVideoAdapter", exception:err});
        }
	},

    /** When video is liked. */
    _onVideoLiked: function(data) {
        try {
            // this.debug("Data received from server:" + data);
            if(this.selectedVideo){

                var res = null;
                if (typeof data == "object") {
                    res = data;
                } else {
                    res = JSON.decode(data);
                }

                // this.debug("On video liked:" + JSON.encode(res));

                var videoLikedSuccessfully = false;
                if (res && res.success) {
                    videoLikedSuccessfully = true;
                } else {
                    if (res) {
                        switch (res.code) {

                            case 400: {
                                videoLikedSuccessfully = true;
                                break;
                            }

                            case 401: {
                                // this.debug("Session sent was an invalid session:" + $ks.KikinPlugin.getKke("_KVS"));
                                var oAlert = new $cwui.modalwin.FacebookConnectWindow();
                                oAlert.bind('close', $.proxy(this._handleFacebookConnectionCancelled, this));
                                oAlert.bind('connect', $.proxy(this._handleFacebookConnectionRequested, this));
                                oAlert.bind('visituserprofilepage', $.proxy(this._handleVisitingVideoPageRequested, this));
                                oAlert.show();
                                break;
                            }

                            default: {
                                if (!this.selectedVideo.liked) {
                                    var oAlert = new $cwui.modalwin.AlertWindow(
                                        this._localize('errorDlgLikeTitle'),
                                        this._localize('errorDlgLikeMsg')
                                    );
                                    oAlert.show();
                                } /*else {
                                    var oAlert = new $cwui.modalwin.AlertWindow(
                                        this._localize('errorDlgUnlikeTitle'),
                                        this._localize('errorDlgUnlikeMsg')
                                    );
                                    oAlert.show();
                                }  */
                                // alert("from: _onVideoLiked of base KikinVideoAdapter. \nReason:" + err);

                                // $kat.trackError({from: "_onVideoLiked of base KikinVideoAdapter", msg:"Unable to like video. Error code:" + res.code + ", Error:" + res.error});
                            }
                        }
                    } else {
                        if (!this.selectedVideo.liked) {
                            var oAlert = new $cwui.modalwin.AlertWindow(
                                this._localize('errorDlgLikeTitle'),
                                this._localize('errorDlgLikeMsg')
                            );
                            oAlert.show();
                        } /*else {
                            var oAlert = new $cwui.modalwin.AlertWindow(
                                this._localize('errorDlgUnlikeTitle'),
                                this._localize('errorDlgUnlikeMsg')
                            );
                            oAlert.show();
                        }   */
                        // alert("from: _onVideoLiked of base KikinVideoAdapter. \nReason:" + err);
                        // $kat.trackError({from: "_onVideoLiked of base KikinVideoAdapter", msg:"Unable to like video. Reason:" + (res ? res.error : "Result is null")});
                    }
                }

                var likeBtnImage = $(this.kikinVideoBorder).find('#like-btn-img');
                var likeBtnText = $(this.kikinVideoBorder).find('#like-btn-text');
                if (videoLikedSuccessfully) {
                    this.selectedVideo.likingVideo = false;
                    if (res.result) {
                        var oResult = res.result;
                        if (typeof oResult.liked == 'boolean')
                            this.selectedVideo.liked = oResult.liked;

                        if (typeof oResult.likes == 'number')
                            this.selectedVideo.likes = oResult.likes;
                    }


                    // var kikinLikeBtnText = $(this.kikinVideoBorder).find('#kikinLikeBtnText');
                    if (this.selectedVideo.liked) {
                        $(likeBtnImage).removeClass();
                        $(likeBtnImage).addClass('watchlr-image like-button-image');
                        $(likeBtnText).html(this._localize('liked'));
                        // $(kikinLikeBtnText).css('color', '#FF0000');
                    } else {
                        $(likeBtnImage).removeClass();
                        $(likeBtnImage).addClass('watchlr-image unlike-button-image');
                        // $(kikinLikeBtnText).css('color', '#505050');
                    }
                } else {
                    if (!this.selectedVideo.liked) {
                        $(likeBtnImage).removeClass();
                        $(likeBtnImage).addClass('watchlr-image like-button-image');
                        $(likeBtnText).html(this._localize('like'));
                        // $(kikinLikeBtnText).css('color', '#FF0000');
                    } else {
                        $(likeBtnImage).removeClass();
                        $(likeBtnImage).addClass('watchlr-image unlike-button-image');
                        // $(kikinLikeBtnText).css('color', '#505050');
                    }
                }

                // hide the border after 1 second
                setTimeout($.proxy(function() {
                    // if mouse is not over share button or video,
                    // hide the border
                    var selectedVideo = this.selectedVideo;
                    if (!selectedVideo.shareButtonSelected &&
                        !selectedVideo.videoSelected &&
                        !this.selectedVideo.savingVideo &&
                        !this.selectedVideo.likingVideo)
                    {
                        $(this.kikinVideoBorder).fadeOut();
                    }
                }, this), 1000);
            }
        } catch (err) {
            // alert("From: _onVideoLiked of base KikinVideoAdapter. \nReason:" + err);
            //$kat.trackError({from: "_onVideoLiked of base KikinVideoAdapter", exception:err});
        }
	},

    _onSavedWindowClosed: function(evt, showMessageUnchecked) {
        try {
            if (showMessageUnchecked) {
                 $cws.WatchlrRequests.sendUpdateUserProfileRequest($.proxy(this._onUserProfileUpdated, this));
            }
        } catch (err) {
            // alert("From: _onSavedWindowClosed of base KikinVideoAdapter. \nReason:" + err);
            // $kat.trackError
        }
    },

    _onPushToFacebookWindowClosed: function(evt, pushToFcaebook) {
        try {
            if (pushToFcaebook == '0' || pushToFcaebook == '1') {
                $cws.WatchlrRequests.sendUpdateUserPreferenceRequest($.proxy(this._onUserProfileUpdated, this), pushToFcaebook);
            }

            if (!this.selectedVideo.liked) {
                $cws.WatchlrRequests.sendVideoLikedRequest($.proxy(this._onVideoLiked, this), this.selectedVideo.url);
                /*$kat.track('Video', 'LikeVideoClk', {
                    campaign: window.location.host
                });*/
            } else {
                $cws.WatchlrRequests.sendVideoUnlikedRequest($.proxy(this._onVideoLiked, this), this.selectedVideo.url);
                /*$kat.track('Video', 'UnlikeVideoClk', {
                    campaign: window.location.host
                });*/
            }
        } catch (err) {
            // alert("From: _onPushToFacebookWindowClosed of base KikinVideoAdapter. \nReason:" + err);
            // $kat.trackError
        }
    },

    _onUserProfileUpdated: function(data) {
        var str = "";
        for (var i in data) {
            str += i + ": " + data[i] + "\r\n";
        }
        // this.debug(str);
    },

	/**
	 * @param {String}
	 */
	_localize: function(_key){
		return $cwc.Locale.get('KikinVideo', _key);
	},

    onUserProfileReceived: function(data) {
        // this.debug("User profile info received.");
        var res = null;
        if (typeof data == 'object') {
            res = data;
        } else {
            res = JSON.decode(data);
        }

        if (res && res.success && res.result && res.result.preferences && res.result.preferences.syndicate == 2) {
            this._showFbPushDialog = true;
        }

        // It may happen that user is not signed in and try to like the
        // video. At that time we have to make a call to server to fetch user info
        // so that we can decide whether we want to show the first liked video message
        if (this.selectedVideo && this.selectedVideo.likingVideo) {
            // If we don't have to show the push to facebook dialog, then make the request to server
            // else we are going to make the call when user closes the push to facebook dialog.
            if (this._showFbPushDialog) {
                var oAlert = new $cwui.modalwin.FirstVideoLikedWindow();
                oAlert.bind('close', $.proxy(this._onPushToFacebookWindowClosed, this));
                oAlert.bind('visituserprofilepage', $.proxy(this._handleVisitingVideoPageRequested, this));
                oAlert.show();
            } else {
                if (!this.selectedVideo.liked) {
                    $cws.WatchlrRequests.sendVideoLikedRequest($.proxy(this._onVideoLiked, this), this.selectedVideo.url);
                    /*$kat.track('Video', 'LikeVideoClk', {
                        campaign: window.location.host
                    });*/
                } else {
                    $cws.WatchlrRequests.sendVideoUnlikedRequest($.proxy(this._onVideoLiked, this), this.selectedVideo.url);
                    /*$kat.track('Video', 'UnlikeVideoClk', {
                        campaign: window.location.host
                    });*/
                }
            }
        }
    },

    _onVideosInfoReceived: function(data) {
        var res = null;
        if (typeof data == 'object') {
            res = data;
        } else {
            res = JSON.decode(data);
        }

        // this.debug("Received video info:" + str);

        if (res && res.success && res.result) {
            if (res.result.videos && res.result.videos.length > 0) {
                for (var i = 0; i < res.result.videos.length; i++) {
                    var videoInfo = res.result.videos[i];
                    if (typeof videoInfo.id == 'number') {
                        var videoIndex = videoInfo.id - 1;
                        if (typeof videoInfo.liked == 'boolean') {
                            this.videos[videoIndex].liked = videoInfo.liked;
                        }

                        if (typeof videoInfo.saved == 'boolean') {
                            this.videos[videoIndex].saved = videoInfo.saved;
                        }

                        if (typeof videoInfo.likes == 'number') {
                            this.videos[videoIndex].likes = videoInfo.likes;
                        }

                        if (typeof videoInfo.saves == 'number') {
                            this.videos[videoIndex].saves = videoInfo.saves;
                        }
                    }
                }
            }

            if (res.result.user && res.result.user.preferences && res.result.user.preferences.syndicate == 2) {
                this._showFbPushDialog = true;
            }
        }
    }

});
