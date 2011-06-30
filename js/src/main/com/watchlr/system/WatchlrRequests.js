/**
 * @package com.watchlr.system
 */
$.Class.extend("com.watchlr.system.WatchlrRequests", {
    _WATCHLR_API_URL: 'http://www.watchlr.com/api/',

    sendSaveVideoRequest: function(_callback, _url) {
        var reqUrl = $cws.WatchlrRequests._WATCHLR_API_URL + 'add?callback=?';

        $.ajax({
          url: reqUrl,
          dataType: 'json',
          data: {'url': _url},
          success: _callback
        });
    },

    sendUserProfileRequest: function(_callback) {
        var reqUrl = $cws.WatchlrRequests._WATCHLR_API_URL + 'auth/profile?callback=?';

        $.ajax({
          url: reqUrl,
          dataType: 'json',
          success: _callback
        });
    },

    sendUpdateUserProfileRequest: function(_callback) {
        var reqUrl = $cws.WatchlrRequests._WATCHLR_API_URL + 'auth/profile?callback=?';

        $.ajax({
          url: reqUrl,
          dataType: 'json',
          data: {'notifications': '{"emptyq" : 0}'},
          success: _callback
        });
    },

    sendUpdateUserPreferenceRequest: function(_callback, pushToFacebook) {
        var reqUrl = $cws.WatchlrRequests._WATCHLR_API_URL + 'auth/profile?callback=?';

        $.ajax({
          url: reqUrl,
          dataType: 'json',
          data: {'preferences': '{"syndicate" : ' + pushToFacebook + '}'},
          success: _callback
        });
    },

    sendVideosInfoRequest: function(_callback, _videos) {
        var reqUrl = $cws.WatchlrRequests._WATCHLR_API_URL + 'info?callback=?';


        var _videosString = JSON.stringify(_videos, function(key, value) {
            if (typeof HTMLElement === "object") {
                if(value instanceof HTMLElement) {
                    return undefined;
                }
            } else {
                if (value && typeof value === "object" && value.nodeType === 1 && typeof value.nodeName==="string") {
                    return undefined;
                }
            }
            return value;
        }).replace(/\\\"/g, '\"');
        _videosString = _videosString.substr(1, _videosString.length - 2);
        if (_videosString.indexOf('[') != 0) {
            _videosString = '[' + _videosString + ']';
        }
        $.ajax({
          url: reqUrl,
          dataType: 'json',
          data: {'videos': _videosString},
          success: _callback
        });
    },

    sendVideoLikedRequest: function(_callback, _videoUrl) {
        var reqUrl = $cws.WatchlrRequests._WATCHLR_API_URL + 'like?callback=?';

        $.ajax({
          url: reqUrl,
          dataType: 'json',
          data: {'url': _videoUrl},
          success: _callback
        });
	},

    sendVideoUnlikedRequest: function(_callback, _videoUrl) {
        var reqUrl = $cws.WatchlrRequests._WATCHLR_API_URL + 'unlike?callback=?';

        $.ajax({
          url: reqUrl,
          dataType: 'json',
          data: {'url': _videoUrl},
          success: _callback
        });
	}
}, {});