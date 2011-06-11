if(kikinvideo.Kikin.isSupportedClientAgent()){
    var iChromePluginInitTries = 0;
    $(window).load(function() {

        if(iChromePluginInitTries<5 && kikinvideo.Kikin.isChromeInstallation() && !window.kikin){
            iChromePluginInitTries++
            setTimeout(arguments.callee, 500);
            return;
        }

        if(!kikinvideo.Kikin.createPlugin()){
            $.get('/content/plugin_pitch', function(content){
                    $('body').prepend(content);
                    $('#plugin-pitch').fadeIn(1000);
                    $('#plugin-pitch-close').click(function(){
                            $('#plugin-pitch').fadeOut();
                    });
            });
        }
    });
}