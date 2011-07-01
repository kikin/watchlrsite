/**
 * @package com.watchlr.hosts
 */

$cws.Service.extend("com.watchlr.hosts.Host", {}, {

    adapters: {},
	
	init: function(config) {
        this.setConfig(config);
		this.loadAdapters();
	},
	
	/**
	 * @private
	 */
	loadAdapters: function() {
		var conf = this.getConfig(),
			pck = conf ? conf.getValue('package') : null;
        if(pck && pck.adapters) this.adapters = pck.adapters;
	},
	
	/**
	 * @type com.watchlr.features.PluginAdapter
	 * @param {Object} name
	 */
	getAdapter: function(name) {
        return this.adapters[name] || false;
	}
	
});