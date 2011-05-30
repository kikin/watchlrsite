com.kikin.VideoPanelController = function(){

    return {

        stylizeVideoTitles : function(){
                Cufon.replace('h3.video-title, .section-title, h4', {
                fontFamily: 'vag',
                forceHitArea: true,
                hover: true
            });
        },

        populatePanel : function(panel_container_selector, contentSource, request_params){
            $.get(contentSource, request_params, function(data){
                $(panel_container_selector).empty();
                $(panel_container_selector).html(data);
                this.stylizeVideoTitles();
            });
        }
    };

};
$(document).ready(function(){

});