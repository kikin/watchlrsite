com.kikin.VideoPanelController = function(parent) {

    var current_vid;

    var curVidEmbedObj;

    var currentUser;

    /*Selectors and selector-prefixes*/
    
    var LIKED_ICON_CONTAINER = ".heart-container";

    var LIKED_ICON_ID_PREFIX = "#liked-icon-vid-";

    var LIKED_INFO_CONTAINER_ID_PREFIX = "#video-liked-info-vid-";

    var VIDEO_CONTAINER_ID_PREFIX = "#video-";

    var VIDEO_CONTAINER_CLASS = "video-wrapper";

    var VIDEO_BUTTON_ID_PREFIX = "#video-thumbnail-btn-vid-";

    var FOLLOW_BUTTON_ID_PREFIX = "#follow-button-user-";

    var FOLLOW_LINK_ID_PREFIX = "#follow-link-user-";

    var FOLLOW_COUNT_CONTAINER_ID_PREFIX = "#follower-count-user-";

    var VIDEO_BUTTON_CLASS = "video-thumbnail-btn";

    var SAVE_VIDEO_BUTTON_CONTAINER = ".save-video-button";

    var SAVE_VIDEO_BUTTON_ID_PREFIX = "#save-video-button-vid-";

    var DELETE_VIDEO_ICON_CONTAINER = ".video-delete-button";

    var VIDEO_PLAYER_ID_PREFIX = "#video-player-";

    var LOAD_MORE_VIDEOS_BUTTON_ID = "#lnk-page-next";

    var VIDEO_EMBED_CONTAINER_PREFIX = "#video-embed-container-";

    var VIDEO_EMBED_WRAPPER_PREFIX = "#video-embed-wrapper-";

    var LOADING_ICON_BACKGROUND = ".loading-container";

    var LOADING_ICON = ".loading";

    var VIDEO_COUNT_META_SELECTOR = "meta[name=video_count]";

    var UID_META_SELECTOR = "meta[name=profile_subject]";

    var INITIAL_PAGINATION_THRESHOLD = 10;

    var likedVideosPaginationThreshold = INITIAL_PAGINATION_THRESHOLD;

    var saveVideosPaginationThreshold = INITIAL_PAGINATION_THRESHOLD;

    //set to whatever num of these you want to initially load...
    var savedVideosToLoad = 10;

    var likedVideosToLoad = 10;
    
    /*content that is displayed on tab switch...*/
    var LOADING_DIV_HTML = '<div class="loading-container">' +
            '<div class="loading"></div>' +
            '</div>';

    /*content that is overlayed on video panel when more videos are
    * being loaded (...pagination)*/
    var LOADING_MORE_DIV = '<div id="loading-more"><img src="/static/images/loading_more.gif"/></div>';

    //this is an ugly hack around a jQuery/css issue...see body
    //of _populatePanel
    var initialLoad = true;

    var uid = $(UID_META_SELECTOR).attr('content');
   
    function _loadMoreVideos(){
        if(activeTab == TAB_SELECTORS.likes){
            likedVideosToLoad += INITIAL_PAGINATION_THRESHOLD;
            likedVideosPaginationThreshold += INITIAL_PAGINATION_THRESHOLD;
        }else if(activeTab == TAB_SELECTORS.queue){
            savedVideosToLoad += INITIAL_PAGINATION_THRESHOLD;
            saveVideosPaginationThreshold += INITIAL_PAGINATION_THRESHOLD;
        }
        _populatePanel();
        //invalidate hash url (so a subsequent click of "load more" button will register as hash change)
        window.location.href += "_";
    }

    function _bindVideoPanelEvents(){
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
    }

    function _populatePanel() {
        
            $(VIDEO_PANEL_SELECTOR).prepend(LOADING_DIV_HTML);
            $(LOADING_ICON_BACKGROUND).css({width:$(document).width(),
                            height:$(document).height()});
            

            var contentSource, requestParams;

            if(activeTab == TAB_SELECTORS.likes){
                contentSource = LIKED_VIDEOS_CONTENT_URL;
                requestParams = {'start':0, 'count':likedVideosToLoad};
            }else if (activeTab == TAB_SELECTORS.queue){
                contentSource = SAVED_VIDEOS_CONTENT_URL;
                requestParams = {'start':0, 'count':savedVideosToLoad};
            }

            if(uid)
                requestParams.user_id = uid;


            $.get(contentSource, requestParams, function(data) {
                $(VIDEO_PANEL_SELECTOR).html(data);
                _stylizeVideoTitles();

                _bindVideoPanelEvents();

                var videoCount = parseInt($(VIDEO_COUNT_META_SELECTOR).attr('content'));

                if(activeTab == TAB_SELECTORS.likes){
                    if(videoCount >= likedVideosPaginationThreshold){
                        $(LOAD_MORE_VIDEOS_BUTTON_ID).show();
                    }else{
                        $(LOAD_MORE_VIDEOS_BUTTON_ID).hide();
                    }
                }else if(activeTab == TAB_SELECTORS.queue){
                    if(videoCount >= saveVideosPaginationThreshold){
                        $(LOAD_MORE_VIDEOS_BUTTON_ID).show();
                    }else{
                        $(LOAD_MORE_VIDEOS_BUTTON_ID).hide();
                    }
                }

            });
        };

     function _stylizeVideoTitles() {
	     Cufon.replace('h3.video-title, .section-title, h4', {
	                 fontFamily: 'vag',
	                 forceHitArea: true,
	                 hover: true
	             });
     }

    return {
        loadMoreVideos : _loadMoreVideos,
        
        populatePanel : _populatePanel,
        
        loadPlayer : function(vid) {
            if(current_vid){
                $(VIDEO_PLAYER_ID_PREFIX + current_vid).hide();
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
            var video_player_target_width = video_player_div.width();
            var video_player_target_height = video_player_div.height();

            video_player_div.css({width:0, height:0, 'margin-left':'0px'});

            video_embed_div.hide();

            video_player_div.fadeIn(100);

            video_player_div.animate({width:video_player_target_width,
                        height:video_player_target_height, 'margin-left':'auto'}, 500,
                        function(){
                            //video_embed_div.fadeIn(100);
                              var html5_video_embed_obj = $(VIDEO_EMBED_WRAPPER_PREFIX+vid).children()[0];

                               video_embed_div.show();
                            });
                                        //scroll to the video...
            $('html, body').animate({
                        scrollTop: $(VIDEO_CONTAINER_ID_PREFIX+vid).offset().top-40
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
                                            $(LIKED_INFO_CONTAINER_ID_PREFIX+vid).css({"color":'#ff0000'});
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
                                                    $(LIKED_INFO_CONTAINER_ID_PREFIX+vid).fadeIn(1000);
                                                    $(LIKED_INFO_CONTAINER_ID_PREFIX+vid).css({"color":'#d0d0d0'});
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

        handleFollow : function(user_id){
            $.ajax({
                url : '/api/follow/'+user_id,
                success: function(response){
                    if (response.success){
                        $(FOLLOW_BUTTON_ID_PREFIX+user_id).text("Unfollow");
                        $(FOLLOW_LINK_ID_PREFIX+user_id).attr("href", "#!/unfollow?user="+user_id);
                        var numFollowers = parseInt($(FOLLOW_COUNT_CONTAINER_ID_PREFIX+user_id).html());
                        numFollowers++;
                        $(FOLLOW_COUNT_CONTAINER_ID_PREFIX+user_id).html(numFollowers);
                        window.location += '_';
                    }
                },
                failure : function(err_msg){
                    showErrorDialog(err_msg);
                }
            });
        },

        handleUnfollow : function(user_id){
        $.ajax({
            url : '/api/unfollow/'+user_id,
            success: function(response){
                if (response.success){
                    $(FOLLOW_BUTTON_ID_PREFIX+user_id).text("Follow");
                    $(FOLLOW_LINK_ID_PREFIX+user_id).attr("href", "#!/follow?user="+user_id);
                    var numFollowers = parseInt($(FOLLOW_COUNT_CONTAINER_ID_PREFIX+user_id).html());
                    numFollowers--;
                    $(FOLLOW_COUNT_CONTAINER_ID_PREFIX+user_id).html(numFollowers);
                    window.location += '_';
                }
            },
            failure : function(err_msg){
                showErrorDialog(err_msg);
            }
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
        },

        stylizeVideoTitles : _stylizeVideoTitles
    };

};