/**
 * @package com.watchlr.hosts.espn.adapters
 */

$cwh.adapters.KikinSiteAdapter.extend("com.watchlr.hosts.espn.adapters.KikinSiteAdapter", {}, {

    run: function() {
        // We only add KikinVideo adapter if kikin video experiment is set
        try {
            var kva = $cwh.adapters.KikinVideoAdapter.getInstance();
            if (kva) kva.attach();
        } catch(e) {
            // alert("From: espn_site_adapter. \nReason:" + e);
            //$kat.trackError({ from: 'espn_site_adapter', exception: e, msg: 'unable to create video adapter'});
        }
	}
});
