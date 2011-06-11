$(document).ready(
    function(){
        //create local namespace...
        (function() {

            var profile_options_panel_visible = false;

            var currentUser;

            var homeViewController = new kikinvideo.HomeViewController();


            /*initialization...*/
            bindToUI();

            /*bind hashchange listeners to corresponding event*/
            $(window).hashchange(function() {
                onHashChange(location.hash);
            });

            //in case we're refreshing...
            onHashChange(location.hash);

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
            function checkboxValueInt(selector, intValue){
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
                $.get('/api/auth/profile', function(data){
                    if(data && data.result){
                        currentUser = data.result;
                    }
                });
            };

            function handleProfileSave(){
                if(currentUser){

                    var preferences = '{"syndicate" :'+checkboxValueInt($(SYNDICATE_LIKES_CHECKBOX_ID))+'}';
                    var username = $(PROFILE_EDIT_USERNAME_INPUT).val();
                    var email = $(PROFILE_EDIT_EMAIL_INPUT).val();

                    $(PROFILE_EDIT_PANEL_SELECTOR).remove();
                    $(GREYED_BACKGROUND_SELECTOR).remove();

                    $.post('/api/auth/profile', {'preferences':preferences, 'username':username,
                            'email':email}, function(data){
                        if(data && data.result){
                            if(data.result.username){
                                $(PROFILE_NAME_DISPLAY).html(data.result.username);
                            }
                        }
                    });
                }
            };

            function swapTab(selector) {
                if (activeTab != selector) {
                    $(activeTab).removeClass('selected');
                    $(selector).addClass('selected');
                    activeTab = selector;
                }
            };

               function bindToUI() {
                    bindEvents();
                    homeViewController.populatePanel();
                }

                function bindEvents() {

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

                    //hide the panel on click outside of
                    //profile info button
                    $('body').click(function(event) {
                        if (profile_options_panel_visible) {
                            $(PROFILE_OPTIONS_PANEL_SELECTOR).hide();
                            profile_options_panel_visible = false;
                        }
                    });
                }


                /*hash-changes serve as the primary method of propogating state throughout this frontend...
                * bind them to their corresponding UI-manipulation functions below*/
                function onHashChange(hash_url) {
                    var url_content = parseHashURL(hash_url);
                    if(url_content.path == VIDEO_PLAYER_PATH){
                        homeViewController.loadPlayer(url_content.params.vid);
                    }if(url_content.path == VIDEO_PLAYER_CLOSE_PATH){
                        homeViewController.closePlayer(url_content.params.vid);
                    }if(url_content.path == LIKE_VIDEO_PATH){
                        homeViewController.handleLike(url_content.params.vid);
                    }if(url_content.path == REMOVE_VIDEO_PATH){
                        homeViewController.removeVideo(url_content.params.vid);
                    }if(url_content.path == SAVED_QUEUE_PATH){
                        swapTab(TAB_SELECTORS.savedQueue);
                        activeView = VIEWS.savedQueue;
                        homeViewController.populatePanel(VIDEO_PANEL_SELECTOR, SAVED_VIDEOS_CONTENT_URL, {});
                    }if(url_content.path == LIKED_QUEUE_PATH){
                        swapTab(TAB_SELECTORS.likedQueue);
                        activeView = VIEWS.likedQueue;
                        homeViewController.populatePanel();
                    }if(url_content.path == ACTIVITY_QUEUE_PATH){
                        swapTab(TAB_SELECTORS.activity);
                        activeView = VIEWS.activity;
                        homeViewController.populatePanel();
                    }if(url_content.path == PROFILE_EDIT_PANEL_OPEN_PATH){
                        handleProfileEditPanelOpen();
                    }if(url_content.path == PROFILE_SAVE_PATH){
                        handleProfileSave();
                    }if(url_content.path == LOAD_MORE_VIDEOS_PATH){
                        homeViewController.loadMoreVideos();
                    }if(url_content.path == FOLLOW_USER_PATH){
                        homeViewController.handleFollow(url_content.params.user);
                    }if(url_content.path == UNFOLLOW_USER_PATH){
                        homeViewController.handleUnfollow(url_content.params.user);
                    }
                }
        })()
    });