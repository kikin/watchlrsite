/**
 * @package com.watchlr.hosts.google.adapters
 */
$cwh.adapters.KikinVideoAdapter.extend("com.watchlr.hosts.google.adapters.KikinVideoAdapter", {}, {

    numberOfVideoElementCandidates: 0,
    viewerPageContainer : null,
    sameDirContainer : null,

	/* @override */
	attach: function() {
        if (window.location.href.match(/^http:\/\/www\.google\.com\/reader\/.*/)) {
            // this.debug("Called in google reader implementation.");
            this.viewerPageContainer = $("#viewer-page-container");
            if (this.viewerPageContainer) {
                this._applyPageModifyEvent(this.viewerPageContainer);
            }

            this.sameDirContainer = $("#entries");
            if (this.sameDirContainer) {
                this._applyPageModifyEvent(this.viewerPageContainer);
            }
        }

        this._super();
	},

    _applyPageModifyEvent: function(container) {
        if (container) {
            if (window.document.body.addEventListener) {
                window.document.body.addEventListener('DOMNodeInserted', $.proxy(this._firePageModifiedEvent, this), false);
            } else {
                $($(container).parent().get(0)).scroll($.proxt(this._firePageModifiedEvent, this));
                $(document.body).bind("mousewheel", $.proxy(this._firePageModifiedEvent, this));
                var nextEntryButton = $("#entries-down");
                $(nextEntryButton).click($.proxy(this._firePageModifiedEvent, this));
            }
        }
    },

    _firePageModifiedEvent: function() {
        try {
            // this.debug("google reader page modified event fired.");
            var target = null;
            // this.debug("ViewerPageContainer display style:" + $(this.viewerPageContainer).getStyle('display'));
            if (this.viewerPageContainer && $(this.viewerPageContainer).css('display') != "none") {
                target = $(this.viewerPageContainer);
            } else if (this.sameDirContainer) {
                target = $(this.sameDirContainer);
            }

            if (target) {
                // this.debug("Tagrget in _firePageModifiedEvent:" + target);
                var flashVideoCandidatesLength = $(target).find("iframe").length +
                                                 $(target).find("object").length +
                                                 $(target).find("embed").length;
                if (flashVideoCandidatesLength > this.numberOfVideoElementCandidates) {
                    var embeds = this._findFlashVideoCandidates();
                    if (embeds) {
                        this._findFlashVideos(embeds);
                    }
                }
            }
        } catch (e) {
            alert("From: on page scroll on google reader. \nReason: " + e);
            // $kat.trackError({from: 'on page scroll on google reader', msg: '', exception: e});
        }
    },

    /**
    * find all the videos on the page
    */
    _findFlashVideoCandidates: function() {
        var embeds = [];
        if (window.location.href.match(/^http:\/\/www\.google\.com\/reader\/.*/)) {
            // this.debug("Finding flash video candidates in google reader implementation.");
            var target = null;
            if (this.viewerPageContainer && $(this.viewerPageContainer).css('display') != "none") {
                target =  $(this.viewerPageContainer);
            } else if (this.sameDirContainer) {
                target = $(this.sameDirContainer);
            }

            if (target) {
                var embed_tags = $(target).find('embed');
                // this.debug('Found ' + embed_tags.length + ' embeds');
                for (var i = 0; i < embed_tags.length; i++) {
                    embeds.push(embed_tags[i]);
                }

                var objects = $(target).find('object');
                // this.debug('Found ' + objects.length + ' objects');
                for (var i = 0; i < objects.length; i++) {
                    if (!/<embed/i.test(objects[i].innerHTML) || (!/<object/i.test(objects[i].innerHTML))) {
                        embeds.push(objects[i]);
                    }
                }

                var iframes = $(target).find('iframe');
                // this.debug('Found ' + iframes.length + ' iframes');
                for (var i = 0; i < iframes.length; i++) {
                    embeds.push(iframes[i]);
                }

                this.numberOfVideoElementCandidates = (iframes.length + objects.length + embed_tags.length);
            }
        } else {
            // look the page for video images
            $('#res li.videobox a img[id*=vidthumb]').each($.proxy(this._addKikinVideoBorder, this));
            //single video result - http://www.google.com/search?hl=en&q=ducati+696
            $('#res table a img[id*=vidthumb]').each($.proxy(this._addKikinVideoBorder, this));

            embeds = this._super();
        }

        return embeds;
    },

    _addKikinVideoBorder: function(pos, img) {
        try {
            this.debug("Creating kikin border for img:" + img);
            var videoUrl = this.getVideoUrl(img);
            this.debug("URL for image element:" + videoUrl);
            if (videoUrl) {
                for (var i = 0; i < this.services.length; i++) {
                    if (!this.services[i].url_regex)
                        continue;
                    var match = {passed: false};
                    this._extractId(videoUrl, this.services[i].url_regex, match);
                    if (match.passed && match.video_id && match.video_id.length > 1) {
                        if (typeof(this.services[i].url) == 'function') {
                            videoUrl = this.services[i].url(match.video_id);
                        } else {
                            videoUrl = this.services[i].url + match.video_id[1];
                        }

                        if (videoUrl) {
                            var imgParent = $(img).parents('td').get(0);
                            $(imgParent).mouseover($.proxy(this._onVideoThumbnailMouseOver, this));
                            $(imgParent).mouseleave($.proxy(this._onVideoThumbnailMouseOut, this));


                            var video = {
                                url                 : videoUrl,
                                mouseover           : null,
                                mouseout            : null,
                                saved               : false,
                                videoSelected       : false,
                                saveButtonSelected  : false,
                                coordinates         : null
                            };

                            // calculate the videoId
                            img.kikinVideoId = (this.videos.length + 1);
                            this.videos.push(video);
                            break;
                        }
                    }
                }
            }
        } catch (err) {
            alert("From: addKikinVideoBorder of Google Video adapter. \nReason: " + err);
        }
    },

    getVideoUrl: function(img) {
        var imgParentTable = null;

		if(imgParentTable = $(img).parent('a').get(0)) {
            var url = imgParentTable.href,
                videoUrl = /url\?url=(.*)&rct=/i.exec(url);
            if (videoUrl && videoUrl.length > 1) {
                return decodeURIComponent(videoUrl[1]);
            }
        }

		return null;
    },

    _onVideoThumbnailMouseOver : function(e) {
        try {
            var target = $($(e.target).parents('table').get(0)).find('td a img');
            target = target.get(0);
            this.debug("Mouseover target kikin video id:" + target.kikinVideoId);
            if (target && target.kikinVideoId) {

                var selectedVideo = this.videos[target.kikinVideoId - 1];

                // if selected video is different than the video saved in the object
                // hide the saved object video if it is visible
                if (this.selectedVideo && (this.selectedVideo != selectedVideo)) {
                    // this.kikinVideoBorder.style.visibility = "hidden";
                    $(this.kikinVideoBorder).fadeOut();
                    this.selectedVideo.videoSelected = false;
                    this.selectedVideo.shareButtonSelected = false;
                }

                // set the new selected video
                this.selectedVideo = selectedVideo;

                // calculate the coordinates for video
                selectedVideo.coordinates = this._getVideoCoordinates($(target).parents('table').get(0));

                if (selectedVideo.coordinates) {
                    this.debug("Coordinates for video:" + selectedVideo.coordinates.left + ", " + selectedVideo.coordinates.top + ", " + selectedVideo.coordinates.width + ", " + selectedVideo.coordinates.height);
                    // draw the border around video
                    this._drawKikinBorder(selectedVideo.coordinates.left,
                                          selectedVideo.coordinates.top,
                                          selectedVideo.coordinates.width,
                                          selectedVideo.coordinates.height,
                                          selectedVideo.saved);
                }

                // this.debug("Border around selected video is visible: " + this.kikinVideoBorder.style.visibility);
                selectedVideo.videoSelected = true;

            }
        } catch (err) {
            alert("From: _onVideoThumbnailMouseOver of google's KikinVideoSearchAdapter.\nReason: " + err);
            // $kat.trackError({from: "_onVideoThumbnailMouseOver of google's KikinVideoSearchAdapter", exception:err});
        }
    },

    _onVideoThumbnailMouseOut : function(e) {
        try {
            var target = $($(e.target).parents('table').get(0)).find('td a img');
            target = target.get(0);
            this.debug("Mouseover target kikin video id:" + target.kikinVideoId);
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
                        //this.kikinVideoBorder.style.visibility = "hidden";
                    }
                }, this), 1000);
            }
        } catch (err) {
            alert("From: _onVideoThumbnailMouseOut of google's KikinVideoSearchAdapter.\nReason: " + err);
            // $kat.trackError({from: "_onVideoThumbnailMouseOut of google's KikinVideoSearchAdapter", exception:err});
        }
    }
});
