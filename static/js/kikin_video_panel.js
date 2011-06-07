com.kikin.VideoPanelController = function(parent) {

    var current_vid;

    var currentUser;

    /*Selectors and selector-prefixes*/
    
    var LIKED_ICON_CONTAINER = ".heart-container";

    var LIKED_ICON_ID_PREFIX = "#liked-icon-vid-";

    var LIKED_INFO_CONTAINER_ID_PREFIX = "#video-liked-info-vid-";

    var VIDEO_CONTAINER_ID_PREFIX = "#video-";

    var VIDEO_CONTAINER_CLASS = "video-wrapper";

    var VIDEO_BUTTON_ID_PREFIX = "#video-thumbnail-btn-vid-";

    var VIDEO_BUTTON_CLASS = "video-thumbnail-btn";

    var SAVE_VIDEO_BUTTON_CONTAINER = ".save-video-button";

    var SAVE_VIDEO_BUTTON_ID_PREFIX = "#save-video-button-vid-";

    var DELETE_VIDEO_ICON_CONTAINER = ".video-delete-button";

    var VIDEO_PLAYER_ID_PREFIX = "#video-player-";

    var VIDEO_EMBED_CONTAINER_PREFIX = "#video-embed-container-";

    var paginationThreshold = 5;

    var savedVideosToLoad = 5;

    var likedVideosToLoad = 5;
    

    var LOADING_DIV_HTML = '<div style="width:100%;text-align:center;">' +
            '<div class="loading" style="margin-left:auto;margin-right:auto;width:60px;height:60px;"></div>' +
            '</div>';

    function _populatePanel() {
            $(VIDEO_PANEL_SELECTOR).empty();
            $(VIDEO_PANEL_SELECTOR).html(LOADING_DIV_HTML);

            var contentSource, requestParams;

            if(activeTab == TAB_SELECTORS.likes){
                contentSource = LIKED_QUEUE_PATH;
                requestParams = {'start':0, 'count':likedVideosToLoad};
            }else if (activeTab == TAB_SELECTORS.queue){
                contentSource = SAVED_QUEUE_PATH;
                requestParams = {'start':0, 'count':savedVideosToLoad};
            }


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
        };

    /*loads n videos into present panel, where n = paginationThreshold*/
    function _loadMore(){
        if(activeTab == TAB_SELECTORS.likes){
            $.ajax({
                url : LIKED_VIDEOS_CONTENT_URL,
                success : function(content){
                    
                },
                failure : showErrorDialog(content)
           });
        }else if(activeTab == TAB_SELECTORS.queue){
            $.ajax({
                url : SAVED_VIDEOS_CONTENT_URL,
                success : function(content){

                },
                failure : showErrorDialog(content)
           });
        }
    }

     function _stylizeVideoTitles() {
	     Cufon.replace('h3.video-title, .section-title, h4', {
	                 fontFamily: 'vag',
	                 forceHitArea: true,
	                 hover: true
	             });
     }


    return {
        populatePanel : function(panel_container_selector, contentSource, request_params){
            _populatePanel(panel_container_selector, contentSource, request_params);
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
                                        //scroll to the video...
            $('html, body').animate({
                        scrollTop: $(VIDEO_CONTAINER_ID_PREFIX+vid).offset().top-80
                    }, 1000);
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
            {window.location="#!/liked?vid="+vid;
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
              window.location="#!/unliked?vid="+vid;
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

                                        if(activeTab == TAB_SELECTORS.likes){
                                            $(VIDEO_CONTAINER_ID_PREFIX+vid).fadeOut(1000,function(){
                                                    $(VIDEO_CONTAINER_ID_PREFIX+vid).remove();
                                                    if($("."+VIDEO_CONTAINER_CLASS).length == 0){
                                                        _populatePanel(VIDEO_PANEL_SELECTOR, LIKED_VIDEOS_CONTENT_URL, {});
                                                    }
                                            });
                                        }
                                    }
                                }
                            }
                        }
                   }
                });
            }
        },

        handleSave : function(vid){
             $.get('/api/save?vid='+vid, function(data){
                    
             });
        },

        removeVideo : function(vid){
            $.get('/api/remove/'+vid, function(data){
                $(VIDEO_CONTAINER_ID_PREFIX+vid).fadeOut(800, function(){
                    $(VIDEO_CONTAINER_ID_PREFIX+vid).remove();
                    if(activeTab == TAB_SELECTORS.queue){
                        if($("."+VIDEO_CONTAINER_CLASS).length == 0){
                            _populatePanel(VIDEO_PANEL_SELECTOR, SAVED_VIDEOS_CONTENT_URL, {});
                        }
                    }
                });
            });            
        }
    };

};