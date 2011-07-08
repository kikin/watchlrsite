/**
 * @package com.watchlr.ui.modalwin
 */

$cwui.modalwin.WatchlrIframeWindow.extend("com.watchlr.ui.modalwin.AlertWindow", {}, {
    _title: "",
    _description: "",

    init: function(title, description) {
        this._title = title;
        this._description = description;
        this._super();
    },

    create: function() {
        var elem = $('#watchlr_alert_window');
        if (elem) {
            this._super({
                parentWindow: window
            });

            $(this.getElement()).attr('id', 'watchlr_alert_window');
            $(this.getBody()).attr('id', 'watchlr-alert-window');
            this.setContent($cws.html['AlertWindow']);
            $cwutil.Styles.insert('AlertWindowStyles', this.getDocument());
        } else {
            this._element = $('#watchlr_alert_window');
            this._win = this._element.contentWindow;
            this._doc = this._element.contentWindow.document;
            this._topDoc = top.document;
            this._body = this._doc.body;
        }

        $(this.getElement('a.watchlr-close-button')).click($.proxy(this._onCloseCallback, this));
        $(this.getElement('a.watchlr-ok-button')).click($.proxy(this._onCloseCallback, this));

        $(this.getElement('.watchlr-description')).html(this._description);
        $(this.getElement('.watchlr-title')).html(this._title);
    },

    show: function() {
        this.setSize(315, 140);
        this._super();
        this.trigger('show');
    },

    _onCloseCallback: function () {
        this.hide();
        this.trigger('close');
    }
});