package com.watchlr
{
	public class Globals
	{
		//js callback signatures
		public static var JS_SIGNATURES:Object = {
			ON_PLAYER_READY : "WatchlrPlayerInterface.onPlayerReady",
			ON_PAUSED : "WatchlrPlayerInterface.onPlayerPaused",
			LOAD_PROGRESS : "WatchlrPlayerInterface.onLoadProgressChange",
			SEEK_START : "WatchlrPlayerInterface.onSeekStart",
			SEEK_END : "WatchlrPlayerInterface.onSeekEnd",
			ON_CURRENT_TIME_CHANGE : "WatchlrPlayerInterface.onCurrentTimeChange",
			ON_FINISHED : "WatchlrPlayerInterface.onVideoFinished",
			PLAYBACK_ERROR: "WatchlrPlayerInterface.onPlaybackError"
		}
	}
}