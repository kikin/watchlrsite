package com.watchlr.GigaPlayer.Util
{
	import com.watchlr.GigaPlayer.GigaPlayer;
	
	import flash.display.DisplayObject;
	import flash.display.Loader;
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.events.MouseEvent;
	import flash.events.TimerEvent;
	import flash.net.URLRequest;
	import flash.utils.Timer;

	public class BrightCove
	{
		private var _brightcoveBootloader:Object;
		private var _brightcoveMainPlayer:Object;
		private var _brightcovePlayer:Object;
		private var _brightcoveVideoPlayer:Object;
		private var _brightcoveContentPlayer:Object;
		
		private var load_timer:Timer;
		private var _gigaPlayer:GigaPlayer;
		
		public function BrightCove(url:String, gigaPlayer:GigaPlayer)
		{
			var request:URLRequest = new URLRequest(url);
			var loader:Loader = new Loader();
			loader.contentLoaderInfo.addEventListener(Event.INIT, onPlayerLoaded);
			loader.load(request);
			
			_gigaPlayer = gigaPlayer;
		}
		
		private function onPlayerLoaded(event: Event):void {
			_brightcoveBootloader = event.currentTarget.loader.content;
			
			_gigaPlayer.onBrightcovePlayerLoaded();
			
			load_timer = new Timer(400);
			load_timer.addEventListener(TimerEvent.TIMER, onMainPlayerLoaded);
			load_timer.start();
		}
		
		private function onMainPlayerLoaded(event:Event): void {
			try {
				_brightcoveMainPlayer = (Sprite(_brightcoveBootloader)).getChildAt(0);
//				load_timer.stop();
//				load_timer.removeEventListener(TimerEvent.TIMER, onMainPlayerLoaded);
				
//				load_timer = new Timer(400);
//				load_timer.addEventListener(TimerEvent.TIMER, bcChildLoadCheck);
//				load_timer.start();
				
				_brightcovePlayer = (Sprite(_brightcoveMainPlayer)).getChildAt(0);
				_brightcoveVideoPlayer = _brightcovePlayer.getModule('videoPlayer');
				if (_brightcoveVideoPlayer) {
					load_timer.stop();
					load_timer.removeEventListener(TimerEvent.TIMER, onMainPlayerLoaded);	
					
					_brightcoveVideoPlayer.addEventListener('mediaPlay', onVideoPlaying);
					_brightcoveVideoPlayer.addEventListener('mediaError', onVideoPlaybackError);
					_brightcoveVideoPlayer.addEventListener('mediaComplete', onVideoFinished);
//					_brightcoveVideoPlayer.addEventListener('mediaProgress', onLoadProgressChanged);
					_brightcoveVideoPlayer.addEventListener('mediaStop', onVideoPaused);
//					_brightcoveVideoPlayer.addEventListener('playProgress', onVideoPlayProgressChanged);
//					_brightcoveVideoPlayer.addEventListener('ready', onVideoReady);
					_brightcoveVideoPlayer.addEventListener('mediaSeek', onVideoSeekChanged);	
					_brightcoveVideoPlayer.addEventListener(MouseEvent.MOUSE_MOVE, _gigaPlayer.onMouseMove);
				}
			} catch (error:Error) {
				
			}
		}
		
		/**
		 * Returns the vimeo player.
		 */
		public function getBrightcovePlayer(): DisplayObject {
			return DisplayObject(_brightcoveBootloader);
		}
		
		public function seek(position:Number):void {
			if (_brightcoveVideoPlayer) _brightcoveVideoPlayer.seek(position);
		}
		
		public function play():void{
			if (_brightcoveVideoPlayer) _brightcoveVideoPlayer.play();
		}
		
		public function pause():void{
			if (_brightcoveVideoPlayer) _brightcoveVideoPlayer.pause();
		}
		
		public function getDuration():Number {
			return _brightcoveVideoPlayer ? _brightcoveVideoPlayer.getVideoDuration() : 0;
		}
		
		public function isPlaying():Boolean{
			return _brightcoveVideoPlayer ? _brightcoveVideoPlayer.isPlaying() : false;
		}
		
		public function curTime():Number{
			return _brightcoveVideoPlayer ? _brightcoveVideoPlayer.getVideoPosition() : 0;
		}
		
		public function setSize(width:Number, height:Number):void{
			if (_brightcoveVideoPlayer) _brightcoveVideoPlayer.setSize(width, height);
		} 
		
		public function loadVideo(clip_id:String): void {
			if (_brightcoveVideoPlayer) _brightcoveVideoPlayer.loadVideo(clip_id);
		}
		
		private function onVideoPlaying(event:Event): void {
			_gigaPlayer.handleVideoReady();
			
			// Pass on current volume setting
			_brightcoveVideoPlayer.setVolume(_gigaPlayer.volume);			
		}
		
		private function onVideoPaused(event:Event): void {
			_gigaPlayer.handleVideoPaused();
		}
		
		private function onVideoReady(event:Event): void {
			// _gigaPlayer.handlePlayerLoad();
			if (_brightcoveVideoPlayer) _brightcoveVideoPlayer.play();
		}
		
		private function onVideoFinished(event:Event): void {
			_gigaPlayer.handleVideoFinished();
		}
		
		private function onVideoPlaybackError(event:Event): void {
			_gigaPlayer.handleVideoPlaybackError(150);
		}
		
		private function onLoadProgressChanged(event:Event): void {
			if (_brightcoveVideoPlayer)
			{
				_gigaPlayer.handleVideoLoadProgress(_brightcoveVideoPlayer.getVideoBytesLoaded(), _brightcoveVideoPlayer.getVideoBytesTotal());
			}
		}
		
		private function onVideoPlayProgressChanged(event:Event): void {
			_gigaPlayer.handleVideoTimeChanged();
		}
		
		private function onVideoSeekChanged(event:Event): void {
			
		}
		
		private function onMediaRenditionChangeComplete(event:Event): void {
			trace('type:' + (Object(event).type));
		}
	}
}