com.kikin.video.HomeViewController = function() {
    //selectors
    var TAB_SELECTORS = {
        queue : '.tabQueue',
        likes : '.tabLikes'
    };

    var PROFILE_OPTIONS_PANEL_SELECTOR = '#options';

    var PROFILE_OPTIONS_BUTTON_SELECTOR = '#header-right';

    var VIDEO_PANEL_SELECTOR = '#videoList';

    var LIKED_VIDEOS_CONTENT_URL = '/content/liked_videos';

    var SAVED_VIDEOS_CONTENT_URL = '/content/saved_videos';

    var PROFILE_EDIT_URL = '/content/profile_edit';

    var PROFILE_EDIT_OPEN_BUTTON_SELECTOR = '#myProfile';

    var PROFILE_EDIT_CLOSE_BUTTON_SELECTOR = '#profile-view-close';

    var PROFILE_EDIT_PANEL_SELECTOR = '#profile-edit-panel';

    var PROFILE_EDIT_CANCEL_BUTTON_SELECTOR = '.cancel-button';

    var GREYED_BACKGROUND_ELEMENT = '<div class="greyed-background" style="display: block;"></div>';

    var GREYED_BACKGROUND_SELECTOR = '.greyed-background';

    var profile_options_panel_visible = false;

    var activeTab = TAB_SELECTORS.queue;

    var videoPanelController = new com.kikin.VideoPanelController();

    function parseHashURL(hash_url) {

        var path;

        //strip out hash ('#')...
        var url_content = hash_url.substring(1, hash_url.length);

        if (url_content.search('\\?') == -1) {
            path = url_content;
        }

        var urlParams = {};
        var e,
                a = /\+/g,  // Regex for replacing addition symbol with a space
                r = /([^&=]+)=?([^&]*)/g,
                d = function (s) {
                    return decodeURIComponent(s.replace(a, " "));
                },
                q = url_content.substring(1);

        while (e = r.exec(q))
            urlParams[d(e[1])] = d(e[2]);
        return {
            params : urlParams
        }
    }


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
                videoPanelController.populatePanel(VIDEO_PANEL_SELECTOR, SAVED_VIDEOS_CONTENT_URL, {});
                context.swapTab(TAB_SELECTORS.queue);
            });

            $(TAB_SELECTORS.likes).click(function(event) {
                videoPanelController.populatePanel(VIDEO_PANEL_SELECTOR, LIKED_VIDEOS_CONTENT_URL, {});
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

        onHashChange : function(hash_url) {
            var url_params = parseHashURL(hash_url);
            alert(url_params.params);
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
        }
);