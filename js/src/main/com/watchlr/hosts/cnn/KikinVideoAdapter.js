/**
 * @package com.watchlr.hosts.cnn.adapters
 */

$cwh.adapters.KikinVideoAdapter.extend("com.watchlr.hosts.cnn.adapters.KikinVideoAdapter", {}, {

	/* @override */
	attach: function() {
        //if (/cnn\.com\/video/.test(window.document.location.href)) {
            // this.debug("Hooking into cnn.com/video api");
            try {
                if (window.CVP && window.CVP.instances) {
                    for (var i in window.CVP.instances) {
                        var original = window.CVP.instances[i].onContentBegin;
                        window.CVP.instances[i].onContentBegin = $.proxy(function() {
                            try {
                                this._onVideoUrlChange(window.CVP.instances[i], arguments[0]);
                                return original.apply(this, arguments);
                            } catch (e) {
                                alert("From: attach of cnn's KikinVideoAdapter.\nReason:" + e);
                                // $kat.trackError({from:"attach of cnn's KikinVideoAdapter", msg: "Unable to call cnn's original onContentBegin callback", exception:e});
                            }
                        }, this);
                    }
                }

            } catch (err) {
                alert("From: attach of cnn's KikinVideoAdapter. \nReason:" + err);
                // $kat.trackError({from:"attach of cnn's KikinVideoAdapter", msg: "Unable to wrap onContentBegin callback", exception:err});
            }
        // }
        this._super();
	},

    /**
    * find all the videos on the page
    */
    _findFlashVideoCandidates: function() {
        var embeds = this._super();

        var images = $('img');
        // this.debug('Found ' + images.length + ' images');
        for (var i = 0; i < images.length; i++) {
            embeds.push(images[i]);
        }

        return embeds;
    },

    _onVideoUrlChange : function(target, videoId) {
        try {
            // this.debug('Changed video id:' + videoId + " for target:" + target.options.id);
            if (this.videos) {
                var embed = $('#' + target.options.id);
                if (embed && embed.kikinVideoId) {
                    // this.debug("Video id associated with changed video target:" + embed.kikinVideoId);
                    this.videos[embed.kikinVideoId - 1].url = "http://www.cnn.com/video/?/video/" + videoId;
                    this.videos[embed.kikinVideoId - 1].saved = false;
                    this.videos[embed.kikinVideoId - 1].tracked = false;

                    this._videosFound = this.videos.length;
                    /*$kat.track('VideoAdapterEvt', 'SupportedVideoFound', {
                        campaign: window.location.host
                    });*/

                    new $cws.WatchlrRequests.sendVideosInfoRequest($.proxy(this._onVideosInfoReceived, this), this.videos);
                }
            }
        } catch (err) {
            alert("From: _onVideoUrlChange of cnn's KikinVideoAdapter. \n Reason:" + err);
            // $kat.trackError({from:"_onVideoUrlChange of cnn's KikinVideoAdapter", msg: "Unable to change video URL on video change", exception:err});
        }
    }
});