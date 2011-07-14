var kkn = kikinvideo.util.Kikin;

function browserSpecificPitch(){
    if($.browser.chrome){
        $('#downloadButtonContainer').html('<a href="http://download.watchlr.com/static/plugin/WatchlrInstaller.crx"><div class="downloadapp">&nbsp;</div></a>')
    }
    else if($.browser.mozilla){
        $('#downloadButtonContainer').html('<a href="http://download.watchlr.com/static/plugin/WatchlrInstaller.xpi"><div class="downloadapp">&nbsp;</div></a>')
    }else{
        $('#downloadButtonContainer').html('Your browser is not supported (we support Chrome and Firefox on Mac and PC).');
    }
}