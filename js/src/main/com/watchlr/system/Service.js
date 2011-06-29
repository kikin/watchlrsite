/**
 * @package com.watchlr.system
 */
$.Class.extend("com.watchlr.system.Service", {}, {

	config: null,
	
	/**
	 * @param {com.watchlr.system.Config} config
	 */
	setConfig: function(config) {
		if(!config) return;
		if(!(config instanceof $cws.Config)) throw new Error('Object "' + name + '" must be a legitimate configuration object.');
		this.config = config;
	},
	
	/**
	 * @type com.kikin.system.Config
	 */
	getConfig: function() {
        return this.config;
	},
	
	debug:function() {	
		var str = '',
			assertions = this.config.getValue('assertions'),
			E = $cwutil.Error;
		if(!assertions || assertions.length == 0) str += 'No assertion tests defined for this service.\n';
		else assertions.each(function(a, i) { 
			var r = E.assert(a.test.apply(this));
			str += (i+1) + ': ' + a.description + '\t\t';
			if(!r) str += 'OK';
			else if(r && a.priority == E.ASSERT_ERROR) str += 'ERROR' + (a.message ? ' ('+a.message+')' : '');
			else if(r && a.priority == E.ASSERT_WARNING) str += 'WARNING' + (a.message ? ' ('+a.message+')' : '');
			else str += 'ERROR';
			str += '\n';
		}, this);
		return str;
	},
	
	/**
	 * @private
	 * @param {String} name
	 */
	getAdapter: function(name) {
		return $cws.services.getService('HostService').getAdapter(name);
	},
	
	/**
	 * @protected
	 * @param {String} name
	 */
	setAdapter: function(name) {
		this.adapter = new (this.getAdapter(name))(this) || null;
	},
	
	/**
	 * @protected
	 * @param {String} name
	 */
	adapterExists: function(name) {
		return Boolean(this.getAdapter(name)); 
	}
	
});
