/**
 * @package com.watchlr.hosts.orkut.adapters
 */
$cwh.adapters.KikinSiteAdapter.extend("com.watchlr.hosts.orkut.adapters.KikinSiteAdapter", {}, {

	run: function() {
		// our callback function everytime the page changes
		var fn = $.proxy(function() { this.injectIntoCommunityPage.delay(1000, this); }, this);
		
		// check for hash changes
		if ($.browser.msie) window.document.body.onhashchange = fn;
		else if ($.browser.mozilla || $.browser.webkit) window.addEventListener('hashchange', fn, false);
		
		// inject in this page
		fn();
	},
	
	injectIntoCommunityPage: function() {
		// We only add KikinVideo adapter if kikin video experiment is set
        try {
            var kva = $cwh.adapters.KikinVideoAdapter.getInstance();
            if (kva) kva.attach();
        } catch(e) {
            alert("From: orkut_site_adapter.\nReason: " + e);
            // $kat.trackError({ from: 'orkut_site_adapter', exception: e, msg: 'unable to create video adapter'});
        }
	}
			
});
