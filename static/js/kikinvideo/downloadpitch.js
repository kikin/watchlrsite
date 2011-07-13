var kkn = kikinvideo.util.Kikin;

function browserSpecificPitch(){
    if($.browser.chrome){
        $('#downloadButtonContainer').html('<a href="http://www.watchlr.com/static/downloads/watchlr_installer_1.0.1.crx"><div class="downloadapp">&nbsp;</div></a>')
    }
    else if($.browser.mozilla){
        $('#downloadButtonContainer').html('<a href="http://www.watchlr.com/static/downloads/watchlr_installer_1.0.1.xpi"><div class="downloadapp">&nbsp;</div></a>')
    }else{
        $('#downloadButtonContainer').html('Your browser is not supported (we support Chrome and Firefox on Mac and PC).');
    }
}