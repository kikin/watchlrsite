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

            var VIDEO_IMAGE_CLASS = "video-image";

            var VIDEO_BUTTON_CLASS = "video-thumbnail-btn";

            var VIDEO_PLAYER_BG_HTML = '<div class="video-player-bg"></div>';

            var VIDEO_PLAYER_BG_SELECTOR = '.video-player-bg';

            var VIDEO_PLAYER_ID_PREFIX = "#video-player";

            var VIDEO_CONTAINER_ID_PREFIX = "#video-";

            var VIDEO_EMBED_CONTAINER_PREFIX = "#video-embed-container";

            var VIDEO_EMBED_WRAPPER_PREFIX = "#video-embed-wrapper";

            var videoList = [];

            // Activity filter selection
            var activityFilterTypeMap = {
                all: "#activity-option-all",
                facebook: "#activity-option-facebook",
                watchlr: "#activity-option-watchlr"
            };

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

            function getVideoIndex(vid) {
                for (var i = 0; i < videoList.length; i++) {
                    if (videoList[i].id == vid) {
                        return i;
                    }
                }

                return null;
            }


            function loadPlayer(vid) {
                if(activeView != VIEWS.detail){

                    if(current_vid){
                        $(VIDEO_PLAYER_ID_PREFIX).hide();
                        if(!$(VIDEO_BUTTON_ID_PREFIX + current_vid).hasClass(VIDEO_BUTTON_CLASS)){
                            $(VIDEO_BUTTON_ID_PREFIX + current_vid).addClass(VIDEO_BUTTON_CLASS)
                        }
                    }

                    //necessary hack -- center fixed-width embeds (the embeds often have
                    // fixed width+height but no margin-properties)!
                    try{
                        var wrapper = $('#video-embed-container' + ' .video-embed-wrapper');
                        wrapper.height('360px');
                        var embed = wrapper.children('embed:first-child');
                        embed.css({marginRight:'auto', marginLeft:'auto'});
                    }catch(excp){}

                    var video_player_div = $(VIDEO_PLAYER_ID_PREFIX);
                    var video_embed_div = $(VIDEO_EMBED_CONTAINER_PREFIX);
                    

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

                    video_player_div.css({display:'none'});

                    video_player_div.fadeIn(500, function(){
                        video_embed_div.show();
                        $('.prev-button-fancy').show();
                        $('.next-button-fancy').show();

                        /*close video player on click outside its container....*/
                        $(VIDEO_PLAYER_BG_SELECTOR).click(function(){
                            closePlayer(vid);
                        });

                        // play the video
                        window.WatchlrPlayerInterface.play(vid);
                    });

                    current_vid = vid;

                    //finally, prepare html5 videos...
//                    if($.browser.webkit){
//                        videoController.setMode(videoController.modes.NORMAL);
//                        videoController.setCurVid(vid);
//                    }

                    trackEvent('Video', 'OpenPlayer');
                }
            }

            function closePlayer(vid){
                var video_player_div = $(VIDEO_PLAYER_ID_PREFIX);

                $(VIDEO_PLAYER_BG_SELECTOR).fadeOut(500, function(){
                    $(VIDEO_PLAYER_BG_SELECTOR).remove();
                });
                $('.video-player').hide();

                $('.prev-button-fancy').hide();
                $('.next-button-fancy').hide();

                $('#video-player-title').hide();
                $('#player-video-description').hide();
                $('#player-video-source-image').hide();

                //pause video if it is html5
                // if($.browser.webkit){
                //         videoController.handleClose();
                //}
                
                trackEvent('Video', 'ClosePlayer');
            }

            function handleProfileEditPanelOpen(){

                $(PROFILE_OPTIONS_PANEL_SELECTOR).hide()

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

                    $.post('/api/auth/profile', {'preferences':preferences, 'username':username,
                                'email':email}, function(data){
                        if(data){
                            if(data.code && (data.code == 406 || data.code == 409)){
                                if(data.code == '406'){
                                    var errMsg = 'Usernames can consist only of numbers, lowercase letters and periods, and may not contain spaces'
                                        + ' (for example "<a href="javascript:$(\'#username-input\').val(\''+data.error+'\');">'+data.error+'</a>")';
                                    $('#err-display').html(errMsg);
                                }if(data.code == '409'){
                                    $('#err-display').html('The username you have entered is already in use');
                                }
                                $('#username-input').focus();
                                $(PROFILE_EDIT_PANEL_SELECTOR).height(258);
                                $('#err-display').show();
                            }
                            else if(data.result){
                                if(data.result.username){
                                    $(PROFILE_EDIT_PANEL_SELECTOR).height(210);
                                    $('#err-display').html('');
                                    $(PROFILE_EDIT_PANEL_SELECTOR).remove();
                                    $(GREYED_BACKGROUND_SELECTOR).remove();
                                    $(PROFILE_NAME_DISPLAY).html(data.result.username);
                                    $('#myActualProfile').attr('href', data.result.username)
                                }
                            }
                        }
                    });
                }
            };


            function bindToUI() {
                bindEvents();
            }

            function bindEvents() {
                $(PROFILE_OPTIONS_BUTTON_SELECTOR).hover(
                    function() {
                        if(!$(this).hasClass('selected') && $('#lnkConnectFb').length == 0)
                            $(this).addClass('selected');
                        $(PROFILE_OPTIONS_PANEL_SELECTOR).show();
                    },
                    function() {
                        if($(this).hasClass('selected'))
                            $(this).removeClass('selected');
                        $(PROFILE_OPTIONS_PANEL_SELECTOR).hide();
                    }
                );
                $('#activity-filter-menu').hover(
                    function() {
                        var activityFilterItem = activityFilterTypeMap[home.activityItemsType];
                        if (!$(activityFilterItem).hasClass('selected'))
                            $(activityFilterItem).addClass('selected');
                        $('#activity-options').show();
                    },
                    function() {
                        $('#activity-options').hide();
                    }
                )
            }

            function switchActivityType(type){
                $('#activity-options').hide();

                var activityFilterItem = activityFilterTypeMap[home.activityItemsType];
                if ($(activityFilterItem).hasClass('selected'))
                    $(activityFilterItem).removeClass('selected');

                home.activityItemsType = type;
                home.populatePanel();
            }

            function addToVideoList(vid, metadata){
                var elementExists = false;
                if(WatchlrPlayerInterface){
                    var idx = WatchlrPlayerInterface._getVideoIndex(vid);
                    if(idx != null){
                        UI.videoList[idx] = metadata;
                        elementExists = true;
                    }
                }
                if(!elementExists){
                    UI.videoList.push(metadata);
                }
            }

            function checkForVideoMetadata(vid){
                if(activeView == VIEWS.likedQueue){
                    activeViewName = 'liked';
                }else if(activeView == VIEWS.savedQueue){
                    activeViewName = 'saved';
                }

                var checkVideoMetadataInterval = 5000;
                var maxAttempts = 12;
                checkVideoMetadataTimer = setInterval(function(){
                    if(maxAttempts > 0){
                        $.ajax({
                            url: '/content/single_video/' + activeViewName + '/' + vid,
                            statusCode: {
                                200: function(content){
                                    $('#video-' + vid).replaceWith(content);
                                    clearInterval(checkVideoMetadataTimer);
                                }
                            }
                        });
                    } else {
                        clearInterval(checkVideoMetadataTimer);
                    }
                    maxAttempts--;
                }, checkVideoMetadataInterval);
            }

            //expose public functions...
            return {
                closePlayer : closePlayer,
                loadPlayer : loadPlayer,
                handleProfileEditPanelOpen : handleProfileEditPanelOpen,
                handleProfileSave : handleProfileSave,
                videoList: videoList,
                addToVideoList: addToVideoList,
                checkForVideoMetadata: checkForVideoMetadata,
                switchActivityType: switchActivityType
            }
        };

var UI;
$(document).ready(function(){
    UI = new kikinvideo.UIUniversal();
});

