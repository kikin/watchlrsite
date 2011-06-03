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

var TAB_SELECTORS = {
    queue : '.tabQueue',
    likes : '.tabLikes'
};

var activeTab;