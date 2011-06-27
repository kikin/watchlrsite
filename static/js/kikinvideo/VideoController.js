//youtube player ready callback
function onYouTubePlayerReady(playerID){
    videoController.prepareCurVidForPlayback();
    var player = document.getElementById(playerID);
    try{
        player.removeEventListener('onStateChange');
    }catch(exc){}
    player.addEventListener('onStateChange', 'stateChangeListener');
    videoController.prepareVidForPlayback();
}

//vimeo player ready callback
function vimeo_player_loaded(playerID){
 
}

function vimeo_player_paused(event){
    videoController.savePosition();
}

function stateChangeListener(newState){
    //youtube iframe api provided a STATES var in
    //YT namespace, but this swf variant of the api doesn't
    //...state "2" == paused
    if (newState == 2){
        videoController.savePosition();
    }
}

kikinvideo.VideoController =
    function(){

        var curVID;

        //because we must control YouTube and Vimeo vids through
        //these services' javascript APIs, we can't just manipulate
        //<video> obj controls -- we need to store player->vid mappings.
        var vid_player_mappings = {}

        //this is unfortunately also necessary for fast vid lookup...
        var player_vid_mappings = {};
        
        //youtube api requires that this be in the global namespace...unfortunate, yes...
        function onPlayerReady(event){
            var player = vid_player_mappings[player_vid_mappings[event.target]];
            vid_player_mappings[player_vid_mappings[event.target]].isReady = true;
        }

        function addEvent(element, eventName, callback) {
            if (element.addEventListener) {
                element.addEventListener(eventName, callback, false);
            }
            else {
                element.attachEvent('on' + eventName, callback);
            }
        }


        function handleStateChange(newstate){
            //if(newstate.data == YT.PlayerState.PAUSED){
                //savePosition(curVID);
            //}
        }

        function playVideo(){
            if(vid_player_mappings[curVID]){
                 if(vid_player_mappings[vid].type == 'YouTube'){
                     if(vid_player_mappings[vid].player)
                        vid_player_mappings[vid].player.playVideo();
                 }
             }
        }


        function setCurVid(vid){
            curVID = vid;
        }

        function prepareCurVidForPlayback(){
            prepareVidForPlayback(curVID);
        }

         function prepareVidForPlayback(){
             /*no preparation can occur until the player has loaded,
             * so proper prep logic is in onPlayerReady callback*/
             if(curVID){
                $.ajax({
                     url : '/api/seek/'+curVID,
                     success : function(response){
                         if(response.success){
                             var video = response.result;
                             if(video.position){
                                 seekTo(curVID, parseFloat(video.position));
                                 playVideo();
                             }
                         }else
                             showErrorDialog();
                    },
                    failure : showErrorDialog
                 });
                }
         }

         function savePosition(){
             vid = curVID;
             if(vid_player_mappings[vid]){
                 if(vid_player_mappings[vid].type == 'YouTube'){
                     var player = vid_player_mappings[vid].player;
                     var curTime = player.getCurrentTime();
                     doSavePosition(vid, vid_player_mappings[vid].player.getCurrentTime());
                 }
                  if(vid_player_mappings[vid].type == 'Vimeo'){
                     var player = vid_player_mappings[vid].player;
              //       var curTime = player.api_getCurrentTime();
                //     doSavePosition(vid, vid_player_mappings[vid].player.api_getCurrentTime());
                 }
             }
         }

         function doSavePosition(vid, position){
              if(position && !isNaN(position)){
                  $.ajax({
                     type : 'POST',
                     url : '/api/seek/'+vid+'/'+position.toFixed(2),
                     success : function(response){
                         //....
                    },
                    failure : showErrorDialog
                 });
              }
         }

         function pauseVideo(){
             vid = curVID;
             if(vid_player_mappings[vid]){
                 if(vid_player_mappings[vid].type == 'YouTube'){
                     if(vid_player_mappings[vid].player)
                        vid_player_mappings[vid].player.pauseVideo();
                 }
                  if(vid_player_mappings[vid].type == 'Vimeo'){
                     //if(vid_player_mappings[vid].player)
                  //      vid_player_mappings[vid].player.api_pause();
                 }
             }
         }

         function playVideo(){
             if(vid_player_mappings[curVID]){
                 if(vid_player_mappings[curVID].type == 'YouTube'){
                     vid_player_mappings[curVID].player.playVideo();
                 }
                 if(vid_player_mappings[curVID].type == 'Vimeo'){
     //                vid_player_mappings[curVID].player.api_play();
                 }
             }
         }

        function seekTo(vid, pos){
            if(vid_player_mappings[vid]){
                 if(vid_player_mappings[vid].type == 'YouTube'){
                     if(vid_player_mappings[vid].player)
                        var player = vid_player_mappings[vid].player;
                        vid_player_mappings[vid].player.seekTo(pos);
                 }
                 if(vid_player_mappings[vid].type == 'Vimeo'){
                     if(vid_player_mappings[vid].player){
          //              vid_player_mappings[vid].player.api_seek(pos);
                     }
                 }
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

                    var obj = $(this).children(0);

                    var container_id = $(this).attr('id');
                    /*<hack>*/
                    //parse vid by looking @ container id...
                    var vid;
                    try{
                        vid = parseInt(container_id.substr('video-embed-wrapper-'.length));
                    }catch(exception){}
                    /*</hack>*/
                    

                    if(obj.is('video')){
                        
                    }

                    if(obj.is('object')){
                        /*we're likely dealing with either a YouTube or a Vimeo embed...*/

                        

                        var embed = obj.children('embed')[0];

                        var source = embed.src;

                        if (isYouTube(source)){

                           var ytVID = youtubeVID(source);

                           embed.id = 'youtube-embed-'+ytVID;
                           /*remove the damn autoplay flag*/
                           source = source.replace("autoplay=1", "autoplay=0");
                           source += "&enablejsapi=1"+"&playerapiid="+embed.id;
                           embed.src = source;


                            var player = embed;

                            vid_player_mappings[vid] = {player:player, type:'YouTube', isReady:false};
                            player_vid_mappings[player] = vid;
                        }

                    }
                    
                    if(obj.is('iframe')){
                      var source = obj.attr('src');
                      if(isVimeo(source)){
                           source = source.replace("autoplay=1", "autoplay=0");
                           source += "&api=1";
                           source += "&api_ready=vimeo_player_loaded&player_id=vimeo-player-"+vimeoVID(source);
                           obj.attr('src', source);
                           obj.attr('data-vid', vimeoVID(source));
                           obj.attr('id', 'vimeo-player-'+vimeoVID(source));
                           $f(obj.attr('id')).addEvent('ready', vimeo_player_loaded);
                          // vid_player_mappings[vid] = {player:player, type:'Vimeo', isReady:false};
                           //player_vid_mappings[player] = vid;
                        }
                    }

                }
            );
         }

        /*<hack>*/
        function isVimeo(src){
            if (src && src.indexOf("vimeo.com") >= 0){
                return true;
            }else{
                return false;
            }
        }

        function isYouTube(src){
            if (src && src.indexOf("youtube.com") >= 0){
                return true;
            }else{
                return false;
            }
        }
        /*</hack>*/

        /*<hack>*/
        function youtubeVID(src){
            /*parse embed code out of source url*/
            var _EMBED_START_DELIM = '/v/';
            var start_index = src.search(_EMBED_START_DELIM);
            var truncated = src.substr(start_index+_EMBED_START_DELIM.length);
            return truncated.substr(0, truncated.search('\\?'));
        }

        function vimeoVID(src){
            var _EMBED_START_DELIM = '/video/';
            var start_index = src.search(_EMBED_START_DELIM);
            var truncated = src.substr(start_index+_EMBED_START_DELIM.length);
            return truncated.substr(0, truncated.search('\\?'));
        }
        /*</hack>*/

        return {
            prepareVidForPlayback : prepareVidForPlayback,
            prepareEmbeds : prepareEmbeds,
            pauseVideo : pauseVideo,
            savePosition : savePosition,
            setCurVid : setCurVid,
            playVideo : playVideo,
            prepareCurVidForPlayback: prepareCurVidForPlayback
        }
    }

var videoController;
$(document).ready(function(){
    videoController = new kikinvideo.VideoController();
});