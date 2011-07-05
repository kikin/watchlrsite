/**
 * @package com.watchlr.hosts.youtube.adapters
 */
$cwh.adapters.KikinSiteAdapter.extend("com.watchlr.hosts.youtube.adapters.KikinSiteAdapter", {}, {
	
	run: function() {

        try {
	    	if(0==window.location.pathname.indexOf('/results')){
	    		// var isva = new $kh.adapters.InSituVideoAdapter();
	    		// if (isva) isva.attach();
	    	}
		} catch(e) {}

        try {
            var kva = $cwh.adapters.KikinVideoAdapter.getInstance();
            if (kva) kva.attach();
        } catch(e) {
            // alert("From: youtube_site_adapter.\nReason: " + e);
            // $kat.trackError({ from: 'youtube_site_adapter', exception: e, msg: 'unable to create video adapter'});
        }
	}
	
});
