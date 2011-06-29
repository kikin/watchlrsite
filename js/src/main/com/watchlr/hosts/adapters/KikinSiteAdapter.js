/**
 * @package com.watchlr.hosts.adapters
 * Site specific stuff
 */

$.Class.extend("com.watchlr.hosts.adapters.KikinSiteAdapter", {
    getInstance: function() {
        try {
            if (!this._instance) {
                var adapter = $cws.services.getService('HostService').getAdapter('KikinSiteAdapter');
                this._instance = adapter ? new adapter() : null;
            }

            return this._instance;
        }
        catch (err) {}
    }
}, {

});