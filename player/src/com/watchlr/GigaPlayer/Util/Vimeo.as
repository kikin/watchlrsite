package com.watchlr.GigaPlayer.Util
{
	import com.watchlr.GigaPlayer.GigaPlayer;
	import com.watchlr.GigaPlayer.Util.VideoState;
	
	import flash.display.DisplayObject;
	import flash.display.Loader;
	import flash.events.Event;
	import flash.events.MouseEvent;
	import flash.events.TimerEvent;
	import flash.net.URLRequest;
	import flash.system.LoaderContext;
	import flash.utils.Timer;
	
	public class Vimeo
	{
		// VIMEO oauth key
		private var VIMEO_OAUTH_KEY:String = "14c2b560b42c7312213d3e76987d2e09";
		
		// flash player version to be used to play video
		private var FLASH_PLAYER_VERSION:String = "10";
		
		// vimeo API version
		private var VIMEO_API_VERSION:int = 2;
		
		private var _vimeoPlayer: Object;
		private var _gigaPlayer: GigaPlayer;
		private var _state:VideoState; 
		private var _currentTime:Number = 0;
		
		private var load_timer:Timer = new Timer(200);
		
		/** 
		 * Constructor
		 */
		public function Vimeo(clip_id:int, width:Number, height:Number, gigaPlayer:GigaPlayer)
		{
			var request : URLRequest = new URLRequest("http://api.vimeo.com/moogaloop_api.swf?oauth_key=" + VIMEO_OAUTH_KEY + "&clip_id=" + clip_id + "&width=" + width + "&height=" + height + "&fullscreen=1&autoplay=true&fp_version=" + FLASH_PLAYER_VERSION + "&api=1&cache_buster=" + (Math.random() * 1000));
			var loaderContext : LoaderContext = new LoaderContext(true);
			
			var loader : Loader = new Loader();
			loader.contentLoaderInfo.addEventListener(Event.COMPLETE, onVimeoPlayerLoaded, false, 0, true);
			loader.load(request, loaderContext);
			
			_state = new VideoState();
			_gigaPlayer = gigaPlayer;
		}
		
		private function onVimeoPlayerLoaded(event:Event): void {
			_vimeoPlayer = event.currentTarget.loader.content;
			_vimeoPlayer.addEventListener('play', onVideoPlaying, false);
			_vimeoPlayer.addEventListener('error', onVideoPlaybackError, false);
			_vimeoPlayer.addEventListener('finish', onVideoFinished, false);
			_vimeoPlayer.addEventListener('loadProgress', onLoadProgressChanged, false);
			_vimeoPlayer.addEventListener('pause', onVideoPaused, false);
			_vimeoPlayer.addEventListener('playProgress', onVideoPlayProgressChanged, false);
			_vimeoPlayer.addEventListener('ready', onVideoReady, false);
			_vimeoPlayer.addEventListener('seek', onVideoSeekChanged, false);
			_vimeoPlayer.addEventListener(MouseEvent.MOUSE_MOVE, _gigaPlayer.onMouseMove, false);
			
			load_timer.addEventListener(TimerEvent.TIMER, playerLoadedCheck);
			load_timer.start();
			
			_gigaPlayer.onVimeoPlayerLoaded();
		}
		
		/**
		 * Wait for Moogaloop to finish setting up
		 */
		private function playerLoadedCheck(e:TimerEvent) : void {
			if (_vimeoPlayer.player_loaded)
			{
				// Moogaloop is finished configuring
				load_timer.stop();
				load_timer.removeEventListener(TimerEvent.TIMER, playerLoadedCheck);
				
				// remove moogaloop's mouse listeners listener
				_vimeoPlayer.disableMouseMove();
			}
		}
		
		/**
		 * Returns the vimeo player.
		 */
		public function getVimeoPlayer(): DisplayObject {
			return DisplayObject(_vimeoPlayer);
		}
		
		public function seek(position:Number):void {
			if (_vimeoPlayer) _vimeoPlayer.seek(position);
		}
		
		public function play():void{
			if (_vimeoPlayer) _vimeoPlayer.play();
		}
		
		public function pause():void{
			if (_vimeoPlayer) _vimeoPlayer.pause();
		}
		
		public function getDuration():Number {
			return _vimeoPlayer ? _vimeoPlayer.duration : 0;
		}
		
		public function isPlaying():Boolean{
			return _state.state == VideoState.PLAYING;
		}
		
		public function curTime():Number{
			return _currentTime;
		}
		
		public function setSize(width:Number, height:Number):void{
			if (_vimeoPlayer) _vimeoPlayer.setSize(width, height);
		} 
		
		public function loadVideo(clip_id:int): void {
			_state.state = VideoState.UNKNOWN;
			_currentTime = 0;
			if (_vimeoPlayer) _vimeoPlayer.loadVideo(clip_id);
		}
		
		private function onVideoPlaying(event:Event): void {
			_state.state = VideoState.PLAYING;
			_gigaPlayer.handleVideoReady();
		}
		
		private function onVideoPaused(event:Event): void {
			_state.state = VideoState.PAUSED;
			_gigaPlayer.handleVideoPaused();
		}
		
		private function onVideoReady(event:Event): void {
			_state.state = VideoState.READY;
			// _gigaPlayer.handlePlayerLoad();
			// _vimeoPlayer.play();
		}
		
		private function onVideoFinished(event:Event): void {
			_state.state = VideoState.FINISHED;
			_gigaPlayer.handleVideoFinished();
		}
		
		private function onVideoPlaybackError(event:Event): void {
			_state.state = VideoState.PLAYBACK_ERROR;
			_gigaPlayer.handleVideoPlaybackError(150);
		}
		
		private function onLoadProgressChanged(event:Event): void {
			if (event.hasOwnProperty('data') && Object(event).data.bytesLoaded && Object(event).data.bytesTotal)
			{
				_gigaPlayer.handleVideoLoadProgress(Object(event).data.bytesLoaded, Object(event).data.bytesTotal);
			}
		}
		
		private function onVideoPlayProgressChanged(event:Event): void {
			if (event.hasOwnProperty('data') && Object(event).data.seconds)
			{
				trace('Current time: ' + Object(event).data.seconds);
				_currentTime = Object(event).data.seconds;
			}
			
			_gigaPlayer.handleVideoTimeChanged();
		}
		
		private function onVideoSeekChanged(event:Event): void {
			
		}
	}
}