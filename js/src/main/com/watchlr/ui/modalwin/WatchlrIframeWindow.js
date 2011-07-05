/**
 * @package com.watchlr.ui.modalwin
 * 
 * Watchlr templated iframe window
*/

$.Class.extend("com.watchlr.ui.modalwin.WatchlrIframeWindow", {}, {
    _currentTemplateName: 'popup-flash-alert',
    _parentWindow: null,
    _element: null,
    _body: null,
    _win: null,
    _topDoc: null,
    _contentDiv: null,

    /** init function. */
    init: function() {
		// create the iframe
		this.create();
	},

    /** Create Iframe window. */
    create: function(options) {
        // get needed options
		this._parentWindow = options.parentWindow;

		var frame = this._parentWindow.document.createElement('iframe');
		frame.style.border = '0px';
		frame.style.width = '715px';
		frame.style.height = '500px';
		frame.style.position = 'fixed';
		frame.style.display = 'none';
		frame.style.overflow = 'hidden';
		frame.style.zIndex = '2147483647';
		frame.scrolling = 'no';
		frame.allowtransparency = 'true';
		frame.frameBorder = 0;
        this._parentWindow.document.body.appendChild(frame);
		try {
			// write the default content
			frame.contentWindow.document.open();
			frame.contentWindow.document.write('<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Frameset//EN" "http://www.w3.org/TR/html4/frameset.dtd"><html><head><link rel="stylesheet" type="text/css" href="http://fonts.googleapis.com/css?family=PT%20Sans"></head><body></body></html>');
			frame.contentWindow.document.close();
		} catch (e) {
			try {
				// It may fail on IE if the page domain was changed. we have to do the following hack to change the IFRAME domain to match the parent.
				frame.src = 'javascript:document.write("<!DOCTYPE HTML PUBLIC \\"-//W3C//DTD HTML 4.01 Frameset//EN\\" \\"http://www.w3.org/TR/html4/frameset.dtd\\"><html><head><script type=\'text/javascript\'>document.domain=\''+document.domain+'\';</script></head><body></body></html>")';
				frame.contentWindow.document.write('<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Frameset//EN" "http://www.w3.org/TR/html4/frameset.dtd"><html><head><link rel="stylesheet" type="text/css" href="http://fonts.googleapis.com/css?family=PT%20Sans"></head><body></body></html>');
				frame.contentWindow.document.close();
			} catch (e) {
                // alert("From: watchlr iframe window base class. \nReason:" + e);
				// $kat.trackError({ from: 'draggable_iframe', exception: e, msg: 'failed to create iframe' });
			}
		}

		this._element = frame;
		this._win = this._element.contentWindow;
		this._doc = this._element.contentWindow.document;
		this._topDoc = top.document;
		this._body = this._doc.body;

		// FIX IE9: body attribute not set yet!
		if (this._body == null) this._body = this._element.contentWindow.document.getElementsByTagName('body')[0];

        // set the bosy and style sheet for iframe
		$cwutil.Styles.insert('WatchlrIframeWindowStyles', this.getDocument());
        $(this.getBody()).html($cws.html['WatchlrIframeWindow']);

        // set content div after setting the body of iframe
        this._contentDiv = this.getElement('.content');
	},

    getDocument: function() {
		return this._doc;
	},

	getWindow: function(){
		return this._win;
	},

    getParentWindow: function(){
		return this._parentWindow;
	},

	getBody: function() {
		return this._body;
	},

    getElements: function(selector) {
		return $(this._body).find(selector);
	},

	getElement: function(selector) {
		if (selector) {
			return $(this._body).find(selector);
		} else {
			return this._element;
		}
	},

    setContent: function(content) {
		$(this._contentDiv).html(content);
	},

    hide: function() {
        $(this._element).fadeOut();
    },

    setSize: function(width, height) {
        $(this._element).width(width + 'px');
        $(this._element).height(height + 'px');
    },

    show: function() {
        this.centerFrame();
        $(this._element).show();
    },

    centerFrame: function(elem) {
        var elemWidth = 0;
        var elemHeight = 0;
        var elemOffset = {top: 0, left: 0};
        if (elem) {
            elemWidth = $(elem).width();
            elemHeight = $(elem).height();
            elemOffset = $(elem).offset();
        } else {
            elemWidth = $(this._parentWindow).width();
            elemHeight = $(this._parentWindow).height();
        }

        var frameWidth = $(this._element).outerWidth();
        var frameHeight = $(this._element).outerHeight();

        var frameLeft = ((elemWidth - frameWidth) / 2) + elemOffset.left;
        var frameTop = ((elemHeight - frameHeight) / 2) + elemOffset.top;
        // console.log('watchlr frame position and size:' + frameLeft + ", " + frameTop + ", " + frameWidth + ", " + frameHeight);
        if (frameLeft > 0 && frameTop > 0) {
            $(this._element).css('left', frameLeft);
            $(this._element).css('top', frameTop);
        } else {
            $(this._element).css('left', frameWidth);
            $(this._element).css('top', frameHeight);
        }

        // console.log($(this._element).css('left') + ", " + $(this._element).css('top'));
	}/*,

    setTemplate: function(className) {
		// is it an array?
		if (typeof className == 'object') className = className.join(' ');
		// is it the current template ?
		if (className == this._currentTemplateName) return;
		// change template
		this._firstElement.set('class', className);
		this._currentTemplateName = className;
	}  */,

    bind: function(eventName, _callback) {
        $(this._element).bind(eventName, _callback);
    },

    trigger: function(eventName, paramArray) {
        if (paramArray) {
            $(this._element).trigger(eventName, paramArray);
        } else {
            $(this._element).trigger(eventName);
        }
    }
});