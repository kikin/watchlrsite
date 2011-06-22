//youtube api requires that this be in the global namespace...unfortunate, yes...
function onYouTubePlayerReady(pid){
    alert('ready');
}

kikinvideo.VideoController =
    function(){

        //because we must control YouTube and Vimeo vids through
        //these services' javascript APIs, we can't just manipulate
        //<video> obj controls -- we need to store player->vid mappings.
         player_vid_mappings = {}

         function prepareVidForPlayback(vid){
             
         }

         function pauseVideo(vid){
             
         }

         function playVideo(vid){
             
         }

         function prepareEmbeds(){
            $('.video-embed-wrapper.html5').each(function()
                {
                    var embed = $(this).children(0);
                    if(embed.is('video')){
                        
                    }

                    if(embed.is('iframe')){
                        var source = embed.attr('src');
                        if (source.indexOf("http://www.youtube.com/") == 0){
                            if (source.indexOf("http://www.youtube.com/") == 0 || source.indexOf("http://player.vimeo.com") == 0)
                                source = source.replace("autoplay=1", "autoplay=0");
                            source += "&enablejsapi=1";
                            embed.attr('src', source);
                        }
                        if(source.indexOf("http://player.vimeo.com") == 0){
                            if (source.indexOf("http://www.youtube.com/") == 0 || source.indexOf("http://player.vimeo.com") == 0)
                                source = source.replace("autoplay=1", "autoplay=0");
                            source += "&api=1";
                            embed.attr('src', source);
                        }
                    }
                }
            );
         }

        return {
            prepareVidForPlayback : prepareVidForPlayback,
            prepareEmbeds : prepareEmbeds,
            pauseVideo : pauseVideo
        }
    }

var videoController;
$(document).ready(function(){
    videoController = new kikinvideo.VideoController();
});