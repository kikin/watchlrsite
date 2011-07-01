/*
*  Logic for UI components common to all (or many) views in the application, such as the
* "settings" dialog through which users can edit their account settings, and the floating
* video embed container.
* */
kikinvideo.UIUniversal = 
        function(){

            var profile_options_panel_visible = false;

            var currentUser;

            var current_vid;

            /*selectors*/
            var VIDEO_CONTAINER_CLASS = "video-wrapper";

            var VIDEO_BUTTON_ID_PREFIX = "#video-thumbnail-btn-vid-";

            var VIDEO_BUTTON_CLASS = "video-thumbnail-btn";

            var VIDEO_PLAYER_BG_HTML = '<div class="video-player-bg"></div>';

            var VIDEO_PLAYER_BG_SELECTOR = '.video-player-bg';

            var VIDEO_PLAYER_ID_PREFIX = "#video-player-";

            var VIDEO_CONTAINER_ID_PREFIX = "#video-";

            var VIDEO_EMBED_CONTAINER_PREFIX = "#video-embed-container-";

            var VIDEO_EMBED_WRAPPER_PREFIX = "#video-embed-wrapper-";


            /*initialization...*/
            bindToUI();

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


            function loadPlayer(vid) {
                if(activeView != VIEWS.detail){
                    if(current_vid){
                        $(VIDEO_PLAYER_ID_PREFIX + current_vid).hide();
                        if(!$(VIDEO_BUTTON_ID_PREFIX + current_vid).hasClass(VIDEO_BUTTON_CLASS)){
                            $(VIDEO_BUTTON_ID_PREFIX + current_vid).addClass(VIDEO_BUTTON_CLASS)
                        }
                    }

                    /*remove the 'play' button from the thumb...*/
                    if($(VIDEO_BUTTON_ID_PREFIX + vid).hasClass(VIDEO_BUTTON_CLASS)){
                        $(VIDEO_BUTTON_ID_PREFIX + vid).removeClass(VIDEO_BUTTON_CLASS)
                    }
                    var video_player_div = $(VIDEO_PLAYER_ID_PREFIX + vid);
                    var video_embed_div = $(VIDEO_EMBED_CONTAINER_PREFIX+vid);


                    var video_player_target_width = video_player_div.width();
                    var video_player_target_height = video_player_div.height();

                    video_player_div.css({top:'42%', 'margin-top':
                            (video_player_div.height()*-.5)-30});


                    video_embed_div.hide();
                    $('body').prepend(VIDEO_PLAYER_BG_HTML);
                    $(VIDEO_PLAYER_BG_SELECTOR).css({width:$(document).width(), height:$(document).height(), display:'none', 'z-index':1000});
                    //because i.e. doesn't support the opacity property...
                        $(VIDEO_PLAYER_BG_SELECTOR).fadeIn(100);
                    video_player_div.fadeIn(100);

                    video_player_div.css({display:'none'})

                    video_player_div.fadeIn(500, function(){
                        video_embed_div.show();
                        /*close video player on click outside its container....*/
                        $(VIDEO_PLAYER_BG_SELECTOR).click(function(){
                            closePlayer(vid);
                        });
                    });

                    current_vid = vid;

                    //finally, prepare html5 videos...
                    if($.browser.webkit){
            //            videoController.setMode(videoController.modes.NORMAL);
              //          videoController.setCurVid(vid);
                    }
                }
            }

            function closePlayer(vid){
                var video_player_div = $(VIDEO_PLAYER_ID_PREFIX + vid);

                $(VIDEO_PLAYER_BG_SELECTOR).fadeOut(500, function(){
                    $(VIDEO_PLAYER_BG_SELECTOR).remove();
                });
                $('.video-player').fadeOut();

                /*restore the "play" button to the video thumb...*/
                if(!$(VIDEO_BUTTON_ID_PREFIX + vid).hasClass(VIDEO_BUTTON_CLASS)){
                    $(VIDEO_BUTTON_ID_PREFIX + vid).addClass(VIDEO_BUTTON_CLASS)
                }

                //pause video if it is html5
                if($.browser.webkit){
         //               videoController.setMode(videoController.modes.NORMAL);
         //               videoController.pauseVideo();
         //               videoController.savePosition();
                    }
            }

            function handleProfileEditPanelOpen(){

                /*grey overlay for all content outside of edit dialog*/
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

                    var preferences = '{ "syndicate":' + checkboxValueInt($(SYNDICATE_LIKES_CHECKBOX_ID)) +
                                         ',"follow_email":' + checkboxValueInt($(FOLLOW_EMAIL_CHECKBOX_ID)) + '}';
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


            function bindToUI() {
                bindEvents();
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
                        if(!$('#header-right').hasClass('selected'))
                            $('#header-right').addClass('selected')
                    }
                });

                //hide the panel on click outside of
                //profile info button
                $('body').click(function(event) {
                    if (profile_options_panel_visible) {
                        $(PROFILE_OPTIONS_PANEL_SELECTOR).hide();
                        profile_options_panel_visible = false;
                        if($('#header-right').hasClass('selected'))
                            $('#header-right').removeClass('selected');
                    }
                });
            }


            //expose public functions...
            return {
                closePlayer : closePlayer,
                loadPlayer : loadPlayer,
                handleProfileEditPanelOpen : handleProfileEditPanelOpen,
                handleProfileSave : handleProfileSave
            }
        };

var UI;
$(document).ready(function(){
    UI = new kikinvideo.UIUniversal();
});

