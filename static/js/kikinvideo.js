//selectors
var TAB_SELECTORS = {
    queue : '.tabQueue',
    likes : '.tabLikes'
}

var activeTab = null;

$(document).ready(
    function(){
        init();
    }
);

function init(){
    activeTab = TAB_SELECTORS.queue;
    bindEvents();
}

function bindEvents(){
    $(TAB_SELECTORS.queue).click(function(event){
       swapTab(TAB_SELECTORS.queue);
    });

    $(TAB_SELECTORS.likes).click(function(event){
       swapTab(TAB_SELECTORS.likes);
    });
}

function swapTab(selector){
    if(activeTab != selector){
        $(activeTab).removeClass('selected');
        $(selector).addClass('selected');
        activeTab = selector;
    }
}

