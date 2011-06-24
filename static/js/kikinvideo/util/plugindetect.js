var iChromePluginInitTries = 0;
var pluginPresent = true;

$(window).load(function() {

    if(iChromePluginInitTries<5 && kikinvideo.util.Kikin.isChromeInstallation() && !window.kikin){
        iChromePluginInitTries++
        setTimeout(arguments.callee, 500);
        return;
    }

    if(!kikinvideo.util.Kikin.createPlugin()){
        pluginPresent = false;
        $.get('/content/plugin_pitch', function(content){
                $('.right-panel').prepend(content);
                $('#plugin-pitch').fadeIn(1000);
                $('#content').css({'min-height':1100});
                $('#video-section').css({marginLeft:'0px'});
                $('#lnk-page-next').css({marginLeft:'0px'});
        });
    }
});