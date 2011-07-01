/**
 * @package com.watchlr.hosts.foxsports.adapters
 */
$cwh.adapters.KikinVideoAdapter.extend("com.watchlr.hosts.foxsports.adapters.KikinVideoAdapter", {}, {

	/* @override */
	attach: function() {
        // this.debug("Hooking into msn.foxsports.com video api");
        try {
            if (window.Player && window.Player.OnVideoTitle) {
                var original = window.Player.OnVideoTitle;
                window.Player.OnVideoTitle = $.proxy(function() {
                    try {
                        if (arguments.length >= 2) {
                            // Original parameters are, text and id
                            this._onVideoUrlChange(arguments[1]);
                            original.apply(this, arguments);
                        }
                    } catch (e) {
                        alert("From: attach of fox sports KikinVideoAdapter. \nReason: " + e);
                        // $kat.trackError({from:"attach of fox sports KikinVideoAdapter", msg: "Unable to call fox sports original Player.OnVideoTitle function", exception:e});
                    }
                }, this);
            }

        } catch (err) {
            alert("From: attach of fox sports KikinVideoAdapter. \nReason: " + err);
            //$kat.trackError({from:"attach of fox sports KikinVideoAdapter", msg: "Unable to wrap Player.OnVideoTitle function", exception:err});
        }

        this.parent();
	},

    _findVideoUrl: function(embed) {
        var src = this._getNodeValue(embed, 'src') || this._getNodeValue(embed, 'data');

        if (src.indexOf('/') == 0) {
            src = this._qualifyURL(src);
        } else if (src.indexOf('http://') == -1) {
            src = this._qualifyURL('/' + src);
        }

        var videoUrl = "";
        // this.debug("Source is:" + src);
        if (src && (src.indexOf('video.s-msn.com') != -1) && embed.vidGetId) {
            videoUrl = "http://msn.foxsports.com/video/?vid=" + embed.vidGetId();
        }

        return videoUrl;
    },

    _onVideoUrlChange : function(videoId) {
        try {
            // this.debug("Video Id found:" + videoId);
            if (this.videos && (this.videos.length == 1)) {
                var embed = $('Player1').get(0);
                var vid = null;
                if (embed.vidGetId) {
                    vid = embed.vidGetId();
                } else {
                    vid = videoId;
                }

                if (vid) {
                    this.videos[0].url = "http://msn.foxsports.com/video/?vid=" + vid;
                    this.videos[0].saved = false;
                    this.videos[0].tracked = false;

                    this._videosFound = this.videos.length;
                    /*$kat.track('VideoAdapterEvt', 'SupportedVideoFound', {
                        campaign: window.location.host
                    });*/

                    new $cws.WatchlrRequests.sendVideosInfoRequest($.proxy(this._onVideosInfoReceived, this), this.videos);
                }
            }
        } catch (err) {
            alert("From: _onVideoUrlChange of fox sports KikinVideoAdapter. \nReason:" + err);
            //$kat.trackError({from:"_onVideoUrlChange of fox sports KikinVideoAdapter", msg: "Unable to change video URL on video change", exception:err});
        }
    }
});