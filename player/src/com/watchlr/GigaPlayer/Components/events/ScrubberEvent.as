package com.watchlr.GigaPlayer.Components.events
{
	import flash.events.Event;
	
	public class ScrubberEvent extends Event
	{
		
		public var time:Number;
		
		public static const DEFAULT_NAME:String = "SCRUBBER_EVENT";
		public static const SCRUB:String = "SCRUB";
		
		public function ScrubberEvent(type:String, bubbles:Boolean=false, cancelable:Boolean=false)
		{
			super(type, bubbles, cancelable);
		}
	}
}