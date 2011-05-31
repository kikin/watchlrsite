com.kikin.VideoPanelController = function(){

    function _stylizeVideoTitles(){
        Cufon.replace('h3.video-title, .section-title, h4', {
                    fontFamily: 'vag',
                    forceHitArea: true,
                    hover: true
                });
    }

    var LIKED_ICON_CONTAINER_SELECTOR = ".heart-container";
    return {
        populatePanel : function(panel_container_selector, contentSource, request_params){
            $.get(contentSource, request_params, function(data){
                $(panel_container_selector).empty();
                $(panel_container_selector).html(data);
                _stylizeVideoTitles();
                $(LIKED_ICON_CONTAINER_SELECTOR).each(function(){
                    $(this).mouseover(function(){
                        if($(this).hasClass('no-hover'))
                            $(this).removeClass('no-hover');
                        if(!$(this).hasClass('hovered'))
                            $(this).addClass('hovered');
                    });

                    $(this).mouseout(function(){
                        if($(this).hasClass('hovered'))
                            $(this).removeClass('hovered');
                        if(!$(this).hasClass('no-hover'))
                            $(this).addClass('no-hover');
                    });

                    $(this).click(function(event){

                        if($(this).hasClass('hovered'))
                            $(this).removeClass('hovered');
                        if($(this).hasClass('no-hover'))
                            $(this).removeClass('no-hover');

                        /*
                        *   INSERT LOGIC HERE TO "like" videos
                        *   -- e.g. $.get with return check
                        * */
                        
                         if(!$(this).hasClass('liked'))
                            $(this).addClass('liked');
                        else{
                            if($(this).hasClass('liked'))
                                $(this).removeClass('liked');
                         }
                    });
                });
                
            });
        }
    };

};