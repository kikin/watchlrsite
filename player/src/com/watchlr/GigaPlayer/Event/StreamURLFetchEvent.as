package com.watchlr.GigaPlayer.Event
{
	import flash.events.Event;
	
	public class StreamURLFetchEvent extends Event
	{
		public var streamURL:String;
		public static var STREAM_FETCH:String = "STREAM_FETCH";
		
		public function StreamURLFetchEvent(type:String, bubbles:Boolean=false, cancelable:Boolean=false)
		{
			super(type, bubbles, cancelable);
		}
	}
}