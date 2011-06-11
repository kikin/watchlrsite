kikinvideo.HomeViewController = function() {

    var curVidEmbedObj;

    var currentUser;

    /*Selectors and selector-prefixes*/

    var LIKED_ICON_CONTAINER = ".heart-container";

    var LIKED_ICON_ID_PREFIX = "#liked-icon-vid-";

    var LIKED_INFO_CONTAINER_ID_PREFIX = "#video-liked-info-vid-";

    var VIDEO_CONTAINER_ID_PREFIX = "#video-";

    var ACTIVITY_ITEM_CONTAINER_ID_PREFIX = "#activity-queue-item-vid-";

    var ACTIVITY_ITEM_HEADER_ID_PREFIX = "#activity-item-header-vid-";

    var SAVE_VIDEO_BUTTON_CONTAINER = ".save-video-button";

    var SAVE_VIDEO_BUTTON_ID_PREFIX = "#save-video-button-vid-";

    var DELETE_VIDEO_ICON_CONTAINER = ".video-delete-button";

    var LOAD_MORE_VIDEOS_BUTTON_ID = "#lnk-page-next";

    var QUEUE_ITEM_COUNT_META_SELECTOR = "meta[name=queue_item_count]";

    var UID_META_SELECTOR = "meta[name=profile_subject]";

    var INITIAL_PAGINATION_THRESHOLD = 10;

    var likedVideosPaginationThreshold = INITIAL_PAGINATION_THRESHOLD;

    var saveVideosPaginationThreshold = INITIAL_PAGINATION_THRESHOLD;

    var activityItemsPaginationThreshold = INITIAL_PAGINATION_THRESHOLD;

    //set to whatever num of these you want to initially load...
    var savedVideosToLoad = 10;

    var likedVideosToLoad = 10;

    var activityItemsToLoad = 10;

    /*content that is displayed on tab switch...*/
    var LOADING_DIV_HTML = '<div class="loading-container">' +
            '<div class="loading"></div>' +
            '</div>';

    var uid = $(UID_META_SELECTOR).attr('content');

    /*hashbang url routing...*/
    function onHashChange(hash_url){
        var url_content = parseHashURL(hash_url);

        if(url_content.path == LIKE_VIDEO_PATH){
            handleLike(url_content.params.vid);
        }if(url_content.path == REMOVE_VIDEO_PATH){
            removeVideo(url_content.params.vid);
        }if(url_content.path == SAVED_QUEUE_PATH){
            swapTab(TAB_SELECTORS.savedQueue);
            activeView = VIEWS.savedQueue;
            _populatePanel(VIDEO_PANEL_SELECTOR, SAVED_VIDEOS_CONTENT_URL, {});
        }if(url_content.path == LIKED_QUEUE_PATH){
            swapTab(TAB_SELECTORS.likedQueue);
            activeView = VIEWS.likedQueue;
            _populatePanel();
        }if(url_content.path == ACTIVITY_QUEUE_PATH){
            swapTab(TAB_SELECTORS.activity);
            activeView = VIEWS.activity;
            _populatePanel();
        }if(url_content.path == LOAD_MORE_VIDEOS_PATH){
            homeViewController.loadMoreVideos();
        }
    }

    $(window).hashchange(function() {
        onHashChange(window.location.hash);
    });

    function _loadMoreVideos(){
        if(activeView == VIEWS.likedQueue){
            likedVideosToLoad += INITIAL_PAGINATION_THRESHOLD;
            likedVideosPaginationThreshold += INITIAL_PAGINATION_THRESHOLD;
        }else if(activeView == VIEWS.savedQueue){
            savedVideosToLoad += INITIAL_PAGINATION_THRESHOLD;
            saveVideosPaginationThreshold += INITIAL_PAGINATION_THRESHOLD;
        }if(activeView == VIEWS.activity){
            activityItemsToLoad += INITIAL_PAGINATION_THRESHOLD;
            activityItemsPaginationThreshold += INITIAL_PAGINATION_THRESHOLD;
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

        if(activeView == VIEWS.likedQueue){
            contentSource = LIKED_VIDEOS_CONTENT_URL;
            requestParams = {'start':0, 'count':likedVideosToLoad};
        }else if (activeView == VIEWS.savedQueue){
            contentSource = SAVED_VIDEOS_CONTENT_URL;
            requestParams = {'start':0, 'count':savedVideosToLoad};
        }else if (activeView == VIEWS.activity){
            contentSource = ACTIVITY_CONTENT_URL;
            requestParams = {'start':0, 'count':activityItemsToLoad};
        }

        if(uid)
            requestParams.user_id = uid;


        $.get(contentSource, requestParams, function(data) {
            $(VIDEO_PANEL_SELECTOR).html(data);
            stylizeVideoTitles();

            _bindVideoPanelEvents();

            var queueItemCount = parseInt($(QUEUE_ITEM_COUNT_META_SELECTOR).attr('content'));

            if(activeView == VIEWS.likedQueue){
                if(queueItemCount >= likedVideosPaginationThreshold){
                    $(LOAD_MORE_VIDEOS_BUTTON_ID).show();
                }else{
                    $(LOAD_MORE_VIDEOS_BUTTON_ID).hide();
                }
            }else if(activeView == VIEWS.savedQueue){
                if(queueItemCount >= saveVideosPaginationThreshold){
                    $(LOAD_MORE_VIDEOS_BUTTON_ID).show();
                }else{
                    $(LOAD_MORE_VIDEOS_BUTTON_ID).hide();
                }
            }else if(activeView == VIEWS.activity){
                if(queueItemCount >= activityItemsToLoad){
                    $(LOAD_MORE_VIDEOS_BUTTON_ID).show();
                }else{
                    $(LOAD_MORE_VIDEOS_BUTTON_ID).hide();
                }
            }

        });
    };

    function removeVideo(vid){
        $.get('/api/remove/'+vid, function(data){
            $(VIDEO_CONTAINER_ID_PREFIX+vid).fadeOut(800, function(){
                $(VIDEO_CONTAINER_ID_PREFIX+vid).remove();
                if(activeView == VIEWS.savedQueue){
                    if($("."+VIDEO_CONTAINER_CLASS).length == 0){
                        _populatePanel(VIDEO_PANEL_SELECTOR, SAVED_VIDEOS_CONTENT_URL, {});
                    }
                }
            });
        });
    }

    function handleLike(vid){
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
                                        if(activeView == VIEWS.activity){
                                            var activity_item_header = $(ACTIVITY_ITEM_HEADER_ID_PREFIX+vid);
                                            var like_details = trim(activity_item_header.html());
                                            like_details = 'You and '+like_details;
                                            activity_item_header.fadeOut(500, function(){
                                                like_details = like_details.replace('likes', 'like');
                                                activity_item_header.html(like_details);
                                                activity_item_header.fadeIn(500);
                                            });
                                        }
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
                                            if(activeView == VIEWS.activity){
                                                //replace text in the header to reflect updated
                                                // activity item state (i.e. "You and xxxx like this video"
                                                // becomes "xxxx likes this video")
                                                var activity_item_header = $(ACTIVITY_ITEM_HEADER_ID_PREFIX+vid);
                                                var like_details = trim(activity_item_header.html());
                                                if(data.result.likes == 1){
                                                    like_details = like_details.replace('You and ', '');
                                                    like_details = like_details.replace('like', 'likes');
                                                }else{
                                                    like_details = like_details.replace('You and ', '');
                                                }
                                                activity_item_header.fadeOut(500, function(){
                                                    activity_item_header.html(like_details);
                                                    activity_item_header.fadeIn(500);
                                                });
                                            }
                                        }else if(activeView == VIEWS.activity){
                                            //means that we are in activity queue AND had been the only
                                            //"liker" of this video, so we may gracefully remove it
                                            $(ACTIVITY_ITEM_CONTAINER_ID_PREFIX+vid).fadeOut(1000);
                                        }
                                    });
                                    if(activeView == VIEWS.likedQueue){
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
    }


    return {
        loadMoreVideos : _loadMoreVideos,

        populatePanel : _populatePanel,

        onHashChange : onHashChange,

        handleLike : handleLike,

        removeVideo : removeVideo,

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

    };

};

$(document).ready(function(){
    var homeViewController = new kikinvideo.HomeViewController();
    window.location = "/#!/saved_queue";
});