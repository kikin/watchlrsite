package com.watchlr.GigaPlayer.Util
{
	import flash.events.Event;
	import flash.events.EventDispatcher;
	import mx.utils.StringUtil;
	
	public class Util
	{

		//for YouTube...	
		protected static var YOUTUBE_DOMAIN:String = "http://www.youtube.com";
		protected static var YOUTUBE_VID_PATTERN:RegExp = /(embed\/|v=)(?P<vid>[^\?&]+)/i;
		
		//for Vimeo...
		protected static var VIMEO_DOMAIN:String = "http://player.vimeo.com";
		protected static var VIMEO_VID_START_DELIM:String = "/video/";
		protected static var VIMEO_VID_END_DELIM:String = "?";
		
		//for M3U8
		protected static var M3U8_FILE_TYPE:String = ".m3u8";
		
		public function Util(){
		}
		
		public function isYouTube(vid:String):Boolean{
			return startsWith(vid, YOUTUBE_DOMAIN);
		}
		
		public function isVimeo(source:String):Boolean{
			return startsWith(source, VIMEO_DOMAIN);
		}
		
		public function isM3U8(source:String):Boolean{
			return source.indexOf(".m3u8") != -1;
		}
		
		public function isMP4(source:String):Boolean{
			return source.indexOf(".mp4") != -1;
		}
		
		public function YTIframeSourceToVID(source:String):String{
			var substr:String;
			if(YOUTUBE_VID_PATTERN.test(source)) {
				var result:Array = YOUTUBE_VID_PATTERN.exec(source);
				return result.vid;
			}
			return null;
		}
		
		public function VimeoIframeSourceToVID(source:String):String{
			var substr:String;
			//look ma, no regexes!
			if(source.indexOf(VIMEO_VID_START_DELIM) > -1){
				substr = source.substr(source.indexOf(VIMEO_VID_START_DELIM) +
					VIMEO_VID_START_DELIM.length, source.length-1);
				if(substr.indexOf(VIMEO_VID_END_DELIM) > -1){
					return substr.substr(0, substr.indexOf(VIMEO_VID_END_DELIM)); 
				}
			}
			return null;
		}
		
		public static function startsWith(string:String, pattern:String):Boolean{
			string  = string.toLowerCase();
			pattern = pattern.toLowerCase();
			
			return pattern == string.substr( 0, pattern.length );
		}
		
		private static function endsWith(string:String, pattern:String):Boolean{
			string  = string.toLowerCase();
			pattern = pattern.toLowerCase();
			
			return pattern == string.substr((string.length - pattern.length), pattern.length);
		}
	}

}