WatchlrPlayer, our video player, is an embeddable mx:Application wrapping an instance of GigaPlayer (which shall one day kick the ass of VHX's MegaPlayer), a subclass of the Spark VideoPlayer component.

I've included the eclipse ".project" directory, though the contained config files may contain absolute paths to dirs on my machine so you may wish to edit it and remove it from revision control.

Look to "html-template/index.template.html" for an embedding example (via JS using swfobject.js and also directly in-document using the <object> tag).

A number of essential functions are exposed to scripts in the containing document:
	
	play():void -- play video 
	
	pause():void -- pause video
	
	seek(seconds:Number):void -- seek to the specified point (in seconds).  Important: attempts to seek beyond the point buffered will fail.
				  	To ensure that you do not do this, either use the onLoadProgressChange callback function in combination 
				  	with the duration function, or just the setSeekTarget function (see below).
				  	
	setSeekTarget(seconds:Number):void -- sets a target seek position for video.  If the player had buffered beyond this point
					the player will immediately jump to it and begin playback.  Otherwise, it will begin playback
					after the inidicated position has been buffered beyond.
					
	getDuration():Number -- returns the current video's duration in seconds
	
	getCurrentTime():Number -- returns the current playback position of the video.
	
Additionally, the WatchlrPlayer API provides a number of callbacks:
	onPlayerReady() -- invoked when the player is ready to receive function invocations
	
	onPlayerPaused() -- invoked when the player has been paused
	
	onLoadProgressChange(currentBytes:Number, totalBytes:Number) -- invoked periodically as video buffers
	
	onCurrentTimeChange(currentTime:Number) -- invoked periodically as video plays back   
	
	onVideoEnded() -- invoked when video playback is complete