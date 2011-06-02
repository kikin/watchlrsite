com.kikin.VideoPanelController = function() {

    function _stylizeVideoTitles() {
        Cufon.replace('h3.video-title, .section-title, h4', {
                    fontFamily: 'vag',
                    forceHitArea: true,
                    hover: true
                });
    }

    var current_vid = null;
    var LIKED_ICON_CONTAINER = ".heart-container";
    var LIKED_ICON_ID_PREFIX = "#liked-icon-vid-";
    var LIKED_INFO_CONTAINER_ID_PREFIX = "#video-liked-info-vid-";
    var VIDEO_CONTAINER_ID_PREFIX = "#video-";
    var VIDEO_BUTTON_ID_PREFIX = "#video-thumbnail-btn-vid-";
    var VIDEO_BUTTON_CLASS = "video-thumbnail-btn";
    var SAVE_VIDEO_BUTTON_CONTAINER = ".save-video-button";
    var SAVE_VIDEO_BUTTON_ID_PREFIX = "#save-video-button-vid-";

    var DELETE_VIDEO_ICON_CONTAINER = ".video-delete-button";
    var LOADING_DIV_HTML = '<div style="width:100%;text-align:center;">' +
            '<div class="loading" style="margin-left:auto;margin-right:auto;width:60px;height:60px;"></div>' +
            '</div>';
    var VIDEO_PLAYER_ID_PREFIX = "#video-player-";
    var VIDEO_EMBED_CONTAINER_PREFIX = "#video-embed-container-";
    return {
        populatePanel : function(panel_container_selector, contentSource, request_params) {
            $(panel_container_selector).empty();
            $(panel_container_selector).html(LOADING_DIV_HTML);
            $.get(contentSource, request_params, function(data) {
                $(panel_container_selector).empty();
                $(panel_container_selector).html(data);
                _stylizeVideoTitles();

                $(LIKED_ICON_CONTAINER).each(function() {
                    $(this).mouseover(function() {
                        if ($(this).hasClass('no-hover'))
                            $(this).removeClass('no-hover');
                        if (!$(this).hasClass('hovered'))
                            $(this).addClass('hovered');
                    });

                    $(this).mouseout(function() {
                        if ($(this).hasClass('hovered'))
                            $(this).removeClass('hovered');
                        if (!$(this).hasClass('no-hover'))
                            $(this).addClass('no-hover');
                    });
                });

                $(DELETE_VIDEO_ICON_CONTAINER).each(function() {
                    $(this).mouseover(function() {
                        if ($(this).hasClass('no-hover'))
                            $(this).removeClass('no-hover');
                        if (!$(this).hasClass('hovered'))
                            $(this).addClass('hovered');
                    });

                    $(this).mouseout(function() {
                        if ($(this).hasClass('hovered'))
                            $(this).removeClass('hovered');
                        if (!$(this).hasClass('no-hover'))
                            $(this).addClass('no-hover');
                    });

                });

                $(SAVE_VIDEO_BUTTON_CONTAINER).each(function() {
                    $(this).mouseover(function() {
                        if ($(this).hasClass('no-hover'))
                            $(this).removeClass('no-hover');
                        if (!$(this).hasClass('hovered'))
                            $(this).addClass('hovered');
                    });

                    $(this).mouseout(function() {
                        if ($(this).hasClass('hovered'))
                            $(this).removeClass('hovered');
                        if (!$(this).hasClass('no-hover'))
                            $(this).addClass('no-hover');
                    });

                });

            });
        },
        loadPlayer : function(vid) {
            if(current_vid){
                $(VIDEO_PLAYER_ID_PREFIX + current_vid).fadeOut(1000);
                if(!$(VIDEO_BUTTON_ID_PREFIX + current_vid).hasClass(VIDEO_BUTTON_CLASS)){
                $(VIDEO_BUTTON_ID_PREFIX + current_vid).addClass(VIDEO_BUTTON_CLASS)
            }
            }

            /*remove the 'play' button from the thumb...*/
            if($(VIDEO_BUTTON_ID_PREFIX + vid).hasClass(VIDEO_BUTTON_CLASS)){
                    $(VIDEO_BUTTON_ID_PREFIX + vid).removeClass(VIDEO_BUTTON_CLASS)
                }
            var video_player_div = $(VIDEO_PLAYER_ID_PREFIX + vid);
            var video_embed_div = $(VIDEO_EMBED_CONTAINER_PREFIX+vid);

            /*for nice expando effect...*/
            var video_player_target_width = '100%';
            var video_player_target_height = video_player_div.height();

            video_player_div.css({width:0, height:0});

            video_embed_div.hide();

            video_player_div.fadeIn(100);

            video_player_div.animate({width:video_player_target_width,
                        height:video_player_target_height}, 500,
                        function(){
                            video_embed_div.fadeIn(100);
                        });
            current_vid = vid;
        },

        closePlayer : function(vid){
            var video_player_div = $(VIDEO_PLAYER_ID_PREFIX + vid);
            video_player_div.fadeOut();
            if(!$(VIDEO_BUTTON_ID_PREFIX + vid).hasClass(VIDEO_BUTTON_CLASS)){
                $(VIDEO_BUTTON_ID_PREFIX + vid).addClass(VIDEO_BUTTON_CLASS)
            }
        },

        handleLike : function(vid){
            if(!$(LIKED_ICON_ID_PREFIX+vid).hasClass('liked'))
            {
                $.get('/api/like/'+vid, function(data){
                   var video_properties = data.result;
                   if(video_properties){
                        if(video_properties.liked){
                            //update the icon...
                            if(!$(LIKED_ICON_ID_PREFIX+vid).hasClass('liked')){
                                if(data.result.liked){
                                    $(LIKED_ICON_ID_PREFIX+vid).addClass('liked');
                                    if(data){
                                        $(LIKED_INFO_CONTAINER_ID_PREFIX+vid).fadeOut(1000, function(){
                                            $(LIKED_INFO_CONTAINER_ID_PREFIX+vid).empty();
                                            $(LIKED_INFO_CONTAINER_ID_PREFIX+vid).html(data.result.likes);
                                            $(LIKED_INFO_CONTAINER_ID_PREFIX+vid).fadeIn(1000);
                                        });
                                    }
                                }
                            }
                        }
                   }
                });
            }else{
              $.get('/api/unlike/'+vid, function(data){
                   var video_properties = data.result;
                   if(video_properties){
                        if(!video_properties.liked){
                            //update the icon...
                            if($(LIKED_ICON_ID_PREFIX+vid).hasClass('liked')){
                                if(!data.result.liked){
                                    $(LIKED_ICON_ID_PREFIX+vid).removeClass('liked');
                                    if(data){
                                        $(LIKED_INFO_CONTAINER_ID_PREFIX+vid).fadeOut(1000, function(){
                                            $(LIKED_INFO_CONTAINER_ID_PREFIX+vid).empty();
                                            if(data.result.likes != 0){
                                                $(LIKED_INFO_CONTAINER_ID_PREFIX+vid).html(data.result.likes);
                                                $(LIKED_INFO_CONTAINER_ID_PREFIX+vid).css({'color':'#777777'});
                                                $(LIKED_INFO_CONTAINER_ID_PREFIX+vid).fadeIn(1000);
                                            }
                                        });
                                    }
                                }
                            }
                        }
                   }
                });
            }
        },

        removeVideo : function(vid){
            $.get('/api/remove/'+vid, function(data){
                $(VIDEO_CONTAINER_ID_PREFIX+vid).fadeOut(800, function(){
                    $(VIDEO_CONTAINER_ID_PREFIX+vid).remove();
                });
            });            
        }
    };

};