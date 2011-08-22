package com.watchlr.GigaPlayer.Util
{
	import com.adobe.serialization.json.JSON;
	
	import flash.events.Event;
	import flash.events.IOErrorEvent;
	import flash.net.URLLoader;
	import flash.net.URLRequest;
	import flash.net.URLRequestMethod;
	import flash.net.URLVariables;

	public class Tracker
	{
		private static var BASE_URL:String = "http://www.watchlr.com/api/track/";
		
		private static var AGENT_NAME:String = 'video-player';
		private static var AGENT_VERSION:String = '1.0';
		
		public function Tracker(){	
		}
		
		public static function trackAction(action:String, objectId:String):void{
			var loader:URLLoader = new URLLoader();
			
			loader.addEventListener(IOErrorEvent.IO_ERROR, onIOError);
			loader.addEventListener(Event.COMPLETE, onComplete);
			
			var request:URLRequest = new URLRequest(BASE_URL + 'action');
			request.method = URLRequestMethod.GET;
			
			var variables:URLVariables = new URLVariables();
			variables.action = 'facebook-view';
			variables.id = objectId;
			variables.agent = AGENT_NAME;
			variables.version = AGENT_VERSION;
			
			request.data = variables;
			loader.load(request);
		}
		
		public static function onIOError(event:Event):void{
			trace('Error sending tracking request');
		}
		
		public static function onComplete(event:Event):void{
			var response:String = event.target.data;
			trace('Tracker response: ' + response);
			
			var json:Object = JSON.decode(response);
			if (json.success != true) {
				trace('Error tracking user action');
			}
		}
	}
}