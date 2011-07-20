package com.watchlr.GigaPlayer.Util
{
	public class YouTube
	{
		public static var formats:Object = {
			37 : [1920, 1080],
			22 : [1280, 720],
			35 : [854, 480],
			34 : [640, 360],
			18 : [480, 270],
			5 : [400, 224],
			17 : [176, 144],
			13 : [176, 144]
		} 
			
		public function YouTube(){
		}
		
		public static function getFormatUrlMap(content:String):Object{
			var fmt_url_mappings:Object = {};
			var mappingSubstrs:Array = content.split(",");
			var fmtStrRegExp:RegExp = /^[0-9]{2}\|/;
			for(var i:int = 0; i < mappingSubstrs.length;i++){
				var ret:Object = fmtStrRegExp.exec(mappingSubstrs[i]);
				
				if(ret){
					var parts:Array = ret.input.split("|");
					fmt_url_mappings[parts[0]] = parts[1];
				}
			}
			
			return fmt_url_mappings;	
		}
	}
}