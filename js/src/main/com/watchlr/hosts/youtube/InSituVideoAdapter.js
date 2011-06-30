/**
 * @package com.watchlr.hosts.youtube.adapters
 */
$cwh.adapters.InSituVideoAdapter.extend("com.watchlr.hosts.youtube.adapters.InSituVideoAdapter", {}, {
	 
	/*attach: function() {
    	// add needed styles
		$ku.Styles.insert('InSituVideoStyles', $win.document);
		var handler = this.onClickVideoThumbnail.bind(this);
        
		// look the page for video images
        $$('a.ux-thumb-wrap').each(function(link) {
        	// is this link useful?
        	var match = link.href.match(/watch\?(.*)/);
        	if (!match || match.length == 0) return;
        	
        	// is there a action menu?
        	var actions = link.getElement('.video-actions');
        	if (!actions) return;
        	
        	new Element('button', {
        		'aria-pressed': 'false',
        		'role': 'button',
        		'title': '',
        		'onclick': 'return false',
        		'type': 'button',
        		'class': 'master-sprite start yt-uix-button yt-uix-button-short yt-uix-tooltip',
        		'styles': {
        			'width': '58px'
        		},
        		'html': '<img alt="" src="http://s.ytimg.com/yt/img/pixel-vfl3z5WfW.gif" style="background-image: url(\'http://kikin-dev.com/kikin/img/tiny-kikin.png\'); height: 16px; width: 16px;"> <span class="yt-uix-button-content"><span class="play-label">Play</span></span>'
        	})
            .addEvent('click', handler)
        	.inject(actions, 'top');
		}, this);
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
	    var elContainer = null,
	    	videoUrl = null,
	    	videoTitle = null,
	    	target = $(e.target);
	    
	    // case1: result page videos
	    if (elContainer = target.getParent('.result-item')) {
	        var elTitle = elContainer.getElement('h3 a'),
	        	elVideoImg = elContainer.getElement('.video-thumb img');
	        
	        videoUrl = elTitle.get('href');
	        videoTitle = elTitle.get('html');
	    
	    // case2: watch page videos
	    } else if (elContainer = target.getParent('.video-list-item')) {
	        var elTitle = elContainer.getElement('span.title'),
	        	elVideoLink = elContainer.getElement('a'),
	        	elVideoImg = elContainer.getElement('.video-thumb img');
	        
	        videoUrl = elVideoLink.get('href');
	        videoTitle = elTitle.get('html');

	    // case3: homepage
	    } else if (elContainer = target.getParent('.feeditem')) {
	    	 var elTitle = elContainer.getElement('h3 a'),
	        	elVideoImg = elContainer.getElement('.video-thumb img');

	        videoUrl = elTitle.get('href');
	        videoTitle = elTitle.get('html');
	    } else {
	    	return;
	    }
	    
	    // set infos in the right panel
	    this.videoPanel.setInfos({
    		title: videoTitle,
    		rating: '',
			partnerId: $kf.core.FeaturesDisplayNames.ids.YOUTUBE,
			hostName: 'Youtube',
			url: videoUrl
	    });
	    
		var videoId = videoUrl.match(/watch\?(.*)/)[1].parseQueryString().v,
			src = 'http://www.youtube.com/v/'+videoId+'?border=0&fs=1&autoplay=1';
	    
	    // set the player
	    this.videoPanel.setPlayer(
    		new $kf.insituvideo.InSituDefaultPlayer({
				data: {
    				src: src,
    				vars: { autoplay: true }
    			},
				document: $win.document
			})
	    );
	    
    	var imgSize = elVideoImg.getSize(),
    		imgWidth = imgSize.x,
    		imgHeight = imgSize.y || 66,
    		winWidth = $($win).getWidth(),
    		imgPosX = elContainer.getPosition().x,
    		left = (imgPosX + 660 < winWidth) ? imgPosX : winWidth - 660 - 20,
    		top = elVideoImg.getPosition().y+imgHeight;
    	
		this.videoPanel.setStyle('left', left);
		this.videoPanel.setStyle('top', top);
	    
	    // show the panel and start playing
	    this.videoPanel.open()
	}  */
			
});