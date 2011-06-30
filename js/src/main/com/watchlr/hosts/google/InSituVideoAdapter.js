/**
 * @package com.watchlr.hosts.google.adapters
 */
$cwh.adapters.InSituVideoAdapter.extend("com.watchlr.hosts.google.adapters.InSituVideoAdapter", {}, {

	_stats: null
	
	/*attach: function() {
		this._stats = $cwh.adapters.InSituVideoAdapter.stats.reset();

    	// add needed styles
		$cwu.Styles.insert('InSituVideoStyles', window.document);

		// look the page for video images
		$('#res li.videobox a img[id*=vidthumb]').each($.proxy(this._addVideoPlayback, this));
		//single video result - http://www.google.com/search?hl=en&q=ducati+696
		$('#res table a img[id*=vidthumb]').each($.proxy(this._addVideoPlayback, this));

        // track unsupported domains
        if (this._stats.unsupportedDomains.length > 0) {
            // $kat.track('InSituAdapterEvt','Unsupported', {campaign: this._stats.unsupportedDomains.join(',')});
        }
	},

	_addVideoPlayback: function(img) {
    	// get the host config (fails if not compatible)

    	var videoUrl = this.getVideoUrl(img),
    		supportedHosts = $kc.FeaturesConfig.plugins.InSituVideoFeature.config.supportedHosts,
			hostConfig = videoUrl ? supportedHosts[$ku.String.getHostName(videoUrl)] : null;

        if (!hostConfig) {
    		this._stats.notSupported++;
            if (videoUrl) this._stats.unsupportedDomains.push($ku.String.getHostName(videoUrl));
    		return;
    	}

        // create our little beautiful icon
        var name = hostConfig.name.toString(),
            // Create button overlay
            overlay = new Element('div', {
                'class': 'kikinIsvOverlay kikinIsvGoogleOverlay'
            }).inject(img.getParent('a'), 'before'),
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
    		width:img.offsetWidth,
    		height:img.offsetHeight
        });

        button.setStyles({
            marginTop:button.getStyle('marginTop').toInt()+img.offsetHeight-SMALL_THUMB_Y-BORDER_RAD*2,
            marginLeft:button.getStyle('marginLeft').toInt()+img.offsetWidth-SMALL_THUMB_X-BORDER_RAD*2
        });

		var handler = this.onClickVideoThumbnail.bind(this),
			googleLink = overlay.getNext().removeEvents('click').addEvent('click', handler),
			googlePlay = googleLink.getElement('.play_icon');

		$ku.Element.setBrowserClasses(button);

        // Remove google's overlay play button and insert new kikin button
        if (img.getNext()) img.getNext().dispose();
		if (googlePlay) googlePlay.style.background = 'none';

        // Attach event to button for video play
        overlay.addEvent('click', handler);

        this._stats.supported++;
	},

	getVideoUrl: function(img) {
		var imgParentTable = null,
			imgCite = null;

		if(imgParentTable = img.getParent('a')) {
            var url = imgParentTable.href,
                videoUrl = /url\?url=(.*)&rct=/i.exec(url);
            if (videoUrl && videoUrl.length > 1) {
                return decodeURIComponent(videoUrl[1]);
            }
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
	    var elContainer = $(e.target).getParent('table'),
	        elInfoContainer = elContainer.getElement('td:last-child'),
	        elRating = elInfoContainer.getElement('font'),
	        elTitle = elContainer.getElement('a.l'),
	        elVideoLink = elContainer.getElement('td a'),
	        elVideoImg = elContainer.getElement('td a img'),
	        videoUrl = this.getVideoUrl(elVideoImg),
    		supportedHosts = $kc.FeaturesConfig.plugins.InSituVideoFeature.config.supportedHosts,
			hostConfig = videoUrl ? supportedHosts[$ku.String.getHostName(videoUrl)] : null;

	    // set infos in the right panel
	    this.videoPanel.setInfos({
    		title: elTitle.get('html'),
    		rating: '',
			partnerId: $kf.core.FeaturesDisplayNames.ids.ORGANIC,
			hostName: hostConfig.name,
			url: elTitle.get('href')
	    });

	    // set the player
	    this.videoPanel.setPlayer(
    		new $kf.insituvideo.InSituDefaultPlayer({
				data: $kf.insituvideo.InSituVideoFeature.getSwiffData(elVideoImg.getParent('a')),
				document: $win.document
			})
	    );

    	var imgHeight = elVideoImg.getSize().y || 66;
    	var relElement = $('kikin_top') || $('center_col') || $($win.document.body);
		this.videoPanel.setStyle('left', relElement.getPosition().x);
		this.videoPanel.setStyle('top', elVideoImg.getPosition().y+imgHeight);

	    // show the panel and start playing
	    this.videoPanel.open()
	}*/

});