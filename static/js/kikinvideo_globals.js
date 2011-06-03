//project namesapce...
var com = { kikin : {video : {'util':{}}}};

//the path, in #! url, that indicates video player should be opened
var VIDEO_PLAYER_PATH = '/player';

var VIDEO_PLAYER_CLOSE_PATH = '/close_player';

var LIKE_VIDEO_PATH = '/like';

var REMOVE_VIDEO_PATH = '/remove';

var SAVED_QUEUE_PATH = '/saved_queue';

var LIKED_QUEUE_PATH = '/liked_queue';

var PROFILE_EDIT_PANEL_OPEN_PATH = '/edit_profile';

var PROFILE_SAVE_PATH = '/save_profile';

var LIKED_VIDEOS_CONTENT_URL = '/content/liked_videos';

var SAVED_VIDEOS_CONTENT_URL = '/content/saved_videos';

var PROFILE_OPTIONS_PANEL_SELECTOR = '#options';

var PROFILE_OPTIONS_BUTTON_SELECTOR = '#header-right';

var PROFILE_NAME_DISPLAY = ".profileName";

var VIDEO_PANEL_SELECTOR = '#videoList';

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

var TAB_SELECTORS = {
    queue : '.tabQueue',
    likes : '.tabLikes'
};

var activeTab;

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
