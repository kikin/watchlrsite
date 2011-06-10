if(com.kikin.video.Kikin.isSupportedClientAgent()){
    var iChromePluginInitTries = 0;
    $(window).load(function() {

        if(iChromePluginInitTries<5 && com.kikin.video.Kikin.isChromeInstallation() && !window.kikin){
            iChromePluginInitTries++
            setTimeout(arguments.callee, 500);
            return;
        }

        if(!com.kikin.video.Kikin.createPlugin()){
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