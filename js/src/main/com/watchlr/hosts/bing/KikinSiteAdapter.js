/**
 * @package com.watchlr.hosts.bing.adapters
 */
$cwh.adapters.KikinSiteAdapter.extend("com.watchlr.hosts.bing.adapters.KikinSiteAdapter", {}, {

	run: function() {
		// only for the search pages
		if (window.location.href.match(/^http:\/\/www\.bing\.com\/search(.*)/i)) {
			this.injectIntoSearchPage();
		}

        try {
            var kva = $cwh.adapters.KikinVideoAdapter.getInstance();
            if (kva) kva.attach();
        } catch(e) {
            alert("From: bing_site_adapter. \nReason:" + e);
            // $kat.trackError({ from: 'bing_site_adapter', exception: e, msg: 'unable to create video adapter'});
        }
	},
	
	injectIntoSearchPage: function() {
    	try {
			// attach to the videos
	    	var isva = new $kh.adapters.InSituVideoAdapter();
	    	if (isva) isva.attach();

    	} catch(e) {
            alert("From: injectIntoSearchPage of bing KikinSiteAdapter. \nReason:" + e);
			// $kat.trackError({ from: 'site_adapter', exception: e, msg: 'injectiong failed in bing'});
    	}
	}
	
});
