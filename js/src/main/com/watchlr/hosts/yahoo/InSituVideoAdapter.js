/**
 * @package com.watchlr.hosts.yahoo.adapters
 */
$cwh.adapters.InSituVideoAdapter.extend("com.kikin.hosts.yahoo.adapters.InSituVideoAdapter", {}, {
	
	/*attach: function() {
		var stats = $kh.adapters.InSituVideoAdapter.stats.reset();

    	// add needed styles
		$ku.Styles.insert('InSituVideoStyles', $win.document);		
		
		// look the page for video images
        $$('ul.c-thumb.video li').each(function(videoDiv) {
        	// get the host config (fails if not compatible)
        	var hostConfig = this.getHostConfig(videoDiv);
        	if (!hostConfig) {
                stats.notSupported++;
        		return;
        	}
        	
        	// create our little beautiful icon
            var name = hostConfig.name.toString(),
            	imgLink = videoDiv.getElement('.thm'),
                // Create button overlay
                overlay = new Element('div', {
                    'class': 'kikinIsvOverlay kikinIsvGoogleOverlay'
                }).inject(imgLink, 'top'),
                button = new Element('div', {
                    'class': 'kikinIsvButton'
                }).inject(overlay),
                arrow = new Element('div', {
                    'class': 'kikinIsvOverlayArrow'
                }).inject(button);
            
            var SMALL_THUMB_X = 80,
            	SMALL_THUMB_Y = 60,
            	BORDER_RAD = 2;

            overlay.setStyles({
        		width: imgLink.offsetWidth,
        		height: imgLink.offsetHeight
            });

            button.setStyles({
                marginTop:button.getStyle('marginTop').toInt()+imgLink.offsetHeight-SMALL_THUMB_Y-BORDER_RAD*2-1,
                marginLeft:button.getStyle('marginLeft').toInt()+imgLink.offsetWidth-SMALL_THUMB_X-BORDER_RAD*2-3
            });
            $ku.Element.setBrowserClasses(button);

			var handler = this.onClickVideoThumbnail.bind(this);
            
            // Remove bing's overlay play button
			imgLink.getElement('em').empty();

            // Attach event to button for video play
            overlay.addEvent('click', handler);
            
            stats.supported++;
		}, this);
	},
	
	_getVideoUrl: function(videoDiv) {
		// try to get the link
        if(link = videoDiv.getElement('a')) {
        	// get rurl parameter
        	var href = decodeURIComponent(link.get('href')),
        		params = href.parseQueryString(),
        		url = (params && params.rurl) ? params.rurl.replace(/&amp;/g, '&') : null;
        	return url;
        }
        return null;
	},
	
	getHostConfig: function(videoDiv) {
		var link;
		
		// try to get the link
        if(link = videoDiv.getElement('a')) {
        	// is this url supported?
        	var supportedHosts = $kc.FeaturesConfig.plugins.InSituVideoFeature.config.supportedHosts,
        		url = this._getVideoUrl(videoDiv),
        		hostConfig = supportedHosts[$ku.String.getHostName(url)];
        	
            return hostConfig;
		}
        
		return null;
	},

	onClickVideoThumbnail: function(e) {
	    e.stop();
	    
	    // create once the video panel that will show the videos
	    if (!this.videoPanel) {
			this.videoPanel = new $kf.insituvideo.InSituVideoPanel({
				document: $win.document
			});	    
	    }
	    
	    // get some infos
	    var videoDiv = $(e.target).getParent('li'),
	    	imgLink = videoDiv.getElement('.thm'),
	    	img = imgLink.getElement('img'),
	    	titleEle = videoDiv.getElement('a:not(.thm)')
	    	url = this._getVideoUrl(videoDiv),
	        hostConfig = this.getHostConfig(videoDiv);
	    
	    // set infos in the right panel
	    this.videoPanel.setInfos({
    		title: titleEle.get('text'),
    		rating: '',
			partnerId: $kf.core.FeaturesDisplayNames.ids.ORGANIC,
			hostName: hostConfig.name,
			url: url
	    });
	    
	    // set the player
	    this.videoPanel.setPlayer(
    		new $kf.insituvideo.InSituDefaultPlayer({
				data: $kf.insituvideo.InSituVideoFeature.getSwiffData(url),
				document: $win.document
			})
	    );
	    
    	var imgHeight = imgLink.getSize().y || 90;
    	var relElement = $('results') || $($win.document.body);
		this.videoPanel.setStyle('left', relElement.getPosition().x+32);
		this.videoPanel.setStyle('top', imgLink.getPosition().y-6+imgHeight);
	    
	    // show the panel and start playing
	    this.videoPanel.open()
	} */
});
