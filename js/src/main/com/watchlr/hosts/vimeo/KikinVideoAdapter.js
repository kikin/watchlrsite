/**
 * @package com.watchlr.hosts.vimeo.adapters
 */
$cwh.adapters.KikinVideoAdapter.extend("com.watchlr.hosts.vimeo.adapters.KikinVideoAdapter", {}, {

	/* @override */
	attach: function() {
        this._super();
	},

    _findFlashVideos: function(embeds) {
        try {
            this._super(embeds);
            if (this.videos && (this.videos.length == 0)) {
                var div = $('.a').get(0);
                // this.debug('Found div for video:' + div);
                if (div) {
                    var divParent = $(div.parentNode);
                    // this.debug('Found video div parent:' + divParent + " with id:" + divParent.id)
                    if (divParent && divParent.id) {
                        var videoId = /player_([0-9]+)_[0-9]+/i.exec(divParent.id);
                        if (videoId && videoId.length > 1)
                            videoId = videoId[1];
                        // this.debug('Found video ID:' + videoId);
                        if (videoId) {
                            div.kikinVideoId = (this.videos.length + 1);
                            $(div).mouseenter($.proxy(this._onVideoThumbnailMouseOver, this));
                            $(div).mouseleave($.proxy(this._onVideoThumbnailMouseOut, this));
                            var videoUrl = 'http://www.vimeo.com/' + videoId;
                            this._addVideo(div, videoUrl);
                        }
                    }
                }
            }

            if (this.videos.length > this._videosFound) {
                this._videosFound = this.videos.length;
                /*$kat.track('VideoAdapterEvt', 'SupportedVideoFound', {
                    campaign: $win.location.host
                });*/

                new $ks.WatchlrtRequests.sendVideosInfoRequest($.proxy(this._onVideosInfoReceived, this), this.videos);

            }
        } catch (err) {
            // alert("From: _findFlashVideos of vimeo's KikinVideoAdapter..\nReqason: " + err);
            // $kat.trackError({from: "_findFlashVideos of vimeo's KikinVideoAdapter.", exception:err});
        }
    },

    _hasClassName: function(target, classname) {
        var classnames = $(target).attr('class');
        if (classnames) {
            var classnamesarray = classnames.split();
            for (var i = 0; i < classnamesarray.length; i++) {
                // this.debug('class names found:' + classnamesarray);
                if (classname == classnamesarray[i].toLowerCase())
                    return true;
            }
        }

        return false;
    },

    _onVideoThumbnailMouseOver: function(e) {
        try {
            var target = $(e.target);
            while (target && !this._hasClassName(target, 'a')) {
                target = $(target.parentNode);
            }

            if (target && target.kikinVideoId) {
                // this.debug("Target's kikin video id:" + target.kikinVideoId);
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

                // if border is not visible, then draw the border
                var kikinBorderVisibility = $(this.kikinVideoBorder).css('display');
                // this.debug("CSS border is visible:" + kikinBorderVisibility);
                if (!kikinBorderVisibility || kikinBorderVisibility == 'none') {
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
                }

                // this.debug("Border around selected video is visible: " + this.kikinVideoBorder.style.visibility);
                selectedVideo.videoSelected = true;
            }
        } catch (err) {
            // alert("From: _onVideoThumbnailMouseOver of vimeo's KikinVideoAdapter.\nReason:" + err);
            // $kat.trackError({from: "_onVideoThumbnailMouseOver of vimeo's KikinVideoAdapter.", exception:err});
        }
    },

    _onVideoThumbnailMouseOut: function(e) {
        try {
            var target = $(e.target);
            while (target && !this._hasClassName(target, 'a')) {
                target = $(target.parentNode);
            }

            if (target && target.kikinVideoId) {
                // this.debug("Target's kikin video id:" + target.kikinVideoId);

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
                        // this.kikinVideoBorder.style.visibility = "hidden";
                        $(this.kikinVideoBorder).fadeOut();
                    }
                }, this), 1000);
            }
        } catch (err) {
            // alert("From: _onVideoThumbnailMouseOut of vimeo's KikinVideoAdapter.\nReason:" + err);
            // $kat.trackError({from: "_onVideoThumbnailMouseOut of vimeo's KikinVideoAdapter.", exception:err});
        }
    }
});