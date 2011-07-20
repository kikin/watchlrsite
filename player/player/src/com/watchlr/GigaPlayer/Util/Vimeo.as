package com.watchlr.GigaPlayer.Util
{
	public class Vimeo
	{
		//the formatting token corresponds to clip id... 
		protected static var VIMEO_CLIP_INFO_ROOT:String = "http://vimeo.com/moogaloop/load/clip:%s";
		
		//the fmt substitution tokens are, in order, clip id, signature and timestamp... 
		protected static var VIMDEO_STREAM_ROOT:String = "http://vimeo.com/moogaloop/play/clip:%s/%s/%s";
		
		public function Vimeo()
		{			
		}
		
		
	}
}