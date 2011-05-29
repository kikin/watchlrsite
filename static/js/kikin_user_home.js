com.kikin.video.HomeViewController = function(){
    //selectors
    var TAB_SELECTORS = {
        queue : '.tabQueue',
        likes : '.tabLikes'
    };

    var PROFILE_OPTIONS_PANEL_SELECTOR = '#options';

    var PROFILE_OPTIONS_BUTTON_SELECTOR = '#header-right';

    var profile_options_panel_visible = false;

    var activeTab = null;

    return {
        bindToUI : function(){
            activeTab = TAB_SELECTORS.queue;
            this.bindEvents(this);
        },

        swapTab : function(selector){
            if(activeTab != selector){
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
         bindEvents : function(context){
            $(TAB_SELECTORS.queue).click(function(event){
               context.swapTab(TAB_SELECTORS.queue);
            });

            $(TAB_SELECTORS.likes).click(function(event){
               context.swapTab(TAB_SELECTORS.likes);
            });

            $(PROFILE_OPTIONS_BUTTON_SELECTOR).click(function(event){
                 if(!profile_options_panel_visible){
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
             $('body').click(function(event){
                 if(profile_options_panel_visible){
                    $(PROFILE_OPTIONS_PANEL_SELECTOR).hide();
                     profile_options_panel_visible = false;
                 }
             });
        }
    }
};

$(document).ready(
    function(){
        homeViewController = new com.kikin.video.HomeViewController();
        homeViewController.bindToUI();
        $('#myConnectionsNot').show();
    }
);