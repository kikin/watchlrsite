kikinvideo.util.CSSHelper = {
	
	addCSSBodyClass: function(){
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
	}
};