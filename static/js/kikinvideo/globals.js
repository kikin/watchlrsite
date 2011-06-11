//project namesapce...
var kikinvideo = {'util':{}};

//the path, in #! url, that indicates video player should be opened
var VIDEO_PLAYER_PATH = '/player';

var VIDEO_PLAYER_CLOSE_PATH = '/close_player';

var LIKE_VIDEO_PATH = '/like';

var REMOVE_VIDEO_PATH = '/remove';

var SAVED_QUEUE_PATH = '/saved_queue';

var LIKED_QUEUE_PATH = '/liked_queue';

var ACTIVITY_QUEUE_PATH = '/activity';

var PROFILE_EDIT_PANEL_OPEN_PATH = '/edit_profile';

var PROFILE_SAVE_PATH = '/save_profile';

var LOAD_MORE_VIDEOS_PATH = '/next';

var LIKED_VIDEOS_CONTENT_URL = '/content/liked_videos';

var SAVED_VIDEOS_CONTENT_URL = '/content/saved_videos';

var ACTIVITY_CONTENT_URL = '/content/activity';

var FOLLOW_USER_PATH = '/follow';

var UNFOLLOW_USER_PATH = '/unfollow';

var PROFILE_OPTIONS_PANEL_SELECTOR = '#options';

var PROFILE_OPTIONS_BUTTON_SELECTOR = '#header-right';

var PROFILE_NAME_DISPLAY = ".profileName";

var VIDEO_PANEL_SELECTOR = '#videoList';

var VIDEO_PANEL_WRAPPER_SELECTOR = "#videoListWrapper";

var PROFILE_EDIT_URL = '/content/profile_edit';

var PROFILE_EDIT_OPEN_BUTTON_SELECTOR = '#myProfile';

var PROFILE_EDIT_CLOSE_BUTTON_SELECTOR = '#profile-view-close';

var PROFILE_EDIT_PANEL_SELECTOR = '#profile-edit-panel';

var PROFILE_EDIT_USERNAME_INPUT = "#username-input";

var PROFILE_EDIT_EMAIL_INPUT = "#email-input";

var SYNDICATE_LIKES_CHECKBOX_ID = "#share-likes-checkbox";

var PROFILE_EDIT_CANCEL_BUTTON_SELECTOR = '.cancel-button';

var GREYED_BACKGROUND_ELEMENT = '<div class="greyed-background" style="display: block;"></div>';

var GREYED_BACKGROUND_SELECTOR = '.greyed-background';

var LOADING_ICON_BACKGROUND = ".loading-container";

var LOADING_ICON = ".loading";

var PLAYBACK_POSITION_API_URL = '/api/seek/';//  /[vid]/[position]

var TAB_SELECTORS = {
    savedQueue : '.tabQueue',
    likedQueue : '.tabLikes',
    activity : '.tabActivity'
};

var VIEWS = {
    savedQueue:0,
    likedQueue:1,
    activity:2,
    profile:3
}

var activeView = VIEWS.likedQueue;

var activeTab = TAB_SELECTORS.savedQueue;

/*utility functions*/

/**
* Function takes full #! url and returns the path + params
* of this URL in a 2-element hash.
*
* @param hash_url the full hash bang url (including '#!').
*/
function parseHashURL(hash_url) {

    var path;

//strip out hash bang   ('#!')...
    var url_content = hash_url.substring(2, hash_url.length);

    if (url_content.search('\\?') == -1) {
        path = url_content;
    }else{
        path = url_content.substring(0, url_content.search('\\?'));
    }

    var urlParams = {};
    if ((url_content.search('\\?') != -1)){
        url_content = url_content.substring(url_content.search('\\?'), url_content.length);
        var e,
                a = /\+/g,  // Regex for replacing addition symbol with a space
                r = /([^&=]+)=?([^&]*)/g,
                d = function (s) {
                    return decodeURIComponent(s.replace(a, " "));
                },
                q = url_content.substring(1);

        while (e = r.exec(q))
            urlParams[d(e[1])] = d(e[2]);
    }
    return {
        path : path,
        params : urlParams
    }
}

/*util function to trim whitespace from beginning and end of string*/
function trim(s) {
	s = s.replace(/(^\s*)|(\s*$)/gi,"");
	s = s.replace(/[ ]{2,}/gi," ");
	s = s.replace(/\n /,"\n");
	return s;
}

function stylizeVideoTitles() {
     Cufon.replace('.video-title, .activity-item-video-title, .section-title, h4', {
                 fontFamily: 'vag',
                 forceHitArea: true,
                 hover: true
             });
}

function swapTab(selector) {
    if (activeTab != selector) {
        $(activeTab).removeClass('selected');
        $(selector).addClass('selected');
        activeTab = selector;
    }
};

/*for displaying error messages...*/
function showErrorDialog(msg){
    var error_info = "Error details:<br><br>";
    if(!msg){
        error_info += "[none]";
    }else{
        error_info += msg;
    }

    $(ERROR_DIALOG_MESSAGE_BODY_SELECTOR).html(error_info);
    $(ERROR_DIALOG_SELECTOR).fadeIn(600);
}

function hideErrorDialog(){
    $(ERROR_DIALOG_SELECTOR).fadeOut(600);
}
