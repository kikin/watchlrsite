/**
 * @package com.kikin.hosts.espn.adapters
 */

$cwh.adapters.KikinVideoAdapter.extend("com.watchlr.hosts.espn.adapters.KikinVideoAdapter", {}, {

	/* @override */
	attach: function() {
        // this.debug("Hooking into espn.go.com video api");
        try {
            var original = window.espn.video.play;
            window.espn.video.play = $.proxy(function() {
                try {
                    if (arguments.length > 0) {
                        this._onVideoUrlChange(arguments[0]);
                        original.apply(this, arguments);
                    }
                } catch (e) {
                    alert("From: attach of espn's KikinVideoAdapter. \nReason:" + e);
                    // $kat.trackError({from:"attach of espn's KikinVideoAdapter", msg: "Unable to call espn's original espn.video.play function", exception:e});
                }
            }, this);
        } catch (err) {
            alert("From: attach of espn's KikinVideoAdapter. \nReason:" + err);
            // $kat.trackError({from:"attach of espn's KikinVideoAdapter", msg: "Unable to wrap espn.video.play function", exception:err});
        }

        this._super();
	},

    _onVideoUrlChange : function(videoId) {
        try {
            // this.debug("Video Id found:" + videoId);
            if (this.videos && (this.videos.length == 1)) {
                this.videos[0].url = "http://espn.go.com/video/clip?id=" + videoId;
                this.videos[0].saved = false;
                this.videos[0].tracked = false;

                this._videosFound = this.videos.length;
                /*$kat.track('VideoAdapterEvt', 'SupportedVideoFound', {
                    campaign: $win.location.host
                });*/

                new $cws.WatchlrRequests.sendVideosInfoRequest($.proxy(this._onVideosInfoReceived, this), this.videos);

            } else {
                setTimeout($.proxy(function() {
                   var embeds = this._findFlashVideoCandidates();
                    if (embeds)
                        this._findFlashVideos(embeds);
                    if (this.videos && (this.videos.length == 1)) {
                        this.videos[0].url = "http://espn.go.com/video/clip?id=" + videoId;
                        this.videos[0].saved = false;
                        this.videos[0].tracked = false;
                    }
                }, this), 1000);
            }
        } catch (err) {
            alert("From: _onVideoUrlChange of espn's KikinVideoAdapter. \nReason:" + err);
            // $kat.trackError({from:"_onVideoUrlChange of espn's KikinVideoAdapter", msg: "Unable to change video URL on video change", exception:err});
        }
    }
});