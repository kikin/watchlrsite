kikinvideo.ProfileViewController = function(){

    var QUEUE_ITEM_COUNT_META_SELECTOR = "meta[name=queue_item_count]";

    var UID_META_SELECTOR = "meta[name=profile_subject]";

    var DEFAULT_VID_COUNT = 10;

    var vidsToLoad = DEFAULT_VID_COUNT;

    function _stylizeVideoTitles() {
	     Cufon.replace('.video-title, .activity-item-video-title, .section-title, h4', {
	                 fontFamily: 'vag',
	                 forceHitArea: true,
	                 hover: true
	             });
    }

    function _loadContent(){
        var uid = $(UID_META_SELECTOR).attr('content');
        $.get(LIKED_VIDEOS_CONTENT_URL, {'start':0, 'count':vidsToLoad, 'user_id':uid}, function(){
            $(VIDEO_PANEL_SELECTOR).prepend(LOADING_DIV_HTML);
            $(LOADING_ICON_BACKGROUND).css({width:$(document).width(),
                            height:$(document).height()});
        });
    }

    return{
            
    }
}

$(document).ready(
        function(){
            homeViewController.videoPanelController.stylizeVideoTitles();
        }
);
