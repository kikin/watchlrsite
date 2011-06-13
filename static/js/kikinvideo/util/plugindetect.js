if(kikinvideo.util.Kikin.isSupportedClientAgent()){
    var iChromePluginInitTries = 0;
    $(window).load(function() {

        if(iChromePluginInitTries<5 && kikinvideo.util.Kikin.isChromeInstallation() && !window.kikin){
            iChromePluginInitTries++
            setTimeout(arguments.callee, 500);
            return;
        }

        if(!kikinvideo.util.Kikin.createPlugin()){
            $.get('/content/plugin_pitch', function(content){
                    $('.right-panel').prepend(content);
                    $('#plugin-pitch').fadeIn(1000);
               //     $('#plugin-pitch-close').click(function(){
               //             $('#plugin-pitch').fadeOut();
               //     });
            });
        }
    });
}