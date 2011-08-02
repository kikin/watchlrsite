package com.watchlr.GigaPlayer.Util
{
	import com.watchlr.GigaPlayer.Event.StreamURLFetchEvent;
	import com.watchlr.GigaPlayer.Util.YouTube;
	
	import flash.events.Event;
	import flash.events.EventDispatcher;
	import flash.net.URLLoader;
	import flash.net.URLRequest;
	
	import mx.utils.StringUtil;
	
	public class Util extends EventDispatcher
	{

		//for YouTube...	
		protected static var YOUTUBE_DOMAIN:String = "http://www.youtube.com";
		protected static var YOUTUBE_VID_PATTERN:RegExp = /(embed\/|v=)(?P<vid>[^\?&]+)/i;
		protected static var YOUTUBE_VIDEO_INFO_URL:String = "http://www.youtube.com/get_video_info?video_id=";
		protected static var YOUTUBE_VIDEO_INFO_PARAMS:String = "html5=1&eurl=unknown&el=embedded";
		protected static var YOUTUBE_RAW_STREAM_PARAM_NAME:String = "fmt_stream_map";
		protected static var YOUTUBE_RAW_STREAM_REGEXP:String = "";
		
		//for Vimeo...
		protected static var VIMEO_DOMAIN:String = "http://player.vimeo.com";
		protected static var VIMEO_VID_START_DELIM:String = "/video/";
		protected static var VIMEO_VID_END_DELIM:String = "?";
		//the formatting token corresponds to clip id... 
		protected static var VIMEO_CLIP_INFO_ROOT:String = "http://vimeo.com/moogaloop/load/clip:{0}";
		//the fmt substitution tokens are, in order, clip id, signature and timestamp... 
		protected static var VIMEO_STREAM_ROOT:String = "http://vimeo.com/moogaloop/play/clip:{0}/{1}/{2}";
		
		//for M3U8
		protected static var M3U8_FILE_TYPE:String = ".m3u8";
		
		//the following is unfortunately necessary because the XML 
		//returned by vimeo vid info API sometimes does not
		//itself contain the VID
		private var _lastVimeoVID:String;
		
		
		public function Util(){
		}
		
		public function isYouTube(vid:String):Boolean{
			return startsWith(vid, YOUTUBE_DOMAIN);
		}
		
		public function isVimeo(source:String):Boolean{
			return startsWith(source, VIMEO_DOMAIN);
		}
		
		public function isM3U8(source:String):Boolean{
			return endsWith(source, M3U8_FILE_TYPE);
		}
		
		public function fetchYouTubeStream(iframeSource:String):void{
			var loader:URLLoader = new URLLoader();
			
			loader.addEventListener(Event.COMPLETE, parseYTVidInfo);
			
			var req:URLRequest = new URLRequest(YOUTUBE_VIDEO_INFO_URL +
				iframeSource + "&"+YOUTUBE_VIDEO_INFO_PARAMS);
			
			loader.load(req);
		}
		
		public function fetchVimeoStream(vid:String):void{
			_lastVimeoVID = vid;
			var loader:URLLoader = new URLLoader();
			
			loader.addEventListener(Event.COMPLETE, parseVimeoVidInfo);
			var targetURL:String = StringUtil.substitute(VIMEO_CLIP_INFO_ROOT, vid);
			var req:URLRequest = new URLRequest(targetURL);
			
			loader.load(req);		
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
		
		protected function parseYTVidInfo(event:Event):void{
			var pageContent:String = unescape(event.target.data);
			var sfEvent:StreamURLFetchEvent = new StreamURLFetchEvent(StreamURLFetchEvent.STREAM_FETCH);
			var fmtURLMap:Object = YouTube.getFormatUrlMap(pageContent);
			if(fmtURLMap[35])
				sfEvent.streamURL = fmtURLMap[35];
			else
				sfEvent.streamURL = fmtURLMap[18];
			dispatchEvent(sfEvent);
		}
		
		protected function parseVimeoVidInfo(event:Event):void{
			var xml:XML = new XML(event.target.data);
			var signature:String = xml.request_signature;
			var expires_timestamp:String = xml.request_signature_expires;
			var fullPath:String = StringUtil.substitute(VIMEO_STREAM_ROOT, 
				_lastVimeoVID, signature, expires_timestamp);
			var sfEvent:StreamURLFetchEvent = new StreamURLFetchEvent(StreamURLFetchEvent.STREAM_FETCH);
			sfEvent.streamURL = fullPath;
			dispatchEvent(sfEvent);
			
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