com.kikin.video.HomeViewController = function(){
    //selectors
    var TAB_SELECTORS = {
        queue : '.tabQueue',
        likes : '.tabLikes'
    };

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
        }
    }
};

$(document).ready(
    function(){
        homeViewController = new com.kikin.video.HomeViewController();
        homeViewController.bindToUI();
    }
);