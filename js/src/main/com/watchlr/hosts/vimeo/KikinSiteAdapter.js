/**
 * @package com.watchlr.hosts.vimeo.adapters
 */
$cwh.adapters.KikinSiteAdapter.extend("com.watchlr.hosts.vimeo.adapters.KikinSiteAdapter", {}, {
	
	run: function() {
        try {
            var kva = $cwh.adapters.KikinVideoAdapter.getInstance();
            if (kva) kva.attach();
        } catch(e) {
            alert("From: vimeo_site_adapter.\nReason: " + e);
            // $kat.trackError({ from: 'vimeo_site_adapter', exception: e, msg: 'unable to create video adapter'});
        }
	}
});
