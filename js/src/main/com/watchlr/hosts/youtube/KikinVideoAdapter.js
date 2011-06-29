/**
 * @package com.watchlr.hosts.youtube.adapters
 */
$cwh.adapters.KikinVideoAdapter.extend("com.kikin.hosts.youtube.adapters.KikinVideoAdapter", {}, {

	/* @override */
	attach: function() {
        this._super();
	},

    _findVideoUrl: function(embed) {
        try {
            var videoUrl = this.parent(embed);
            if (!videoUrl) {
                var videoId = this._getNodeValue(embed, 'data-youtube-id');
                if (videoId) {
                    videoUrl = 'http://www.youtube.com/watch?v=' + videoId;
                }
            }

            return videoUrl;
        } catch (err) {
            alert("From: _findVideoUrl of youtube's KikinVideoAdapter.\nReason: " + err);
            // $kat.trackError({from: "_findVideoUrl of youtube's KikinVideoAdapter.", msg:"Error while finding video url for video tag.", exception:err});
        }

        return null;
    }
});