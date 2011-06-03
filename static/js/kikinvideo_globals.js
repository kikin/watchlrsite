//project namesapce...
var com = { kikin : {video : {} } };

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