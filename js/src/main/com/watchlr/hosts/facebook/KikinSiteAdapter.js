/**
 * @package com.watchlr.hosts.facebook.adapters
 */

$cwh.adapters.KikinSiteAdapter.extend("com.watchlr.hosts.facebook.adapters.KikinSiteAdapter", {}, {

    init: function() {},

    run: function() {
		try {

            // for facebook we need to run every time the hash changes
            var fn = $.proxy(function() {
                setTimeout($.proxy(this.injectIntoPage, this), 1000);
            }, this);

            if ($.browser.msie) window.document.body.onhashchange = fn
            else if ($.browser.mozilla || $.browser.webkit) window.addEventListener('hashchange', fn, false);

            setTimeout($.proxy(this.injectIntoPage, this), 1000);
        } catch(err) {
            alert("From: facebook_site_adapter.\nReason:" + err);
        }
	},

	injectIntoPage: function() {
		try {
            var kva = $cwh.adapters.KikinVideoAdapter.getInstance();
            if (kva) kva.attach();

        } catch(e) {
            alert("From: facebook_site_adapter. \nReason:" + e);
            // $kat.trackError({ from: 'facebook_site_adapter', exception: e, msg: 'unable to create video adapter'});
        }

	}
});
