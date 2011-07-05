kikinvideo.VideoController =
    function(){
        /*
        *This class is a highly experimental unifying
        * wrapper for the YouTube and Vimeo javascript control APIs,
        * as well as the javascript API for the html5 video
        * element.  The interface is synchronous, though the wrapped
        * methods are variously synchronous and asynchronous.
        * */

        var modes = {NORMAL:0, LEANBACK:1};

        var mode = modes.NORMAL;

        var curVID;

        //because we must control YouTube and Vimeo vids through
        //these services' javascript APIs, we can't just manipulate
        //<video> obj controls -- we need to store player->vid mappings.
        var vid_player_mappings = {}

        //this is unfortunately also necessary for fast vid lookup...
        var player_vid_mappings = {};

        //a sequential list of vids for the videos on the
        //current page...
        var vid_list = [];

        //because the damn vimeo player can't seek beyond
        //the portion of video currently buffered,
        //these kluges are necessary...
        var vimeoSeekTarget;
        var vimeoPlayerReadyTimers = [];

        //vimeo player ready callback
        function vimeo_player_loaded(playerID){
            var vid = $('#'+playerID).data('vid');
            if(vid_player_mappings[vid]){
                vid_player_mappings[vid].isReady = true;
                vid_player_mappings[vid].player.addEvent('finish', _onVideoEnded);
            }
            videoController.pauseVideo();
        }
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

        function removeEvent(element, eventName, callback) {
            if (element.removeEventListener()) {
                element.removeEventListener(eventName, callback, false);
            }
            else {
                element.removeEvent('on' + eventName, callback);
            }
        }


        function handleStateChange(newstate){
            //if(newstate.data == YT.PlayerState.PAUSED){
                //savePosition(curVID);
            //}
        }

        function setCurVid(vid){
            curVID = vid;
            if (vid_player_mappings[vid].type == 'Vimeo' ||
                    vid_player_mappings[vid].type == 'html5')
                prepareVidForPlayback();
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
                                 if(mode != modes.LEANBACK)
                                    seekTo(parseFloat(video.position));
                                 else{
                                     playVideo();
                                 }
                                 //if(vid_player_mappings[curVID].type != 'Vimeo')
                                    //playVideo();
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
                     //I prefer the synchronous YouTube api's way of
                     //handling this, but hey...
                     player.api('getCurrentTime', function(value, pid){
                        doSavePosition(vid, parseFloat(value));
                     });
                 }
                 if(vid_player_mappings[vid].type == 'html5'){
                     doSavePosition(vid, vid_player_mappings[vid].player.currentTime);
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
             var vid = curVID;
             if(vid_player_mappings[vid]){
                 if(vid_player_mappings[vid].type == 'YouTube'){
                     if(vid_player_mappings[vid].player)     
                        vid_player_mappings[vid].player.pauseVideo();
                 }
                  if(vid_player_mappings[vid].type == 'Vimeo'){
                     if(vid_player_mappings[vid].player)
                        vid_player_mappings[vid].player.api('pause');
                 }
                if(vid_player_mappings[vid].type == 'html5'){
                     if(vid_player_mappings[vid].player)
                        vid_player_mappings[vid].player.pause();
                 }
                 showThumbPlayButton(vid);
             }
         }

         function playVideo(){
             if(vid_player_mappings[curVID]){
                 if(vid_player_mappings[curVID].type == 'YouTube'){
                     vid_player_mappings[curVID].player.playVideo();
                 }
                 if(vid_player_mappings[curVID].type == 'Vimeo'){
                     vid_player_mappings[curVID].player.api('play');
                 }
                 if(vid_player_mappings[curVID].type == 'html5'){
                     if(vid_player_mappings[curVID].player)
                        vid_player_mappings[curVID].player.play();
                 }
                 hideThumbPlayButton(curVID);
             }
         }

        function seekTo(pos){
            var vid = curVID;
            if(vid_player_mappings[vid]){
                 if(vid_player_mappings[vid].type == 'YouTube'){
                     if(vid_player_mappings[vid].player)
                        var player = vid_player_mappings[vid].player;
                        vid_player_mappings[vid].player.seekTo(pos);
                 }
                 if(vid_player_mappings[vid].type == 'Vimeo'){
                     if(vid_player_mappings[vid].player){
                         vimeoSeekTarget = pos;
                        if(!vid_player_mappings[vid].isReady){
                            vimeoPlayerReadyTimers.push(setInterval(function(){
                                if(vid_player_mappings[vid].isReady){
                                    playVideo();
                                    pauseVideo();
                                    if(mode != modes.LEANBACK)
                                        vid_player_mappings[vid].player.addEvent('loadProgress', vimeoPlayerProgressHandler);
                                    //clear all wait timers....
                                    for(var i=0;i<vimeoPlayerReadyTimers.length;i++){
                                        clearInterval(vimeoPlayerReadyTimers[i]);
                                    }
                                }
                            }, 1000));
                        }
                        else{
                             playVideo();
                             pauseVideo();
                             if(mode != modes.LEANBACK)
                                 vid_player_mappings[vid].player.addEvent('loadProgress', vimeoPlayerProgressHandler);
                         }
                     }
                 }
                if(vid_player_mappings[vid].type == 'html5'){
                    vid_player_mappings[vid].player.currentTime = pos;
                }
            }
        }

        function vimeoPlayerProgressHandler(loadInfo){
            console.log(loadInfo.percent*loadInfo.duration);
            var secondsLoaded = loadInfo.percent*loadInfo.duration;
            if(vimeoSeekTarget){
                var progress = Math.ceil((loadInfo.percent*loadInfo.duration/vimeoSeekTarget)*100);
                if(progress <= 100){
                    if($('#video-buffering-vid-'+curVID).css('display') == 'none'){
                        $('#video-buffering-vid-'+curVID).fadeIn(200);
                    }
                    $('#video-buffering-vid-'+curVID+' .buffering-progress').html(progress+'%');
                }
                if(secondsLoaded >= vimeoSeekTarget && curVID){
                    vid_player_mappings[curVID].player.api('seekTo', vimeoSeekTarget);
                    vid_player_mappings[curVID].player.removeEvent('loadProgress', vimeoPlayerProgressHandler);
                    $('#video-buffering-vid-'+curVID).fadeOut(500);
                    playVideo();
                    vimeoSeekTarget = null;
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
                        vid_list.push(vid);
                    }catch(exception){}
                    /*</hack>*/
                    

                    if(obj.is('video')){
                        obj.autoplay = false;
                        //because we're dealing with video element,
                        //the element itself IS the player (we control
                        // playback by editing attrs)
                        obj.attr('id', 'html5-player-'+vid);
                        var player = obj.get(0);
                        addEvent(player, 'ended', function(){
                            _onVideoEnded();
                        });
                        addEvent(player, 'paused', savePosition);
                        vid_player_mappings[vid] = {player:player, type:'html5', isReady:true};
                        player_vid_mappings[player] = vid;
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
                           obj.attr('data-vid', vid);
                           obj.attr('id', 'vimeo-player-'+vimeoVID(source));
                           //init the froogaloop object...
                           var player = $f(obj.attr('id'));
                           player.addEvent('ready', vimeo_player_loaded);
                           vid_player_mappings[vid] = {player:player, type:'Vimeo', isReady:false};
                           player_vid_mappings[player] = vid;
                        }
                    }

                }
            );
         }

        //will give this the '_' prefix because, while I'd like to make it
        //truly private, it needs to be invoked by the
        //youtube embed's onStateChange listener which must
        //reside in the global namespace
        function _onVideoEnded(){
            //we want to toggle on leanback mode whenever we get to the end
            //of a video...
            //mode = modes.LEANBACK;
           // playNext();
        }

        function queueNext(onComplete){
            var curVideoPlayer = $('#video-player-'+ curVID);
            if(vid_list.indexOf(curVID) < vid_list.length-1){
                var nextVideoPlayer = $('#video-player-'+vid_list[vid_list.indexOf(curVID)+1]);
               swapPlayButtons(curVID, vid_list[vid_list.indexOf(curVID)+1]);
               setCurVid(vid_list[vid_list.indexOf(curVID)+1]);
                curVideoPlayer.fadeOut(2000, function(){
                });
                nextVideoPlayer.css({top:'42%', 'margin-top':
                            (nextVideoPlayer.height()*-.5)-30});
                nextVideoPlayer.fadeIn(700, function(){
                       if(vid_player_mappings[curVID].type != 'YouTube')
                            seekTo(0);
                       if(onComplete)
                            onComplete();
                    });
            }else{
                 //todo: code for handling case where
                 //cur vid is last on page
            }
        }

        function showThumbPlayButton(vid){
            if(!$('#video-thumbnail-btn-vid-' + vid).hasClass('video-thumbnail-btn')){
                $('#video-thumbnail-btn-vid-' + vid).addClass('video-thumbnail-btn')
            }
        }

        function hideThumbPlayButton(vid){
            if($('#video-thumbnail-btn-vid-' + vid).hasClass('video-thumbnail-btn')){
                $('#video-thumbnail-btn-vid-' + vid).removeClass('video-thumbnail-btn')
            }
        }

        function swapPlayButtons(vidOld, vidNew){

            if(!$('#video-thumbnail-btn-vid-' + vidOld).hasClass('video-thumbnail-btn')){
                $('#video-thumbnail-btn-vid-' + vidOld).addClass('video-thumbnail-btn')
            }
            if($('#video-thumbnail-btn-vid-' + vidNew).hasClass('video-thumbnail-btn')){
                $('#video-thumbnail-btn-vid-' + vidNew).removeClass('video-thumbnail-btn')
            }
        }

        function playNext(){
            queueNext(function(){
                //We're presently playing the YouTube
                //embeds by default on load, and firing
                //a "playVideo" prior to load will result
                //in an exception...
                if(vid_player_mappings[curVID].type!='YouTube')
                    playVideo();
            });
        }

        function playPrevious(){
            queuePrevious(function(){
                //see above...
               if(vid_player_mappings[curVID].type!='YouTube')
                    playVideo();
            });
        }

        function queuePrevious(onComplete){
            var curVideoPlayer = $('#video-player-'+ curVID);
            if(vid_list.indexOf(curVID) > 0){
                var prevVideoPlayer = $('#video-player-'+vid_list[vid_list.indexOf(curVID)-1]);
               swapPlayButtons(curVID, vid_list[vid_list.indexOf(curVID)-1]);
               setCurVid(vid_list[vid_list.indexOf(curVID)-1]);
                curVideoPlayer.fadeOut(2000, function(){
                });
                prevVideoPlayer.css({top:'42%', 'margin-top':
                            (nextVideoPlayer.height()*-.5)-30});
                prevVideoPlayer.fadeIn(700, function(){
                       if(vid_player_mappings[curVID].type != 'YouTube')
                            seekTo(0);
                       if(onComplete)
                            onComplete();
                    });
            }else{
                 //todo: code for handling case where
                 //cur vid is last on page
            }
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

        function setMode(nextMode){
            mode = nextMode;
        }

        return {
            _vid_player_mappings : vid_player_mappings,
            _player_vid_mappings : player_vid_mappings,
            _onVideoEnded : _onVideoEnded,
            prepareVidForPlayback : prepareVidForPlayback,
            prepareEmbeds : prepareEmbeds,
            pauseVideo : pauseVideo,
            savePosition : savePosition,
            setCurVid : setCurVid,
            playVideo : playVideo,
            seekTo : seekTo,
            prepareCurVidForPlayback: prepareCurVidForPlayback,
            queueNext : queueNext,
            queuePrevious : queuePrevious,
            playNext : playNext,
            playPrevious : playPrevious,
            modes : modes,
            setMode : setMode
        }
    }


//youtube player ready callback
function onYouTubePlayerReady(playerID){
    var player = document.getElementById(playerID);
    try{
        player.removeEventListener('onStateChange');
    }catch(exc){}
    player.addEventListener('onStateChange', 'stateChangeListener');
    videoController.prepareVidForPlayback();
}

function vimeo_player_paused(event){
    videoController.savePosition();
}

function stateChangeListener(newState){
    //youtube iframe api provided a STATES var in
    //YT namespace, but this swf variant of the api doesn't
    //...state "2" == paused
    if (newState == 2 && videoController.mode != videoController.modes.LEANBACK){
        videoController.savePosition();
    }
    //if video ended...
    if(newState == 0){
        videoController._onVideoEnded();
    }
}

var videoController;
$(document).ready(function(){
    videoController = new kikinvideo.VideoController();
});

