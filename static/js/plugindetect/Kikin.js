com.kikin.video.Kikin = {
	
	isChromeInstallation: function() {
		return navigator.plugins && navigator.plugins['kikin Plugin'];
	},
	
	/**
	 * @return {boolean} if plugin is successfully created
	 */
	createPlugin: function() {
	    if (!window.kikinApi) {
	        if (window.kikin) {
	            window.kikinApi = window.kikin;
	            return true;
	        } else if (window.ActiveXObject) {
	            try {
	                window.kikinApi = new ActiveXObject("Kikin.PluginAPI");
	                return this.hasRequiredVersion();
	            } catch (e) {
	            	return false;
	            }
	        } else if (window.KikinPluginApi) {
	            try {
	                window.kikinApi = new KikinPluginApi();
	                return this.hasRequiredVersion();
	            } catch (e) {
	            	return false;
	            }
	        }else{
                return false;
            }
	    }
	    return true;
	},
	
	/**
	 * Cache the lookup of the plugin
	 */
	getPlugin: function() {
		var oPlugin = (window.kikinApi && window.kikinApi.plugin)?window.kikinApi.plugin:false;
	    
	    return (this.getPlugin = function(){
	        return oPlugin;
	    })();	
	},
	
	hasRequiredVersion: function(){
		var plugin = this.getPlugin();
        if (plugin) {
            if (plugin.browserType.toLowerCase() == "cr") {
                return com.kikin.video.String.hasRequiredVersion('1.24.5', this.getPlugin().version);
            } else {
                return com.kikin.video.String.hasRequiredVersion('2.12.5', this.getPlugin().version);
            }

		}
		return false;
	},

	addCSSBodyClass: function() {
		var userAgent = navigator.userAgent,
			browserVersion = $.browser.version,
			os_browser,
			dlURL;
		
		//set OS
		if(userAgent.indexOf('Windows')!=-1){
			os_browser='win';
		}else if(userAgent.indexOf('Macintosh')!=-1){
			os_browser='mac';
		}else{
			os_browser='';
		}
		
		//add the OS first
		$(document.body).addClass(os_browser);
		
		//now add the user
		$.each($.browser, function(i, val) {
			if(val===true){
				os_browser+=i;
				$(document.body).addClass(i).addClass(i+browserVersion.substring(0,browserVersion.indexOf('.')));
				return false;
			}
	    });
	},
	
	isSupportedClientAgent: function() {
		if(this.isSupportedBrowser()){
			if(this.isMac() && $.browser.mozilla){
				return true;
			}else if(this.isWindows() && ($.browser.mozilla || $.browser.webkit || $.browser.msie) ){
				return true;
			}
		}
		return false;
	},
	
	isSupportedBrowser: function(){
		if(this.isMac()){
			return ($.browser.mozilla || $.browser.webkit);
		}else if(this.isWindows()){
			if($.browser.mozilla && com.kikin.video.String.hasRequiredVersion('1.9.2', $.browser.version)){
				return true;
			}else if($.browser.webkit && com.kikin.video.String.hasRequiredVersion('533', $.browser.version)){
				return true;
			}else if($.browser.msie && com.kikin.video.String.hasRequiredVersion('8', $.browser.version)){
				return true;
			}
		}else if(this.isMobile()){
			return true;
		}
		return false;
	},
	
	isWindows: function() {
		return navigator.userAgent.indexOf('Windows')!=-1;
	},
	
	isMac: function() {
		return navigator.userAgent.indexOf('Macintosh')!=-1;
	},
	
	isMobile: function() {
		return navigator.userAgent.indexOf('Mobile')!=-1;
	}
};