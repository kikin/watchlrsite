//project namesapce...
var _WATCHLR_JS_VERSION_ = '2.3.3';

var kikinvideo = {'util':{}};

var SAVED_QUEUE_PATH = '/saved_queue';

var LIKED_QUEUE_PATH = '/liked_queue';

var ACTIVITY_QUEUE_PATH = '/activity';

var LOAD_MORE_VIDEOS_PATH = '/next';

var LIKED_VIDEOS_CONTENT_URL = '/content/liked_videos';

var SAVED_VIDEOS_CONTENT_URL = '/content/saved_videos';

var ACTIVITY_CONTENT_URL = '/content/activity';

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

var FOLLOW_EMAIL_CHECKBOX_ID = "#follow-email-checkbox";

var PROFILE_EDIT_CANCEL_BUTTON_SELECTOR = '.cancel-button';

var PROFILE_EDIT_SAVE_BUTTON_SELECTOR = '.save-button';

var GREYED_BACKGROUND_ELEMENT = '<div class="greyed-background" style="display: block;"></div>';

var GREYED_BACKGROUND_SELECTOR = '.greyed-background';

var LOADING_ICON_BACKGROUND = ".loading-container";

var LOADING_ICON = ".loading";

var ERROR_DIALOG_SELECTOR = '#error-msg-dialog';

var ERROR_DIALOG_MESSAGE_BODY_SELECTOR = '#error-msg-dialog .msg-body'

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
    profile:3,
    detail:4
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

function pluginAbsent(callback){
    var plugin_check_interval = 200;
    var interval_obj = setInterval(function(){
        if($('#watchlr_dummy_element_for_plugin_detection').length > 0){
            clearInterval(interval_obj);
            callback();
        }
    }, plugin_check_interval);
}

/*util function to trim whitespace from beginning and end of string*/
function trim(s) {
    s = s.replace(/(^\s*)|(\s*$)/gi,"");
    s = s.replace(/[ ]{2,}/gi," ");
    s = s.replace(/\n /,"\n");
    return s;
}

//because jQuery's $.browser doesn't yet have a repr. for Chrome...
var userAgent = navigator.userAgent.toLowerCase();
$.browser.chrome = /chrome/.test(navigator.userAgent.toLowerCase()); 

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
        _gaq.push(['_trackPageview', selector]);
    }
};

/*for displaying error messages...*/
function showErrorDialog(msg, code){
    var error_info = "Error details:<br><br>";
    if(code == 401){
        error_info = "You need to sign in to perform that action";
    } else{
        if(!msg){
            error_info += "[none]";
        }else{
            error_info += msg;
        }
    }

//    alert(error_info);
}

function hideErrorDialog(){
    $(ERROR_DIALOG_SELECTOR).fadeOut(600);
}

function trackEvent(category, action){
    switch(activeView){
        case VIEWS.activity:
             _gaq.push(['_trackEvent', category, action + '_Activity', 'web_app']);
        break;
        case VIEWS.profile:
           _gaq.push(['_trackEvent', category, action + '_Profile', 'web_app']);
       break;
        case VIEWS.detail:
            _gaq.push(['_trackEvent', category, action + '_Detail', 'web_app']);
        break;
        case VIEWS.savedQueue:
            _gaq.push(['_trackEvent', category, action + '_Queue', 'web_app']);
        break;
        case VIEWS.likedQueue:
            _gaq.push(['_trackEvent', category, action + '_Queue', 'web_app']);
    }

    _gaq.push(['_trackEvent', category, action, 'web_app']);
}

function trackAction(action, id, success){
    $.ajax({
        url: '/track/action',
        data: ({'action': action, 'id': id, 'agent': 'webapp', 'version': _WATCHLR_JS_VERSION_}),
        success: success
    });
}

function trackErrorEvent(name, value, success){
    $.ajax({
        url: '/track/event',
        data: ({'name': name, 'value': value, 'agent': 'webapp', 'version': _WATCHLR_JS_VERSION_}),
        success: success
    });
}