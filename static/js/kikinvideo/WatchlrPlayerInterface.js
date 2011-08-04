/**
 * Interface required by WatchlrPlayer SWF object to
 * fire events.
 */
window.WatchlrPlayerInterface = function(){

    /**
     * List of member variables and functions
     * that should not be exposed.
     */
    priv = {};

    /**
     * List of member variables and functions that
     * should be exposed.
     */
    pub = {};

    /** currently playing video.*/
    priv._currentVideoItemIndex = null;

    /** watchlr player. */
    priv._watchlrPlayer = null;

    /** get the video info using the given id. */
    pub._getVideoIndex = function(vid) {
        for (var i = 0; i < UI.videoList.length; i++) {
            if (UI.videoList[i].id == vid) {
                return i;
            }
        }

        return null;
    };

    priv._removeVideo = function(idx) {
        UI.videoList.splice(idx, 1);
    };

    /** returns the watchlr player object. */
    priv._getWatchlrPlayer = function() {
        return $('#WatchlrPlayer').get(0);
    };

    /**
     * function get called when watchlr player loads
     */
    pub.onLoad = function() {
        // initialize this object every time
        // this object gets changed when user changes the tab.
        priv._watchlrPlayer = priv._getWatchlrPlayer();

        // we cannot play the video until watchlr player is
        // initialized. now we should play the video.
        if (priv._watchlrPlayer && typeof priv._currentVideoItemIndex == "number") {
            priv._watchlrPlayer.setSource(UI.videoList[priv._currentVideoItemIndex].embed);
        }
    };

    /**
     * function get called when video starts playing
     *
     * this event will get fired when
     * .    at the start of video.
     * .    when user clicks on the play button.
     * .    video start playing after pause (video may get paused because buffering is slow).
     *
     */
    pub.onVideoPlaying = function() {

    };

    /**
     * function get called when video get paused.
     *
     * this event will get fired when user clicks on the pause button.
     *
     * @param pauseTime - time at which video paused
     */
    pub.onVideoPaused = function(pauseTime) {
        $.get('/api/seek/' + UI.videoList[priv._currentVideoItemIndex].id + '/' + pauseTime);
    };

    /**
     * function get called on video progress change.
     *
     * NOTE: this function is not working for youtube videos. Fix it in SWF object.
     * 
     * @param bytes
     * @param bytesTotal
     */
    pub.onLoadProgressChange = function(bytes, bytesTotal) {

    };

    /**
     * function get called when current time changes for the video.
     *
     * NOTE: this function is not working for youtube videos. Fix it in SWF object.
     *
     * @param currentTime - current time
     */
    pub.onCurrentTimeChange = function(currentTime) {

    };

    /**
     * function get called when user seeks the video forward
     *
     * NOTE: this function is not working properly. Fix it in swf object
     */
    pub.onSeekStart = function() {
            
    };


    /**
     * function get called when user video reaches to the seek point
     *
     * NOTE: this function is not working properly. Fix it in swf object
     */
    pub.onSeekEnd = function() {

    };

    /**
     * function get called when current playing video finishes playing
     */
    pub.onVideoFinished = function() {
        pub.playNext();
    };

    /**
     * function get called when watchlr player cannot play the video.
     */
    pub.onPlaybackError = function() {
        pub.playNext();
        trackErrorEvent('VideoPlaybackError', UI.videoList[priv._currentVideoItemIndex].host)
    };

    /**
     * play the video with given video id
     *
     * @param vid - video id
     */
    pub.play = function(vid) {
        // set the currently playing video item if vid is provided
        // JS fails the if condition if vid is 0. that's why we have to do this way.
        if (vid != undefined && vid != null && typeof vid == "number") {
            priv._currentVideoItemIndex = pub._getVideoIndex(vid);
            trackAction('view', vid);
        }


        if (typeof priv._currentVideoItemIndex == "number") {
            $('#video-player-title').html(UI.videoList[priv._currentVideoItemIndex].title);
            $('#player-video-description').html(UI.videoList[priv._currentVideoItemIndex].description);
            $('#player-video-source-image').attr('src', UI.videoList[priv._currentVideoItemIndex].faviconURl);

            $('#video-player-title').show();
            $('#player-video-description').show();
            $('#player-video-source-image').show();

            if (priv._watchlrPlayer && priv._watchlrPlayer.setSource) {
                priv._watchlrPlayer.setSource(UI.videoList[priv._currentVideoItemIndex].embed);
            }
        }


    };

    /**
     * plays the previous video in the list
     */
    pub.playPrev = function() {
        if (priv._currentVideoItemIndex - 1 > -1) {
            priv._currentVideoItemIndex--;
            pub.play();
            trackAction('leanback-view', UI.videoList[priv._currentVideoItemIndex].id);
        }
    };

    /**
     * plays the next video in the list.
     */
    pub.playNext = function() {
        if (priv._currentVideoItemIndex + 1 < UI.videoList.length) {
            priv._playNext();
        } else {
            if (activeView != VIEWS.profile) {
                home.loadMoreVideos(priv._playNext);
            }
        }
    };

    priv._playNext = function() {
        if (priv._currentVideoItemIndex + 1 < UI.videoList.length) {
            priv._currentVideoItemIndex++;
            pub.play();
            trackAction('leanback-view', UI.videoList[priv._currentVideoItemIndex].id);
        }
    };

    /**
     * returns the videos host URL.
     */
    pub.getVideoHostUrl = function() {
        return UI.videoList[priv._currentVideoItemIndex].host;
    };

    /**
     * removes video from list
     */
    pub.removeVideo = function(vid) {
        if (vid != undefined && vid != null && typeof vid == "number") {
            var idx = pub._getVideoIndex(vid);
            if (typeof idx == "number" && idx != -1) {
                priv._removeVideo(idx);
                return idx;
            }
        }
        return null;
    };

    return pub;
}();
