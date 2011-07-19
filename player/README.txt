Contained in the present directory is a web video player implemented atop the Flash runtime.  In order to hack support for YouTube and Vimeo, the player works in the following way:

"src" param is passed in to the embed via flashvars (see bin-debug/WatchlrPlayer.html and the corresponding template).

If src is the url for a raw mp4 stream, the stream will be loaded into a VideoDisplay (the "videoDisplay" member of the GigaPlayer class).  

If src points to a subdomain of vimeo.com, run an ugly routine to get the raw mp4 stream (see com.watchlr.GigaPlayer.Util.Util) and load that into the VideoDisplay.

If src points to a subdomain of youtube.com/yt.com, hide the VideoDisplay and present a chromeless YouTube player in its place ("_youTubeLoader" member of the GigaPlayer class).  

Unfortunately, because of the need to hack support for YouTube embeds, there's a lot of logic in the GigaPlayer class that does nothing more than wrap function invocations on VideoDisplay and YouTubeLoader (i.e. if the current video source is YouTube, the play() function will invoke play() on the YouTubeLoader, otherwise it will invoke it on the VideoDisplay).