/**
 * @package com.watchlr.hosts.adapters
 */

$.Class.extend("com.watchlr.hosts.adapters.InSituVideoAdapter", {
    stats : {
        reset: function() {
            this.supported = 0;
            this.notSupported = 0;
            this.unsupportedDomains = [];
            return this;
        },
        toLogString: function() {
            if (this.supported == 0 && this.notSupported == 0) {
                return '';
            } else {
                return 'InSituVideoFeature:'+
                        'organic='+(this.supported+this.notSupported)+
                        ',organic_annotated='+this.supported;
            }
        },
        supported: 0,
        notSupported: 0,
        unsupportedDomains: []
    }
}, {

	initialize: function() {
		var adapter = $cws.services.getService('HostService').getAdapter('InSituVideoAdapter');
		return adapter ? new adapter() : null;
	},
	attach: function(analytics) {}
});
