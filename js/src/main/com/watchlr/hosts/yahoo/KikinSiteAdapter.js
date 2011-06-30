/**
 * @package com.watchlr.hosts.yahoo.adapters
 */
$cwh.adapters.KikinSiteAdapter.extend("com.watchlr.hosts.yahoo.adapters.KikinSiteAdapter", {}, {
	
	run: function() {
		// only for the search pages
		if (window.location.href.match(/^http:\/\/search\.yahoo\.com\/search(.*)/i)) {
			this.injectIntoSearchPage();
		}

        // We only add KikinVideo adapter if kikin video experiment is set
        /*try {
            var kva = $cwh.adapters.KikinVideoAdapter.getInstance();
            if (kva) kva.attach();
        } catch(e) {
            alert("From: yahoo_site_adapter.\nReason: " + e);
            // $kat.trackError({ from: 'yahoo_site_adapter', exception: e, msg: 'unable to create video adapter'});
        } */
	},
	
	injectIntoSearchPage: function() {
    	/*try {
	    	// attach to the videos
	    	// var isva = new $kh.adapters.InSituVideoAdapter();
	    	// if (isva) isva.attach();
	    	
			var kva = $cwh.adapters.KikinVideoAdapter.getInstance();
            if (kva) kva.attach();
	    	
    	} catch(e) {
            alert("From: site_adapter.\nReason: " + e);
			// $kat.trackError({ from: 'site_adapter', exception: e, msg: 'injectiong failed in yahoo'});
    	}   */
	}
			
});
