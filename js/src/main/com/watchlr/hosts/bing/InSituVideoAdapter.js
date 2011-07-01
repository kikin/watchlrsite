/**
 * @package com.watchlr.hosts.bing.adapters
 */

$cwh.adapters.InSituVideoAdapter.extend("com.watchlr.hosts.bing.adapters.InSituVideoAdapter", {}, {

	attach: function() {}

//	attach: function() {
//		var stats = $kh.adapters.InSituVideoAdapter.stats.reset();
//
//    	// add needed styles
//		$ku.Styles.insert('InSituVideoStyles', $win.document);		
//		
//		// look the page for video images
//        $$('#results_container div.sc_vc_wa').each(function(videoDiv) {
//        	// get the host config (fails if not compatible)
//        	var hostConfig = this.getHostConfig(videoDiv);
//        	if (!hostConfig) {
//                stats.notSupported++;
//        		return;
//        	}
//        	
//        	// create our little beautiful icon
//            var name = hostConfig.name.toString(),
//            	imgLink = videoDiv.getElement('.vt_tl'),
//                // Create button overlay
//                overlay = new Element('div', {
//                    'class': 'kikinIsvOverlay kikinIsvGoogleOverlay'
//                }).inject(imgLink, 'top'),
//                button = new Element('div', {
//                    'class': 'kikinIsvButton'
//                }).inject(overlay),
//                arrow = new Element('div', {
//                    'class': 'kikinIsvOverlayArrow'
//                }).inject(button);
//            
//            var SMALL_THUMB_X = 80,
//            	SMALL_THUMB_Y = 60,
//            	BORDER_RAD = 2;
//
//            overlay.setStyles({
//        		width: imgLink.offsetWidth,
//        		height: imgLink.offsetHeight
//            });
//
//            button.setStyles({
//                marginTop:button.getStyle('marginTop').toInt()+imgLink.offsetHeight-SMALL_THUMB_Y-BORDER_RAD*2,
//                marginLeft:button.getStyle('marginLeft').toInt()+imgLink.offsetWidth-SMALL_THUMB_X-BORDER_RAD*2
//            });
//            $ku.Element.setBrowserClasses(button);
//
//			var handler = this.onClickVideoThumbnail.bind(this);
//            
//            // Remove bing's overlay play button
//            videoDiv.getElement('.vt_vsp').dispose();
//            imgLink.set('onMouseOver', '').set('onMouseDown', '').removeEvents('mouseover').removeEvents('mouseout');
//            imgLink.removeClass('vt_stl');
//            imgLink.getElements('.vt_vp').dispose();
//            imgLink.getElements('.vt_vsm').dispose();
//
//            // Attach event to button for video play
//            overlay.addEvent('click', handler);
//            
//            stats.supported++;
//		}, this);
//	},
//	
//	getHostConfig: function(videoDiv) {
//		var link;
//		
//		// try to get the link
//        if(link = videoDiv.getElement('.sc_m12 a')) {
//        	// is this url supported?
//        	var supportedHosts = $kc.FeaturesConfig.plugins.InSituVideoFeature.config.supportedHosts,
//        		hostConfig = supportedHosts[$ku.String.getHostName(link.href)];
//            return hostConfig;
//		}
//        
//		return null;
//	},
//
//	onClickVideoThumbnail: function(e) {
//	    e.stop();
//	    
//	    // create once the video panel that will show the videos
//	    if (!this.videoPanel) {
//			this.videoPanel = new $kf.insituvideo.InSituVideoPanel({
//				document: $win.document
//			});	    
//	    }
//	    
//	    // get some infos
//	    var videoDiv = $(e.target).getParent('div.sc_vc_wa'),
//	    	imgLink = videoDiv.getElement('.vt_tl'),
//	    	img = imgLink.getElement('img'),
//	    	link = videoDiv.getElement('.sc_m12 a')
//	        hostConfig = this.getHostConfig(videoDiv);
//	    
//	    // set infos in the right panel
//	    this.videoPanel.setInfos({
//    		title: img.get('alt'),
//    		rating: '',
//			partnerId: $kf.core.FeaturesDisplayNames.ids.ORGANIC,
//			hostName: hostConfig.name,
//			url: link.get('href')
//	    });
//	    
//	    // set the player
//	    this.videoPanel.setPlayer(
//    		new $kf.insituvideo.InSituDefaultPlayer({
//				data: $kf.insituvideo.InSituVideoFeature.getSwiffData(link),
//				document: $win.document
//			})
//	    );
//	    
//    	var imgHeight = imgLink.getSize().y || 90;
//    	var relElement = $('results_container') || $($win.document.body);
//		this.videoPanel.setStyle('left', relElement.getPosition().x);
//		this.videoPanel.setStyle('top', imgLink.getPosition().y-6+imgHeight);
//	    
//	    // show the panel and start playing
//	    this.videoPanel.open()
//	}
	
});
