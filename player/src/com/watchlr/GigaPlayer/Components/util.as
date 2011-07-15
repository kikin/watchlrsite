package com.watchlr.GigaPlayer.Components
{
	import spark.components.VideoDisplay;
	
	public class util
	{
		public function util()
		{
		}
		
		//a close approximation of the time to which videoDisplay has
		//been buffered
		public static function timeBuffered(videoDisplay:VideoDisplay):Number{
			var buffered:Number = videoDisplay.bytesLoaded;
			var bufferTotal:Number = videoDisplay.bytesTotal;
			var time:Number = videoDisplay.duration*(buffered/bufferTotal);
			return time;
		}
	}
}