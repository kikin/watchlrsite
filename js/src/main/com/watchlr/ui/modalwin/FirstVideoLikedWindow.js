/**
 * @package com.watchlr.ui.modalwin
 */

$cwui.modalwin.WatchlrIframeWindow.extend("com.watchlr.ui.modalwin.FirstVideoLikedWindow", {}, {
    _checked: false,

    create: function() {
        this._super({
            parentWindow: window
        });

        $(this.getBody()).attr('id', 'video-liked-window');
        this.setContent($cws.html['FirstVideoLikedWindow']);
        $cwutil.Styles.insert('FirstVideoLikedWindowStyles', this.getDocument());

        $(this.getElement('a.close-button')).click($.proxy(this._onCloseCallback, this));
        $(this.getElement('a.ok-button')).click($.proxy(this._onOkCallback, this));
        $(this.getElement('#user-profile')).click($.proxy(this._onVisitUserProfilePageCallback, this));
        $(this.getElement('#fb-push-message')).click($.proxy(this._onFacebookPushMessageClicked, this));
    },
    
    show: function() {
    	this._super();
        this.setSize(420, 222);
        this.trigger('show');
    },

    _onCloseCallback: function () {
        this.hide();
        this.trigger('close', [false]);
    },

    _onOkCallback: function () {
        this.hide();
        this.trigger('close', [this._checked]);
    },

    _onFacebookPushMessageClicked: function(e) {
        this._checked = e.target.checked;
    },

    _onVisitUserProfilePageCallback: function() {
        this.trigger('visituserprofilepage');
    }
    
});
