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

com.kikin.video.HomeViewController = function() {
    //selectors

    var PROFILE_OPTIONS_PANEL_SELECTOR = '#options';

    var PROFILE_OPTIONS_BUTTON_SELECTOR = '#header-right';

    var VIDEO_PANEL_SELECTOR = '#videoList';

    var LIKED_VIDEOS_CONTENT_URL = '/content/liked_videos';

    var SAVED_VIDEOS_CONTENT_URL = '/content/saved_videos';

    var PROFILE_EDIT_URL = '/content/profile_edit';

    var PROFILE_EDIT_OPEN_BUTTON_SELECTOR = '#myProfile';

    var PROFILE_EDIT_CLOSE_BUTTON_SELECTOR = '#profile-view-close';

    var PROFILE_EDIT_PANEL_SELECTOR = '#profile-edit-panel';

    var PROFILE_EDIT_USERNAME_INPUT = ".profile-edit-input #username-input";

    var PROFILE_EDIT_EMAIL_INPUT = ".profile-edit-input #email-input";

    var SYNDICATE_LIKES_CHECKBOX_ID = "#share-likes-checkbox";

    var PROFILE_EDIT_CANCEL_BUTTON_SELECTOR = '.cancel-button';

    var GREYED_BACKGROUND_ELEMENT = '<div class="greyed-background" style="display: block;"></div>';

    var GREYED_BACKGROUND_SELECTOR = '.greyed-background';

    var profile_options_panel_visible = false;

    var currentUser;

    activeTab = TAB_SELECTORS.queue;

    var videoPanelController = new com.kikin.VideoPanelController(this);


          /*
    * Values accessible via jQuery for html checkboxes' "checked"
    * attribute are true and undefined, the latter of which cannot
    * RELIABLY be cast to integer.  Therefore, use this to access
    * and modify checkbox state in integer form.
    *
    * function returns checkbox value if not intValue param is
    * passed, otherwise, sets checkbox according to intValue param.
    *
    * @param selector jQuery selector obj for the checkbox.
    * @param intValue OPTIONAL -- value to assign to checkbox.
    * */
    function _checkboxValueInt(selector, intValue){
        if(intValue){
            switch(intValue){
                case 1:
                    selector.attr("checked", true);
                    break;
                case 0:
                    selector.attr("checked", false);
                    break;
            }
        }
        else{
            var checked = selector.attr("checked");
            if(!checked){
                return 0;
            }
            else{
                return 1;
            }
        }
    };


    function handleProfileEditPanelOpen(){
        $.get('/api/auth/profile', function(data){
            if(data && data.result){
                currentUser = data.result;
            }
        });
    };

    function handleProfileSave(){
        if(currentUser){

            var preferences = {'syndicate' : _checkboxValueInt($(SYNDICATE_LIKES_CHECKBOX_ID))};
            var username = $(PROFILE_EDIT_USERNAME_INPUT).val();
            var email = $(PROFILE_EDIT_EMAIL_INPUT).val();

            $(PROFILE_EDIT_PANEL_SELECTOR).remove();
            $(GREYED_BACKGROUND_SELECTOR).remove();

            $.post('/api/auth/profile', {'preferences':preferences, 'username':username,
                    'email':email}, function(data){
                if(data && data.result){
                    /*TODO:
                    * check response...*/
                }
            });
        }
    };

    return {
        bindToUI : function() {
            this.bindEvents(this);
            videoPanelController.populatePanel(VIDEO_PANEL_SELECTOR, SAVED_VIDEOS_CONTENT_URL, {});
        },

        swapTab : function(selector) {
            if (activeTab != selector) {
                $(activeTab).removeClass('selected');
                $(selector).addClass('selected');
                activeTab = selector;
            }
        },

        /*I don't like the idea of passing the (parent/containing)
         * context into this function, but it seems necessary because,
         * if we don't, the 'this' refs within the click handlers
         * point at the selectors for the objects (i.e. jQuery DOM element objs
         * ...because the functions are being invoked by jQuery event handler)
         * and not instances of com.kikin.video.HomeViewController.
         * Perhaps there is a better way...
         * */
        bindEvents : function(context) {
            $(TAB_SELECTORS.queue).click(function(event) {
                context.swapTab(TAB_SELECTORS.queue);
            });

            $(TAB_SELECTORS.likes).click(function(event) {
                context.swapTab(TAB_SELECTORS.likes);
            });

            $(PROFILE_OPTIONS_BUTTON_SELECTOR).click(function(event) {
                if (!profile_options_panel_visible) {
                    //so that body click callback defined further down
                    //doesn't get fired and immediately hide the panel...
                    event.stopPropagation();
                    $(PROFILE_OPTIONS_PANEL_SELECTOR).width($(PROFILE_OPTIONS_BUTTON_SELECTOR).width());
                    $(PROFILE_OPTIONS_PANEL_SELECTOR).show();
                    profile_options_panel_visible = true;
                }
            });

            $(PROFILE_EDIT_OPEN_BUTTON_SELECTOR).click(function(event) {

                $('body').prepend(GREYED_BACKGROUND_ELEMENT);

                $.get(PROFILE_EDIT_URL, function(data) {
                    $('body').prepend(data)
                    $(PROFILE_EDIT_CLOSE_BUTTON_SELECTOR).bind('click', function(event) {
                        $(PROFILE_EDIT_PANEL_SELECTOR).remove();
                        $(GREYED_BACKGROUND_SELECTOR).remove();
                    });
                    $(PROFILE_EDIT_CANCEL_BUTTON_SELECTOR).bind('click', function(event) {
                        $(PROFILE_EDIT_PANEL_SELECTOR).remove();
                        $(GREYED_BACKGROUND_SELECTOR).remove();
                    });
                });
            });

            //hide the panel on click outside of
            //profile info button
            $('body').click(function(event) {
                if (profile_options_panel_visible) {
                    $(PROFILE_OPTIONS_PANEL_SELECTOR).hide();
                    profile_options_panel_visible = false;
                }
            });
        },

        //public version...
        activeTab : activeTab,

        TAB_SELECTORS : TAB_SELECTORS,

        /*hash-changes function as primary method of propogating state...
        * bind them to fun*/
        onHashChange : function(hash_url) {
            var url_content = parseHashURL(hash_url);
            if(url_content.path == VIDEO_PLAYER_PATH){
                videoPanelController.loadPlayer(url_content.params.vid);
            }if(url_content.path == VIDEO_PLAYER_CLOSE_PATH){
                videoPanelController.closePlayer(url_content.params.vid);
            }if(url_content.path == LIKE_VIDEO_PATH){
                videoPanelController.handleLike(url_content.params.vid);
            }if(url_content.path == REMOVE_VIDEO_PATH){
                videoPanelController.removeVideo(url_content.params.vid);
            }if(url_content.path == SAVED_QUEUE_PATH){
                videoPanelController.populatePanel(VIDEO_PANEL_SELECTOR, SAVED_VIDEOS_CONTENT_URL, {});
            }if(url_content.path == LIKED_QUEUE_PATH){
                videoPanelController.populatePanel(VIDEO_PANEL_SELECTOR, LIKED_VIDEOS_CONTENT_URL, {});
            }if(url_content.path == PROFILE_EDIT_PANEL_OPEN_PATH){
                handleProfileEditPanelOpen();
            }if(url_content.path == PROFILE_SAVE_PATH){
                handleProfileSave();
            }
        }
    }
};
var homeViewController;
$(document).ready(
        function() {
            homeViewController = new com.kikin.video.HomeViewController();
            homeViewController.bindToUI();

            /*bind hashchange listeners to corresponding event*/
            $(window).hashchange(function() {
                homeViewController.onHashChange(location.hash);
            });
            $('#myConnectionsNot').show();

            //in case we're refreshing...
            setTimeout(function(){homeViewController.onHashChange(location.hash);},
                    800);
        }
);