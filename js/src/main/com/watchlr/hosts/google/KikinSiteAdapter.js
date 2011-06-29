/**
 * @package com.watchlr.hosts.google.adapters
 */
$cwh.adapters.KikinSiteAdapter.extend("com.watchlr.hosts.google.adapters.KikinSiteAdapter", {}, {

	run: function() {
		// only for the search pages
		if (window.location.href.match(/^http:\/\/www\.google\.[^\/]+\/(.*)/)) {
			this.injectIntoSearchPage();
		}

        try {
            var kva = $cwh.adapters.KikinVideoAdapter.getInstance();
            if (kva) kva.attach();
        } catch(e) {
            alert("From: google_site_adapter. \nReason: " + e);
            // $kat.trackError({ from: 'google_site_adapter', exception: e, msg: 'unable to create video adapter'});
        }
	},
	
	injectIntoSearchPage: function() {
		var fn = $.proxy(this.onHashHasChanged, this),
			body = window.document.body;
	
		if ($.browser.msie) {
			body.attachEvent('onkeyup', function() {
				body.onhashchange = fn;
				body.detachEvent('onkeyup', arguments.callee);
			});
			body.onhashchange = fn;
		} else if ($.browser.mozilla || $.browser.webkit)
			window.addEventListener('hashchange', fn, false);
		
		var usrAgent = window.navigator.userAgent.toLowerCase();
		// HACKY HACK: for ff3.5, there are no hashchange.
		if ($.browser.mozilla && (usrAgent.indexOf('firefox/3.5') > 0 || usrAgent.indexOf('firefox/3.0') > 0)) {
			var ffInject = function() {
				if (window.google && window.google.msg) {
					window.google.msg.listen(1, function() { return true; });
					window.google.msg.listen(0, function() { setTimeout(fn, 250); return true; });
				}
			};
			// wait for the page to be loaded or google.msg there
			if (window.google && window.google.msg) ffInject();
			else $(window).load(ffInject);
		}
		
		//check when coming from non-ajax search
		fn();
	},
	
	onHashHasChanged: function(e) {
		// delete old injection if there was one waiting

        if (this._delayedInject) clearTimeout(this._delayedInject);
    	this._delayedInject = setTimeout($.proxy(this.delayedInjection, this), 500);

	},
	
	delayedInjection: function() {
    	try {
			// attach to the videos
	    	// var isva = new $cwh.adapters.InSituVideoAdapter();
	    	// if (isva) isva.attach();
	    	
    		// We only add KikinVideo adapter if kikin video experiment is set
            try {
                var kva = $cwh.adapters.KikinVideoAdapter.getInstance();
                if (kva) kva.attach();
            } catch(e) {
                alert("From: google_site_adapter. \nReason: " + e);
                //$kat.trackError({ from: 'google_site_adapter', exception: e, msg: 'unable to create video adapter'});
            }

    	} catch(err) {
            alert("From: site_adapter. \nReason:" + err);
			// $kat.trackError({ from: 'site_adapter', exception: e, msg: 'injectiong failed in google'});
    	}
    	
    	this._delayedInject = null;
	}
			
});
