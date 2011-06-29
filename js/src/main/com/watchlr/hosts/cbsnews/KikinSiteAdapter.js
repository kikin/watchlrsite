/**
 * @package com.watchlr.hosts.cbsnews.adapters
 */

$cwh.adapters.KikinSiteAdapter.extend("com.watchlr.hosts.cbsnews.adapters.KikinSiteAdapter", {}, {

    run: function() {
        // We only add KikinVideo adapter if kikin video experiment is set
        try {
            var kva = $cwh.adapters.KikinVideoAdapter.getInstance();
            if (kva) kva.attach();
        } catch(e) {
            alert("From: cbs_news_site_adapter. \nReason:" + e);
            //$kat.trackError({ from: 'cbs_news_site_adapter', exception: e, msg: 'unable to create video adapter'});
        }
	}
});
