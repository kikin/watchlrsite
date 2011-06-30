/**
 * @package com.watchlr.hosts.defaultEngine.adapters
 */

$cwh.adapters.KikinSiteAdapter.extend("com.watchlr.hosts.defaultEngine.adapters.KikinSiteAdapter", {}, {

	init: function() {
    },

	run: function() {

        // We only run KikinVideo adapter if kikin video experiment is set
        try {
            var kva = $cwh.adapters.KikinVideoAdapter.getInstance();
            if (kva) kva.attach();
        } catch(e) {
            alert("from: default_site_adapter. \nReason:" + e);
            // $kat.trackError({ from: 'default_site_adapter', exception: e, msg: 'unable to create video adapter'});
        }
	}
});

