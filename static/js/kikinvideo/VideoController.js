function onYouTubePlayerAPIReady(){

}


function onPlayerReady(event){
    alert('');
}

kikinvideo.VideoController =
    function(){

        //because we must control YouTube and Vimeo vids through
        //these services' javascript APIs, we can't just manipulate
        //<video> obj controls -- we need to store player->vid mappings.
         player_vid_mappings = {}

        //youtube api requires that this be in the global namespace...unfortunate, yes...
        function onPlayerReady(event){
            alert('ready');
        }

         function prepareVidForPlayback(vid){
             
         }

         function pauseVideo(vid){
             
         }

         function playVideo(vid){
             
         }

         function prepareEmbeds(){
            $('.video-embed-wrapper.html5').each(function()
                {
                    /*
                    *  Unfortunately, many of our embeds contain an autoplay flag that's
                    *  been set to true/1.  It is necessary, therefore, to iterate over
                    *  all of them client-side and rectify this.
                    * */
                    var embed = $(this).children(0);
                    if(embed.is('video')){
                        
                    }

                    if(embed.is('iframe')){
                        var source = embed.attr('src');
                        if (isYouTube(source)){
                            if (source.indexOf("youtube.com/") >= 0 || source.indexOf("player.vimeo.com") >= 0)
                                source = source.replace("autoplay=1", "autoplay=0");
                            source += "&enablejsapi=1";
                            embed.attr('src', source);

                            var ytVID = youtubeVID(source);
                            var player = new YT.Player('player', {
                              videoId: ytVID,
                              events:{
                                  'onReady': function(event){
                                        alert('woo');
                                    }
                              }
                            });
                            x=1;
                        }
                        if(isVimeo(source)){
                            if (source.indexOf("http://www.youtube.com/") == 0 || source.indexOf("http://player.vimeo.com") == 0)
                                source = source.replace("autoplay=1", "autoplay=0");
                            source += "&api=1";
                            embed.attr('src', source);
                        }
                    }
                }
            );
         }

        /*<hack>*/
        function isVimeo(src){
            if (src.indexOf("vimeo.com") >= 0){
                return true;
            }else{
                return false;
            }
        }

        function isYouTube(src){
            if (src.indexOf("youtube.com") >= 0){
                return true;
            }else{
                return false;
            }
        }
        /*</hack>*/

        /*<hack>*/
        function youtubeVID(src){
            /*parse embed code out of source url*/
            var _EMBED_START_DELIM = '/embed/';
            var start_index = src.search(_EMBED_START_DELIM);
            var truncated = src.substr(start_index+_EMBED_START_DELIM.length);
            return truncated.substr(0, truncated.search('\\?'));
        }
        /*</hack>*/

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