package com.watchlr.GigaPlayer.Util {
	public class VideoState {
		public static const UNKNOWN:int = 0;
		public static const READY:int = 1;
		public static const PLAYING:int = 2;
		public static const PAUSED:int = 3;
		public static const FINISHED:int = 4;
		public static const PLAYBACK_ERROR:int = 6;
		
		private var _state:int = UNKNOWN;
		
		public function get state(): int {
			return _state;
		}
		
		public function set state(newState:int): void {
			_state = newState;
		}
	}
}