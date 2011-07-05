/**
 * @package com.watchlr.ui.modalwin
 */

$cwui.modalwin.WatchlrIframeWindow.extend("com.watchlr.ui.modalwin.FacebookConnectWindow", {}, {
    _windowToBeCenteredToElem: null,

    create: function(elem) {
        if (elem) {
            this._windowToBeCenteredToElem = elem;
        }
        this._super({
			parentWindow: window
		});

        $(this.getBody()).attr('id', 'facebook-connect-window');
        this.setContent($cws.html['FacebookConnectWindow']);
        $cwutil.Styles.insert('FacebookConnectWindowStyles', this.getDocument());

        $(this.getElement('a.closeButton')).click($.proxy(this._onCloseCallback, this));
        $(this.getElement('a.watchlr-fb-connect')).click($.proxy(this._onConnectCallback, this));
        $(this.getElement('#facebook-sign-in')).click($.proxy(this._onConnectCallback, this));
        $(this.getElement('#video-page')).click($.proxy(this._onVisitUserProfilePageCallback, this));
    },

    show: function() {
        this.setSize(375, 185);
        this._super();
        this.trigger('show');
    },

    _onCloseCallback: function () {
        this.hide();
        this.trigger('close');
    },

    _onConnectCallback: function() {
        this.hide();
        this.trigger('connect');
    },

    _onVisitUserProfilePageCallback: function() {
        this.trigger('visituserprofilepage');
    }

});