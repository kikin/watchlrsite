/**
 * @package com.watchlr.system
 */
$.Class.extend("com.watchlr.system.Config", {}, {
	
	data: null,
	
	/**
	 * @constructor
	 * @param {Object} data
	 */
	init: function(data) {
		this.setConfig(data);
		return this;
	},

	/**
	 * @param {String} name
	 * @method getConfig
	 * @type Object
	 */
	getValue: function(name) {
		if(this.data) return this.data[name];
	},

	/**
	 * @method setConfig
	 * @param {Object} data
	 */
	setConfig: function(data) {
        if(!data) return;
		if(typeof data != 'object') throw new Error('Configuration data must be JSON object.');
		this.data = data;
	}
	
});
