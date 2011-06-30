/**
 * @package com.watchlr.ui.modalwin
 */

$cwui.modalwin.WatchlrIframeWindow.extend("com.watchlr.ui.modalwin.VideoSavedWindow", {}, {
    _checked: false,

    create: function() {
        this._super({
            parentWindow: window
        });

        $(this.getBody()).attr('id', 'video-saved-window');
        this.setContent($cws.html['VideoSavedWindow']);
        $cwutil.Styles.insert('VideoSavedWindowStyles', this.getDocument());

        $(this.getElement('a.close-button')).click($.proxy(this._onCloseCallback, this));
        $(this.getElement('a.ok-button')).click($.proxy(this._onOkCallback, this));
        $(this.getElement('#video-page')).click($.proxy(this._onVisitUserProfilePageCallback, this));
        $(this.getElement('#show-message')).click($.proxy(this._onShowMessageClicked, this));
    },
    
    show: function() {
    	this._super();
        this.setSize(375, 230);
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

    _onShowMessageClicked: function(e) {
        this._checked = e.target.checked;
    },

    _onVisitUserProfilePageCallback: function() {
        this.trigger('visituserprofilepage');
    }
    
});
