/**
 * @package com.watchlr.hosts.yahoo.adapters
 */
$cwh.adapters.KikinVideoAdapter.extend("com.watchlr.hosts.yahoo.adapters.KikinVideoAdapter", {}, {
	/* @override */
	attach: function() {
        this._super();
	},

    _findFlashVideoCandidates: function() {
        $('ul.c-thumb.video li').each($.proxy(this._addKikinVideoBorder, this));
        return this._super();
    },

    _addKikinVideoBorder: function(pos, img) {
        try {
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
                            $(img).mouseover($.proxy(this._onVideoThumbnailMouseOver, this));
                            $(img).mouseleave($.proxy(this._onVideoThumbnailMouseOut, this));


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
            alert("From: addKikinVideoBorder of Yahoo Video adapter. \nReason: " + err);
        }
    },

    getVideoUrl: function(videoDiv) {
        // try to get the link
        var link = $(videoDiv).find('a');
        if(link) {
            // get rurl parameter
            var href = decodeURIComponent($(link).attr('href')),
                    params = href.parseQueryString(),
                    url = (params && params.rurl) ? params.rurl.replace(/&amp;/g, '&') : null;
            return url;
        }
        alert(link);
        return null;
    },

    _onVideoThumbnailMouseOver : function(e) {
        try {
            var target = e.target;
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
                selectedVideo.coordinates = this._getVideoCoordinates(target);

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
            var target = e.target;
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