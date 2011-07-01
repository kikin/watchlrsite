/**
 * @package com.watchlr.system.runtime
 * @author kapil.goel@kikin.com
 */

$.Class.extend('com.watchlr.system.runtime.Bootstrap', {}, {

	run: function() {
        // Load services configuration data
        // $cws.config = new $cws.Config($cwc.SystemConfig);
		// $cws.runtime.config = new $cws.Config($kc.RuntimeConfig);

        $cwss = $cws.services = new $cws.ServiceDaemon();
        $cws.controllers = {};
        $cws.controllers.HostController = new com.watchlr.hosts.HostController();

        //BarUtil always sets the layout to No for ytonly
		// $ks.controllers.LayoutController = new $kui.LayoutController;
		// $ks.controllers.ErrorController = new com.kikin.error.ErrorController();

		// if ($ku.Kikin.isKikinHttpRequestSupported()) {
		// 	setKikinPluginRequests();
		// }

    	try {
	    	var ksa = $cwh.adapters.KikinSiteAdapter.getInstance();
            if (ksa)
                ksa.run();
    	} catch(e) {
            alert("from: bootstrap. \nReason:" + e);
    		// $cwat.trackError({ from: 'bootstrap', exception: e, msg: 'KikinSiteAdapter failed'});
    	}
    }

});