/**
 * @package com.watchlr.hosts.cnn.adapters
 */

$cwh.adapters.KikinSiteAdapter.extend("com.watchlr.hosts.cnn.adapters.KikinSiteAdapter", {}, {

    run: function() {
        // We only add KikinVideo adapter if kikin video experiment is set
        try {
            var kva = $cwh.adapters.KikinVideoAdapter.getInstance();
            if (kva) kva.attach();
        } catch(e) {
            // alert("From: cnn_site_adapter. \nReason:" + e);
            //$kat.trackError({ from: 'cnn_site_adapter', exception: e, msg: 'unable to create video adapter'});
        }
	}
});
