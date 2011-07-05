/**
 * @package com.watchlr.util
 */

$.Class.extend("com.watchlr.util.Styles", {
		
	insert: function(styleName, element, _package) {
		// get css styles
		if(!$cws.css[styleName]){
			$cws.css[styleName] = (_package && _package[styleName])?_package[styleName]:'/* stylesheet not found */';
		}
		var css = unescape($cws.css[styleName]);
	
		$cwutil.Styles.insertCss(css, element, styleName);
	},
	
	insertCss: function(css, element, styleName) {
		// find the owner document
		var doc = element.ownerDocument ? element.ownerDocument : element;

        // get the css list
		var listVarName = 'watchlr-css-list';
        var docWindow = null;

        // For IE go through each iframe and find if document of the iframe matches our
        // document we are looking for. In other browsers we can get window object
        // using document.defaultView
        if ($.browser.msie) {
            if (window.document == doc) {
                docWindow = window;
            } else {
                $.get('iframe').each(function(index, value) {
                    if (value.document == doc) docWindow = value;
                });
            }
        } else {
            docWindow = doc.defaultView;
        }

        var list = docWindow[listVarName];
		if (!list) list = docWindow[listVarName] = {};

		// get the head tag
		var head = $(doc).find('head').get(0);
        if (!head) {
            head = doc.body;
        }

		// make sure we don't add twice the same stylesheet
		if (styleName) {
			if (list[styleName]) return;
		} else {
			// create a random style name
			styleName = 'raw_style_'+(new Date().getTime());
		}
		
		// is the user using Internet Explorer?
		// IE maximum css limit is 31 (should never happened)
		if ($.browser.msie) {
			try {
				// Try to use IE functions
				var style = doc.createStyleSheet();
				style.cssText = css;
				
			} catch(e) {
				try {
					// Default to the normal method
					// should even work if we exceed 31 stylesheets
					var style = doc.createElement('style');
					style.type = 'text/css';
					style.cssText = css;
					head.appendChild(style);
				} catch (e2) {}
			}
		} else {
			// for Firefox/Safari user the normal method
            var style = doc.createElement('style');
            style.type = 'text/css';
            style.appendChild(doc.createTextNode(css));
            head.appendChild(style);
		}		
		
		// save this stylename to the list
		list[styleName] = true;
	},
		
	/**
	 * @param {String} css
	 * @return {StyleElement}
	 */
	add:function(css, id){
		var oo = $cwutil.Styles.get(id);
		if(null!=oo){
			return oo;
		}
		
		if($.browser.msie){
			var fAssignStyleId = function(_id){
				if(_id){
					var aStyles = $('head').get(0).find('style');
					aStyles[aStyles.length-1].setAttribute('id',_id);
				}
			};
			//throws "Invalid Argument" exception in IE after 31 stylesheets have been reached on the page
			try {
				oo = document.createStyleSheet();
				oo.cssText = unescape(css);
				fAssignStyleId(id);
			} catch(e) {//after 31 we need to append to an existing sheet					
				try{
					//use this id now
					id = 'CommonStyles';
					
					//find existing CommonStyles sheet
					var oCommon = $cwutil.Styles.get(id);
					//store existing styles
					css += oCommon.innerHTML;
					//remove the sheet
					oCommon.parentNode.removeChild(oCommon);
					
					//create a new sheet 
					oo = document.createStyleSheet();
					oo.cssText = unescape(css);
					
					
					fAssignStyleId(id);
				}catch(e){}
			}
		} else {
			oo = document.createElement('style');
			oo.type = 'text/css';
			$('head').get(0).appendChild(oo);
			if(id) oo.setAttribute('id', id);
			oo.appendChild(document.createTextNode(unescape(css)));
		}
		
		return oo;
	},
	
	/*
	 * Defined later once the first stylesheet is added to the page (see AddStyle)
	 */
	get:function(_id){
		return $('head').get(0).find('#'+_id);
	}
}, {});