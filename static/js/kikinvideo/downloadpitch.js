var kkn = kikinvideo.util.Kikin;

function browserSpecificPitch(){
    if(kkn.isMac() && $.browser.chrome){
        $('#downloadButtonContainer').html('<a href="http://www.watchlr.com/static/downloads/watchlr_installer_1.0.1.crx"><div class="downloadapp">&nbsp;</div></a>')
    }
    else if($.browser.mozilla){
        if(kkn.isMac()){
            $('#downloadButtonContainer').html('<a href="http://www.watchlr.com/static/downloads/watchlr_installer_1.0.1.xpi"><div class="downloadapp">&nbsp;</div></a>');
        }else if(kkn.isWindows()){
            $('#downloadButtonContainer').html('<a href="http://www.watchlr.com/static/downloads/watchlr_installer_1.0.1.xpi"><div class="downloadapp">&nbsp;</div></a>')
        }
    }else{
        $('#downloadButtonContainer').html('Your browser is not supported (we support Chrome and Firefox on Mac and PC).');
    }
}