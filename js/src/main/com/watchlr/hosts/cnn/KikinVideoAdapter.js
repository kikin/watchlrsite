/**
 * @package com.watchlr.hosts.cnn.adapters
 */

$cwh.adapters.KikinVideoAdapter.extend("com.watchlr.hosts.cnn.adapters.KikinVideoAdapter", {}, {

	/* @override */
	attach: function() {
        //if (/cnn\.com\/video/.test(window.document.location.href)) {
            // this.debug("Hooking into cnn.com/video api");
            try {
                if (window.CVP && window.CVP.onCallback) {
                    // for (var i in window.CVP.instances) {
                        var original = window.CVP.onCallback;
                        window.CVP.onCallback = $.proxy(function(id, args) {
                            try {
                                if (args[0] == 'onContentBegin') {
                                    // alert('Video changed for video element: ' + id + ' and video id: ' + args[1]);
                                    this._onVideoUrlChange(id, args[1]);
                                }
                                return original(id, args);
                            } catch (e) {
                                this.debug("From: attach of cnn's KikinVideoAdapter.\nReason:" + e);
                                // $kat.trackError({from:"attach of cnn's KikinVideoAdapter", msg: "Unable to call cnn's original onContentBegin callback", exception:e});
                            }
                        }, this);
                    // }
                }

            } catch (err) {
                this.debug("From: attach of cnn's KikinVideoAdapter. \nReason:" + err);
                // $kat.trackError({from:"attach of cnn's KikinVideoAdapter", msg: "Unable to wrap onContentBegin callback", exception:err});
            }
        // }
        this._super();
	},

    /**
    * find all the videos on the page
    */
    /*_findFlashVideoCandidates: function() {
        var embeds = this._super();

        var images = $('img');
        // this.debug('Found ' + images.length + ' images');
        for (var i = 0; i < images.length; i++) {
            embeds.push(images[i]);
        }

        return embeds;
    },*/

    _onVideoUrlChange : function(target, videoId) {

        try {
            // this.debug('Changed video id:' + videoId + " for target:" + target.options.id);
            // alert('videos element exist: ' + this.videos);
            if (this.videos) {
                var embed = document.getElementById(target);
                // alert('embed: ' + embed + '\nkikin video id:' + embed.kikinVideoId);
                if (embed) {
                    if (embed.kikinVideoId) {
                        // this.debug("Video id associated with changed video target:" + embed.kikinVideoId);
                        this.videos[embed.kikinVideoId - 1].url = "http://www.cnn.com/video/?/video/" + videoId;
                        this.videos[embed.kikinVideoId - 1].saved = false;
                        this.videos[embed.kikinVideoId - 1].tracked = false;

                        this._videosFound = this.videos.length;
                        /*$kat.track('VideoAdapterEvt', 'SupportedVideoFound', {
                            campaign: window.location.host
                        });*/

                        new $cws.WatchlrRequests.sendVideosInfoRequest($.proxy(this._onVideosInfoReceived, this), this.videos);
                    } else {
                        this._addVideo(embed, "http://www.cnn.com/video/?/video/" + videoId);

                        if (this.videos.length > this._videosFound) {
                            this._videosFound = this.videos.length;
                            /*$kat.track('VideoAdapterEvt', 'SupportedVideoFound', {
                                campaign: window.location.host
                            });*/

                            //TODO: Enable this part for getting info

                            $cws.WatchlrRequests.sendVideosInfoRequest($.proxy(this._onVideosInfoReceived, this), this.videos);
                        }
                    }
                }
            }
        } catch (err) {
            // alert('CNN err:' + err);
            this.debug("From: _onVideoUrlChange of cnn's KikinVideoAdapter. \n Reason:" + err);
            // $kat.trackError({from:"_onVideoUrlChange of cnn's KikinVideoAdapter", msg: "Unable to change video URL on video change", exception:err});
        }
    }
});