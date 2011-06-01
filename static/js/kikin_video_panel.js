com.kikin.VideoPanelController = function() {

    function _stylizeVideoTitles() {
        Cufon.replace('h3.video-title, .section-title, h4', {
                    fontFamily: 'vag',
                    forceHitArea: true,
                    hover: true
                });
    }

    var LIKED_ICON_CONTAINER_SELECTOR = ".heart-container";
    var DELETE_VIDEO_ICON_CONTAINER = ".video-delete-button";
    var LOADING_DIV_HTML = '<div style="width:100%;text-align:center;">' +
            '<div class="loading" style="margin-left:auto;margin-right:auto;width:60px;height:60px;"></div>' +
            '</div>';
    var VIDEO_PLAYER_CONTAINER_ID_PREFIX = "#video-player-";
    return {
        populatePanel : function(panel_container_selector, contentSource, request_params) {
            $(panel_container_selector).empty();
            $(panel_container_selector).html(LOADING_DIV_HTML);
            $.get(contentSource, request_params, function(data) {
                $(panel_container_selector).empty();
                $(panel_container_selector).html(data);
                _stylizeVideoTitles();

                $(LIKED_ICON_CONTAINER_SELECTOR).each(function() {
                    $(this).mouseover(function() {
                        if ($(this).hasClass('no-hover'))
                            $(this).removeClass('no-hover');
                        if (!$(this).hasClass('hovered'))
                            $(this).addClass('hovered');
                    });

                    $(this).mouseout(function() {
                        if ($(this).hasClass('hovered'))
                            $(this).removeClass('hovered');
                        if (!$(this).hasClass('no-hover'))
                            $(this).addClass('no-hover');
                    });

                    $(this).click(function(event) {

                        if ($(this).hasClass('hovered'))
                            $(this).removeClass('hovered');
                        if ($(this).hasClass('no-hover'))
                            $(this).removeClass('no-hover');

                        /*
                         *   INSERT LOGIC HERE TO "like" videos
                         *   -- e.g. $.get with return check
                         * */

                        if (!$(this).hasClass('liked'))
                            $(this).addClass('liked');
                        else {
                            if ($(this).hasClass('liked'))
                                $(this).removeClass('liked');
                        }
                    });
                });

                $(DELETE_VIDEO_ICON_CONTAINER).each(function() {
                    $(this).mouseover(function() {
                        if ($(this).hasClass('no-hover'))
                            $(this).removeClass('no-hover');
                        if (!$(this).hasClass('hovered'))
                            $(this).addClass('hovered');
                    });

                    $(this).mouseout(function() {
                        if ($(this).hasClass('hovered'))
                            $(this).removeClass('hovered');
                        if (!$(this).hasClass('no-hover'))
                            $(this).addClass('no-hover');
                    });

                    $(this).click(function(event) {

                        if ($(this).hasClass('hovered'))
                            $(this).removeClass('hovered');
                        if ($(this).hasClass('no-hover'))
                            $(this).removeClass('no-hover');

                        /*
                         *   INSERT LOGIC HERE TO "like" videos
                         *   -- e.g. $.get with return check
                         * */

                        if (!$(this).hasClass('clicked'))
                            $(this).addClass('clicked');
                        else {
                            if ($(this).hasClass('clicked'))
                                $(this).removeClass('clicked');
                        }
                    });
                });

            });
        },
        loadPlayer : function(vid, embed_code) {
            var video_player_div = $(VIDEO_PLAYER_CONTAINER_ID_PREFIX + vid);
            video_player_div.show();
        },

        closePlayer : function(vid){
            var video_player_div = $(VIDEO_PLAYER_CONTAINER_ID_PREFIX + vid);
            video_player_div.fadeOut();
        }
    };

};