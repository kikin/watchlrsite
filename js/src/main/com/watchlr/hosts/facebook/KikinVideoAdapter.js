/**
 * @package com.watchlr.hosts.facebook.adapters
 */
$cwh.adapters.KikinVideoAdapter.extend("com.watchlr.hosts.facebook.adapters.KikinVideoAdapter", {}, {
    videoAnchorTagsLength: 0,

	/* @override */
	attach: function() {
        try {
            // this.debug("Get called in Facebook video adapter.");
            if (window.document.body.addEventListener) {
                window.document.body.addEventListener('DOMNodeInserted', $.proxy(this._firePageModifiedEvent, this), false);
            } else {
                // setInterval(this._firePageModifiedEvent.bind(this), 1000);
                window.scroll($.proxy(this._firePageModifiedEvent, this));
                window.document.body.bind("mousewheel", $.proxy(this._firePageModifiedEvent, this));
            }

            this._super();
        } catch (err) {
            // this.debug("Error attaching to scroll events on facebook page. \nReason: " + err);
        }
	},

    _firePageModifiedEvent: function() {
        // this.debug("Page modified event fired.");
        var anchor_tags = $("a.uiVideoThumb");
        // this.debug("Number of video elements found:" + anchor_tags.length);
        // this.debug("Number of video elements already found:" + this.videoAnchorTagsLength);
        if (anchor_tags.length > this.videoAnchorTagsLength) {
            var embeds = this._findFlashVideoCandidates();
            if (embeds) {
                this._findFlashVideos(embeds);
            }
        }
    },

    /**
    * find all the videos on the page
    */
    _findFlashVideoCandidates: function() {
        try {
            var videoAnchors = [];
            var anchor_tags = $("a.uiVideoThumb");
            // this.debug('Found ' + anchor_tags.length + ' anchors');
            this.videoAnchorTagsLength = anchor_tags.length;

            $(anchor_tags).each($.proxy(function(index, elem) {
                if (elem.kikinVideoId != null) {
                    return;
                }

                var videoUrl = "";
                var anchorAjaxify = this._getNodeValue(elem, "ajaxify");
                // this.debug("Matching against: " + anchorAjaxify);

                var re = /ajax\/flash\/expand_inline\.php\?target_div=u[0-9]+_[0-9]+&share_id=([0-9]+)/;
                var result = re.exec(anchorAjaxify);
                if (result) {
                    // this.debug("Found with video id:" + result[1]);
                    videoUrl = "http://www.facebook.com/?video_id=" + result[1];
                } else {
                    re = /ajax\/flash\/expand_inline\.php\?target_div=u[0-9]+_[0-9]+&v=([0-9]+)/;
                    result = re.exec(anchorAjaxify);
                    if (result) {
                        // this.debug("Found with video id:" + result[1]);
                        videoUrl = "http://www.facebook.com/?video_id=" + result[1];
                    }
                }

                // this.debug("Videos object:" + this.videos.length);
                if (videoUrl) {
                    var video = {
                        url                 : videoUrl,
                        mouseover           : null,
                        mouseout            : null,
                        saved               : false,
                        videoSelected       : false,
                        saveButtonSelected  : false,
                        coordinates         : null,
                        parentNode          : $(elem).parent().get(0),
                        tracked             : false,
                        liked               : false,
                        likes               : 0,
                        saves               : 0,
                        id                  : (this.videos.length + 1)
                    };

                    // calculate the videoId
                    var videoId = video.id;
                    var anchorTagParent = $(elem).parent().get(0);

                    anchorTagParent.kikinVideoId = videoId;
                    elem.kikinVideoId = videoId;

                    // console.log('AnchorTag kikinVideoId:' + elem.kikinVideoId);

                    var anchorTagChildNodes = $(elem).children() ;
                    if (anchorTagChildNodes && anchorTagChildNodes.length > 0) {
                        for (var j = 0; j < anchorTagChildNodes.length; j++) {
                            $(anchorTagChildNodes[j]).kikinVideoId = videoId;
                        }
                    }

                    $(elem).click($.proxy(this._onVideoImageClicked, this));
                    $(elem).mouseenter($.proxy(this._onVideoThumbnailMouseOver, this));
                    $(elem).mouseleave($.proxy(this._onVideoThumbnailMouseOut, this));

                    this.videos.push(video);
                }
            }, this));

            if (this.videos.length > this._videosFound) {
                    this._videosFound = this.videos.length;
                    /*$kat.track('VideoAdapterEvt', 'SupportedVideoFound', {
                        campaign: $win.location.host
                    });*/

                    new $cws.WatchlrRequests.sendVideosInfoRequest($.proxy(this._onVideosInfoReceived, this), this.videos);
                }

                // this.debug("Number of videos found:" + this.videos.length);

        } catch (err) {
            // alert("From: findFlashVideoCandidates of facebook's KikinVideoAdapater. \nReason:" + err);
            // $kat.trackError({from: "findFlashVideoCandidates of facebook's KikinVideoAdapater.", msg: "Unable to find flash videos on facebook page.", exception:err});
        }
    },

    _onVideoImageClicked: function(e) {
        try {
            // hide the existing border, as image is going to be converted into
            // video element.
            $(this.kikinVideoBorder).fadeOut();
            try {
                var parentNode = this.selectedVideo.parentNode;
                if (parentNode.addEventListener) {
                    parentNode.addEventListener('DOMNodeInserted', $.proxy(this._onEmbedTagCreated, this), false);
                } else {
                    setTimeout($.proxy(this._fireOnVideoElementInserted, this), 500);
                }
            } catch (er) {
                // alert("OnImageClicked error: " + er);
            }
        } catch (err) {
            // alert("From: onVideoImageClicked of facebook's KikinVideoAdapater. \nReason:" + err);
            // $kat.trackError({from: "onVideoImageClicked of facebook's KikinVideoAdapater.", exception:err});
        }
    },

    _fireOnVideoElementInserted: function() {
        try{
            var parentNode = this.selectedVideo.parentNode;
            if ($(parentNode).find('iframe') || $(parentNode).find('object')) {
                this._onEmbedTagCreated();
            } else {
                setTimeout($.proxy(this._fireOnVideoElementInserted, this), 500);
            }
        } catch (err) {
            // alert("From: fireOnVideoElementInserted of facebook's KikinVideoAdapater. \nReason:" + err);
            // $kat.trackError({from: "fireOnVideoElementInserted of facebook's KikinVideoAdapater.", msg: "Unable to fire the event.", exception:err});
        }
    },

    _onEmbedTagCreated: function() {
        try {
            // this.debug("In onEmbedTagCreated.");
            if (this.selectedVideo) {
                var parentNode = this.selectedVideo.parentNode;
                // this.debug("Selected video id is:" + parentNode.kikinVideoId);

                var iframe = $(parentNode).find('iframe');
                if (iframe && iframe.length > 0) {
                    // this.debug('Iframe found');
                    iframe = iframe.get(0);
                    this._addMouseEvents(iframe);
                    iframe.kikinVideoId = parentNode.kikinVideoId;
                    this.selectedVideo.mouseover = iframe.onmouseover;
                    this.selectedVideo.mouseoout = iframe.onmouseout;
                    return;
                }

                var object = $(parentNode).find('object');
                if (object && object.length > 0) {
                    // this.debug('Object found');
                    object = object.get(0);
                    this._addMouseEvents(object);
                    object.kikinVideoId = parentNode.kikinVideoId;
                    this.selectedVideo.mouseover = object.onmouseover;
                    this.selectedVideo.mouseoout = object.onmouseout;
                    return;
                }

                var embed = $(parentNode).find('embed');
                if (embed && embed.length > 0) {
                    // this.debug('Embed found');
                    embed = embed.get(0);
                    this._addMouseEvents(embed);
                    embed.kikinVideoId = parentNode.kikinVideoId;
                    this.selectedVideo.mouseover = embed.onmouseover;
                    this.selectedVideo.mouseoout = embed.onmouseout;
                }
            }
        } catch (err) {
            // alert("From: onEmbedTagCreated of facebook's KikinVideoAdapater. \nReason:" + err);
            // $kat.trackError({from: "onEmbedTagCreated of facebook's KikinVideoAdapater.", exception:err});
        }
    },

    /**
     * retrieves the coordinates for the video
     * @param embed
     */
    _getVideoCoordinates: function(embed) {
        try {
            var videoWidth = embed.clientWidth || embed.width;
            if (!videoWidth) {
                videoWidth = this._getNodeValue(embed, 'width');
            }

            var videoHeight = embed.clientHeight || embed.height;
            if (!videoHeight) {
                videoHeight = this._getNodeValue(embed, 'height');
            }

            var parent = embed.offsetParent;
            var offsetLeft = embed.offsetLeft;
            var offsetTop = embed.offsetTop;

            while (parent && parent != window.document.body) {
                offsetLeft += parent.offsetLeft;
                offsetTop += parent.offsetTop;

                if ("UIImageBlock clearfix" == $(parent).attr('class')) {
                    try {
                        var profileImage = $(parent).find("a.actorPhoto");
                        if (profileImage && profileImage.length == 1) {
                            offsetLeft += $($(profileImage).get(0)).clientWidth + parseInt($(profileImage).get(0)).css('margin-right');
                        } else {
                            // this.debug("Cannot find the profile picture");
                        }
                    } catch (e) {
                        // this.debug(e);
                    }
                }
                parent = parent.offsetParent;
            }

            var coordinates = {
                left    : offsetLeft,
                top     : offsetTop,
                width   : videoWidth,
                height  : videoHeight
            };

            return coordinates;
        } catch (err) {
            // alert("From: getVideoCoordinates of facebook's KikinVideoAdapater. \nReason:" + err);
            //$kat.trackError({from: "getVideoCoordinates of facebook's KikinVideoAdapater.", exception:err});
        }

        return null
    },

    _onVideoThumbnailMouseOver : function(e) {
        // this.debug('Anchor tag parent mouse over');
        try {
            var target = e.target;
            if (target) {
                // this.debug('Target node type:' + e.target.nodeName.toLowerCase());

                while (target && target.nodeName.toLowerCase() != 'div') {
                    target = target.parentNode;
                    //this.debug('Target node type:' + target.nodeName.toLowerCase());
                }

                // this.debug("Target's kikin video id:" + target.kikinVideoId);
                if (target && target.kikinVideoId) {
                    var selectedVideo = this.videos[target.kikinVideoId - 1];

                    // if selected video is different than the video saved in the object
                    // hide the saved object video if it is visible
                    if (this.selectedVideo && (this.selectedVideo != selectedVideo)) {
                        $(this.kikinVideoBorder).fadeOut();
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
                                              selectedVideo.saved);
                    }

                    // this.debug("Border around selected video is visible: " + $(this.kikinVideoBorder).css('visibility'));
                    selectedVideo.videoSelected = true;
                }
            }
        } catch (err) {
            // alert("From: _onVideoThumbnailMouseOver of facebook's KikinVideoAdapter. \nReason:" + err);
            // $kat.trackError({from: "_onVideoThumbnailMouseOver of facebook's KikinVideoAdapter", exception:err});
        }
    },

    _onVideoThumbnailMouseOut : function(e) {
        // this.debug('Anchor tag parent mouse out');
        try {
            var target = e.target;
            if (target) {
                // this.debug('Target node type:' + target.nodeName.toLowerCase());
                while (target && target.nodeName.toLowerCase() != 'div') {
                    target = target.parentNode;
                    // this.debug('Target node type:' + target.nodeName.toLowerCase());
                }

                if (target && target.kikinVideoId) {
                    // set the selected video property to false
                    var selectedVideo = this.videos[target.kikinVideoId - 1];
                    selectedVideo.videoSelected = false;

                    // hide the border after a second
                    setTimeout($.proxy(function() {
                        var selectedVideo = this.selectedVideo;

                        // if mouse is not over the video or share button of the video
                        // hide the video
                        if (!selectedVideo.shareButtonSelected &&
                            !selectedVideo.videoSelected &&
                            !this.selectedVideo.savingVideo &&
                            !this.selectedVideo.likingVideo)
                        {
                            $(this.kikinVideoBorder).fadeOut();
                        }
                    }, this), 1000);
                }
            }
        } catch (err) {
            // alert("From: _onVideoThumbnailMouseOut of facebook's KikinVideoAdapter. \nReason:" + err);
            //$kat.trackError({from: "_onVideoThumbnailMouseOut of facebook's KikinVideoAdapter", exception:err});
        }
    }
});
