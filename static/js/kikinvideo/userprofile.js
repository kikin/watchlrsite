kikinvideo.ProfileViewController = function(){

    var QUEUE_ITEM_COUNT_META_SELECTOR = "meta[name=queue_item_count]";

    var UID_META_SELECTOR = "meta[name=profile_subject]";

    var DEFAULT_VID_COUNT = 10;

    var vidsToLoad = DEFAULT_VID_COUNT;

    var FOLLOW_BUTTON_ID_PREFIX = "#follow-button-user-";

    var FOLLOW_LINK_ID_PREFIX = "#follow-link-user-";

    var FOLLOW_COUNT_CONTAINER_ID_PREFIX = "#follower-count-user-";

    function _loadContent(){
        var uid = $(UID_META_SELECTOR).attr('content');
        $.get(LIKED_VIDEOS_CONTENT_URL, {'start':0, 'count':vidsToLoad, 'user_id':uid}, function(){
                    $(VIDEO_PANEL_SELECTOR).prepend(LOADING_DIV_HTML);
                    $(LOADING_ICON_BACKGROUND).css({width:$(document).width(),
                        height:$(document).height()});
                });
    }

     function handleFollow(user_id){
            $.ajax({
                url : '/api/follow/'+user_id,
                success: function(response){
                    if (response.success){
                        $(FOLLOW_BUTTON_ID_PREFIX+user_id).text("Unfollow");
                        $(FOLLOW_LINK_ID_PREFIX+user_id).attr("href", "javascript:profileViewController.handleUnfollow("+user_id+");");
                        var numFollowers = parseInt($(FOLLOW_COUNT_CONTAINER_ID_PREFIX+user_id).html());
                        numFollowers++;
                        $(FOLLOW_COUNT_CONTAINER_ID_PREFIX+user_id).html(numFollowers);
                        if(activeView == VIEWS.activity){
                            homeViewController.populatePanel();
                        }
                    }
                },
                failure : function(err_msg){
                    showErrorDialog(err_msg);
                }
            });
        }

        function handleUnfollow(user_id){
            $.ajax({
                url : '/api/unfollow/'+user_id,
                success: function(response){
                    if (response.success){
                        $(FOLLOW_BUTTON_ID_PREFIX+user_id).text("Follow");
                        $(FOLLOW_LINK_ID_PREFIX+user_id).attr("href", "javascript:profileViewController.handleFollow("+user_id+")");
                        var numFollowers = parseInt($(FOLLOW_COUNT_CONTAINER_ID_PREFIX+user_id).html());
                        numFollowers--;
                        $(FOLLOW_COUNT_CONTAINER_ID_PREFIX+user_id).html(numFollowers);
                    }
                },
                failure : function(err_msg){
                    showErrorDialog(err_msg);
                }
            });
        }

    return{
        handleFollow : handleFollow,

        handleUnfollow : handleUnfollow
    }
}
var profileViewController;
$(document).ready(
        function(){
            profileViewController = new kikinvideo.ProfileViewController();
            if(activeView == VIEWS.profile)
                homeViewController.bindVideoPanelEvents();
        }
);
