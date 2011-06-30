/**
 * @package com.watchlr.util
 */
$.Class.extend("com.watchlr.util.Url", {
	
	getHostArray: function(_pageUrl){
		var domain = /^http:\/\/([^\/]+)/.exec(_pageUrl);
		if (domain && domain[1]) {
			return domain[1].split(".");
		}
		return null;
	},

	getHost: function(_pageUrl){
	    //Take the last two in reverse order
	    var parts = $cwutil.Url.getHostArray(_pageUrl);
	    if (parts && parts.length > 1) {
	        var host = parts[parts.length - 1] + "." + parts[parts.length - 2];
	        // Terrible hack for bbc.co.uk et al
	        if (host === "uk.co" && parts.length > 2) {
	            host = host + "." + parts[parts.length-3];
	        }
	        return host;
	    }
	    return null;
	},
	
	getHostName: function(_url) {
		var hostName = /^https?:\/\/([^\/]*)/i.exec(_url);
		return hostName ? hostName[1] : null
	},

	getDomainName: function(_pageUrl){
	    //Take the last two in reverse order
	    var parts = $cwutil.Url.getHostArray(_pageUrl);
	    if (parts && parts.length > 1) {
	        var domain = parts[parts.length - 2];
	        // Terrible hack for bbc.co.uk et al
	        if (domain.length < 3 && parts.length >= 3) {
		        var domain = parts[parts.length - 3];
	        }
	        return domain;
	    }
	    return '';
	},
	
	isWebsiteHome: function(_pageUrl) {
		return /^http[s]?:\/\/([^\/]+)\/?([#|\?].*)?$/.test(_pageUrl);
	},
	
	/**
	 * @return {Boolean} - check if to incoming urls are the same once the hash is stripped away
	 */
	isSameHashPage: function(_urlA, _urlB){
		if (!_urlA || !_urlB) return false;
		
		var urlA = (_urlA.indexOf('#') != -1) ? _urlA.substring(0, _urlA.indexOf('#')) : _urlA;
		var urlB = (_urlB.indexOf('#') != -1) ? _urlB.substring(0, _urlB.indexOf('#')) : _urlB;
		
		return urlA == urlB;
	},
	
	isInitUrl: function(_pageUrl) {
		return _pageUrl.indexOf('http://www.init.com') == 0;
	},
	
	isSearchWebsite: function(_pageHost) {
		return _pageHost.indexOf('google.') != -1 || _pageHost.indexOf('bing.') != -1 || _pageHost.indexOf('kikin.') != -1 || _pageHost.indexOf('yahoo.') != -1;
	},
	
	isSearchUrl: function(_pageUrl) {
		var searchPages = ',com.google,com.yahoo,com.bing,de.google,com.kikin',
			currentHost = $cwutil.Url.getHost(_pageUrl || $win.location.href);
		return searchPages.indexOf(currentHost) != -1;
	},
	
	analyzeUrlParams: function(url) {
		if (!url) return null;
		
		var idx = url.indexOf('?');
		if (idx != -1) {
			host = url.substring(0, idx),
			params = url.substring(idx+1);
			var data = params.parseQueryString();
			if (data) {
				// remove some parameters
				if (data.ignore) delete data.ignore;
				if (data.callback) delete data.callback;
				if (data.ksu) delete data.ksu;
				if (data.cId) delete data.cId;
				if (data.resultDataType) delete data.resultDataType;
				if (data.libtype) delete data.libtype;
				
				var newParams = '';
				for (var p in data) {
					if (newParams != '') newParams += '&';
					newParams += p+'='+data[p];
				}
				
				return {
					kpis: data.kpi,
					url: host+'?'+newParams
				};
			}
		}
		return null;
	},
	
	getHashOrUrlParameter: function(name) {
		var part = (top.location.hash && top.location.hash.indexOf(name+'=')) ? top.location.hash : top.location.href;
		return $cwutil.Url.getParameter(name, part);
	},
	
	getParameter: function(name, part){
		var data = new RegExp('[^a-z]'+name+'=([^&]*)', 'i').exec(part);
		if (data && data.length >= 2) {
			return decodeURIComponent(data[1]).replace(/\+/gi, ' ');
		}
		return null;
	},
	
	/**
	 * @param window.location
	 */
	isHomepage: function(_win){
		return _win.protocol + "//" + _win.host + "/" == _win.href
	},
	
	replaceCdnUrls: function(_s) {
		if(typeof(_s)=='string'){
			return _s.replace(/url\(img\//g,'url(http://kikin-dev.com/kikin/img/');	
		}else if(typeof(_s)=='object'){
			for(var xx in _s){
				_s[xx] = $cwutil.Url.replaceCdnUrls(_s[xx]);
			}
			return _s;
		}
		
	}
	
}, {});
