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

    return{
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
                    }
                },
                failure : function(err_msg){
                    showErrorDialog(err_msg);
                }
            });
        }
    }
}

$(document).ready(
        function(){
            var profileViewController = new kikinvideo.ProfileViewController();
            /*bind hashchange listeners to corresponding event*/
            $(window).hashchange(function() {
                var url_content = parseHashURL(window.location.hash);
                if(url_content.path == FOLLOW_USER_PATH){
                    profileViewController.handleFollow(url_content.params.user);
                }if(url_content.path == UNFOLLOW_USER_PATH){
                    profileViewController.handleUnfollow(url_content.params.user);
                }
            });
        }
);
