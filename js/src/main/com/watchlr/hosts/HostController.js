/**
 * @package com.watchlr.hosts
 */

$.Class.extend("com.watchlr.hosts.HostController", {

}, {

    _hostName: null,

	host: null,
	
	/**
	 * @constructor
	 */
	init: function() {
		this._setHostService();
	},
	
	/**
	 * @protected
	 */
	_setHostService: function(){
		this.setDefaultHost();
		$cws.services.addService('HostService', this.host);
	},
	
	/**
	 * @protected
	 * @return {String}
	 */
	_getHost: function(_pageUrl){
        //Take the last two in reverse order
        var parts = $cwutil.Url.getHostArray(_pageUrl);
        if (parts && parts.length > 1) {
            var host = parts[parts.length - 1] + "." + parts[parts.length - 2];
            // Terrible hack for bbc.co.uk et al
            if ((host === "uk.co" || host === "br.com" || host === "com.go") && parts.length > 2) {
                host = host + "." + parts[parts.length-3];
            }
            // Terrible hack for getting any google site to be com.google
            if (host.indexOf('.google') != -1) {
            	host = 'com.google';
            }

            return host;
        }
        return null;
	},
	

	/**
	 * @protected
	 * @return {String}
	 */
	_getFullHost: function(_pageUrl){
		var parts = $cwutil.Url.getHostArray(_pageUrl);
		return (parts)?parts.reverse().join('.'):null;
	},
	
	/**
	 * 
	 */
	_setHost: function(_host){
		this._hostName = _host;
	},
	
	/**
	 * @private
	 */
	setDefaultHost: function() {

        // use the current location because the config object cannot be trusted!
        var sNewHost = this._getHost(window.location.href);
        if (sNewHost) this._setHost(sNewHost);
    		
        var supported = $cwc.HostsConfig.supportedEngines,
            engineConfig = supported ? supported[sNewHost] : null;

        if (!sNewHost) {
            throw new Error('Cannot determine host.');
        } else if (supported[sNewHost] && supported[sNewHost]['package']) {
            this.host = new $cwh.Host(new $cws.Config(supported[sNewHost]));
        } else if (supported['defaultEngine'] && supported['defaultEngine']['package']) {
            this.host = new $cwh.Host(new $cws.Config(supported['defaultEngine']));
        } else {
            this.host = new $cwh.Host;
        }
    }

});