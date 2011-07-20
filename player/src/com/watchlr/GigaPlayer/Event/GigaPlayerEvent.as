package com.watchlr.GigaPlayer.Event
{
	import flash.events.Event;
	
	public class GigaPlayerEvent extends Event
	{	
		public static const TIME_UPDATED:String = "TIME_UPDATED";
		public static const BYTES_LOADED_CHANGE:String = "BYTES_LOADED";
		
		public var time:Number;
		
		public var bytesLoaded:Number;
		public var bytesTotal:Number;
		
		public function GigaPlayerEvent(type:String, bubbles:Boolean=false, cancelable:Boolean=false)
		{
			super(type, bubbles, cancelable);
		}
	}

}