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
         vid_player_mappings = {}

        //youtube api requires that this be in the global namespace...unfortunate, yes...
        function onPlayerReady(event){
            alert('ready');
        }

         function prepareVidForPlayback(vid){

             seekToLastPlaybackPos(vid);
         }

         function pauseVideo(vid){
             if(vid_player_mappings[vid].type == 'YouTube'){
                 vid_player_mappings[vid].player.pauseVideo();
             }
         }

         function playVideo(vid){
             
         }

        function seekToLastPlaybackPos(vid){
             if(vid_player_mappings[vid].type == 'YouTube'){
                 vid_player_mappings[vid].player.seekTo(50);
             }
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

                    var container_id = $(this).attr('id');
                    /*<hack>*/
                    //parse vid by looking @ container id...
                    var vid;
                    try{
                        vid = parseInt(container_id.substr('video-embed-wrapper-'.length));
                    }catch(exception){}
                    /*</hack>*/
                    

                    if(embed.is('video')){
                        
                    }

                    if(embed.is('iframe')){
                        /*we're likely dealing with either a YouTube or a Vimeo embed...*/

                        var source = embed.attr('src');

                        /*remove the damn autoplay flag*/
                        if(isYouTube(source) || isVimeo(source)){
                            source = source.replace("autoplay=1", "autoplay=0");
                        }


                        if (isYouTube(source)){

                           source += "&enablejsapi=1";
                           embed.attr('src', source);

                           var ytVID = youtubeVID(source);

                            embed.attr('id', 'youtube-iframe-'+ytVID);
                            
                            var player = new YT.Player(embed.attr('id'), {
                              videoId: ytVID
                            });

                            vid_player_mappings[vid] = {player:player, type:'YouTube'};
                        }
                        if(isVimeo(source)){
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