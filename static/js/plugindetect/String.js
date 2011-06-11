
kikinvideo.String = {
	/**
	 * @param {String} minimum version number
	 * @param {String} current version number
	 */
	hasRequiredVersion:function(_min,_current){
		var minVer = _min.split('.'),
			curVer = _current.split('.'),
			bSame = false;
		
		for(var yy=0;yy<curVer.length;yy++){
			bSame = false;
			if(minVer.length <= yy ){
				minVer.push('0');
			}
			var iMin = parseInt(minVer[yy]),
				iCur = parseInt(curVer[yy]);
			if(iMin<iCur){
				return true;
			}else if(iMin==iCur){
				bSame = true;
			}else{
				return false;
			}
		}
		return bSame;
	}
 };