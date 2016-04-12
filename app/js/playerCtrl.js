angular.module('harmony').controller('PlayerController', function($rootScope, $scope, hotkeys) {
    if (fs.existsSync('/usr/share/applications/harmony.desktop')) {

      var mpris = require('mpris-service'); // We can use MPRIS
      var mprisPlayer = mpris({
        name: 'harmony',
        identity: 'harmony',
        supportedUriSchemes: ['file'],
        supportedMimeTypes: ['audio/mpeg', 'application/ogg'],
        supportedInterfaces: ['player'],
        desktopEntry: "harmony"
      });

      mprisPlayer.on("playpause", function () {
        $scope.playPause();
      });

      mprisPlayer.on("pause", function () {
        $scope.playPause();
      });

      mprisPlayer.on("play", function () {
        $scope.playPause();
      });

      mprisPlayer.on("next", function () {
        $scope.nextTrack();
      });

      mprisPlayer.on("previous", function () {
        $scope.prevTrack();
      });

    } else {
      var mprisPlayer = false;
    }

    hotkeys.add({
      combo: 'space',
      description: 'Play / pause',
      callback : function(event, hotkey) {
        $scope.playPause();
        event.preventDefault();
      }
    });

    hotkeys.add({
      combo: 'l',
      description: 'Like playing track',
      callback : function(event, hotkey) {
        $scope.FavPlaying();
        event.preventDefault();
      }
    });

    hotkeys.add({
      combo: ['mod+right','n'],
      description: 'Next track',
      callback : function(event, hotkey) {
        $scope.nextTrack();
        event.preventDefault();
      }
    });

    hotkeys.add({
      combo: ['mod+left','p'],
      description: 'Previous track',
      callback : function(event, hotkey) {
        $scope.prevTrack();
        event.preventDefault();
      }
    });

    $scope.nextTrack = function() {
      if ($scope.settings.shuffle) {

        var rand = Math.floor(Math.random() * $rootScope.playingTrackList.length);
        $scope.playTrack($rootScope.playingTrackList[rand])

      } else if ($rootScope.playing.indexPlaying+1 == $rootScope.playingTrackList.length) {
       
        if ($scope.settings.repeat) { // If repeat is on, we restart playlist
          $scope.playTrack($rootScope.playingTrackList[0]) ;
        } else {
          player.elPlayer.pause();
          player.elPlayer.currentTime = 0;
          $rootScope.playing = null;
          $scope.isSongPlaying = false;
          if (mprisPlayer) mprisPlayer.playbackStatus = 'Stopped';
        }

      } else {
        var nextTrack = $rootScope.playingTrackList[$rootScope.playing.indexPlaying+1];
        $scope.playTrack(nextTrack);
      }
    }

    $scope.prevTrack = function() {
      if ($rootScope.playing.indexPlaying == 0) {
        $scope.playTrack($rootScope.playing);
      } else {
        var prevTrack = $rootScope.playingTrackList[$rootScope.playing.indexPlaying-1];

        $scope.playTrack(prevTrack);
      }
    }

    $rootScope.playTrack = function(track) {
      document.title = track.title + " - " + track.artist;

      player.elPlayer.pause();
      player.elPlayer.currentTime = 0;
      player.elPlayerProgress.style.width = "0%";
      player.elPlayerBuffer.style.width = "0%";

      $rootScope.playing = track;
      $rootScope.playing.favorited = $scope.isInFavorites(track);
      $rootScope.trackLoading = true;

      if (track.service == "soundcloud") {
        player.elPlayer.setAttribute('src', track.stream_url+"?client_id="+client_ids.soundcloud.client_id);
        player.elPlayer.play();
      } else if (track.service == "googlepm") {
        pm.getStreamUrl(track.id, function(err, streamUrl) {
          player.elPlayer.setAttribute('src', streamUrl);
          player.elPlayer.play();
        });
      } else if (track.service == "local") {
        player.elPlayer.setAttribute('src', track.stream_url);
        player.elPlayer.play();
      } else if (track.service == "spotify") {
        api.getStreamUrlFromName(track.artist+" "+track.title, function(err, streamUrl) { // Super highly alpha!!!
          if (err) {
            $scope.nextTrack();
            return
          } else {
            player.elPlayer.setAttribute('src', streamUrl);
            player.elPlayer.play();
          }
        });
      }

      //player.elThumb.setAttribute('src', track.artwork);
      $scope.isSongPlaying = true

      if ($scope.settings.backgroundNotify && !require('remote').getCurrentWindow().isFocused()) {
        notifier.notify({ 'title': track.title, 'message': 'By '+track.artist, 'icon': track.artwork});
      }

      if (mprisPlayer) {
        mprisPlayer.metadata = {
          'mpris:trackid': mprisPlayer.objectPath('track/0'),
          'mpris:length': track.duration * 1000, // In microseconds
          'mpris:artUrl': (track.artwork !== null ? track.artwork : ''),
          'xesam:title': track.title,
          'xesam:album': (track.album ? track.album : ''),
          'xesam:artist': track.artist
        };
        mprisPlayer.playbackStatus = 'Playing';
      }

      if ($scope.settings.lastfm.active && $scope.settings.lastfm.scrobble) {
        console.log("Scrobbling song");
        var duration = $scope.playing.duration / 1000;
        api.post('lastfm', ['/2.0','track.updateNowPlaying'], $scope.settings.lastfm.session_key, {track: $scope.playing.title, artist: $scope.playing.artist, duration: duration}, function(err, result) {
          if (err) console.log(err);
          console.log(result);
        });
      }

    }

    $scope.playPause = function() {
      if (player.elPlayer.paused) {
        player.elPlayer.play();
        if ($scope.playing) {
          $scope.isSongPlaying = true;
          if (mprisPlayer) mprisPlayer.playbackStatus = 'Playing';
        } else {
          $rootScope.playByIndex(0);
        }
      } else {
        player.elPlayer.pause();
        $scope.isSongPlaying = false;
        if (mprisPlayer) mprisPlayer.playbackStatus = 'Paused';
      }
    }

    $scope.isInFavorites = function(track) {
      var t = $scope.data[track.service+"Favs"];

      var i = t.length;
      while (i--) {
        if (t[i].id === track.id) return true;
      }
      return false;
    };

    $scope.FavPlaying = function() {
      if ($rootScope.playing.favorited) {
        $scope.data[$rootScope.playing.service+'Favs'].splice($scope.data[$rootScope.playing.service+'Favs'].indexOf(getTrackObject($scope.data[$rootScope.playing.service+'Favs'], $rootScope.playing.id)), 1);
        notifier.notify({ 'title': 'Track unliked', 'message': $rootScope.playing.title });
        $rootScope.playing.favorited = false;

        switch ($rootScope.playing.service) {
          case "soundcloud":
            api.delete('soundcloud', '/me/favorites/'+$rootScope.playing.id, soundcloud_access_token, {}, function(err, result) {
              if (err) notifier.notify({ 'title': 'Error unliking track', 'message': err });
            });
            break;
          case "spotify":
            api.delete('spotify', '/v1/me/tracks?ids='+$rootScope.playing.id, spotify_access_token, {}, function(err, result) {
              if (err) notifier.notify({ 'title': 'Error unliking track', 'message': err });
              console.log(result);
            });
            break;
          case "googlepm":
            pm.getAllTracks(function(err, library) {
              for (i of library.data.items) { 
                if (i.id == $rootScope.playing.id) {
                  var song = i;
                  break;
                }
              }
              song['rating'] = "0";
              pm.changeTrackMetadata(song, function(err, result) {
                if (err) notifier.notify({ 'title': 'Error unliking track', 'message': err });
              });
            }); 
            break;
          case "local":
            conf.set("localFavs", $scope.data.localFavs);
            break;
        }

      } else {

        notifier.notify({ 'title': 'Track liked', 'message': $rootScope.playing.title });
        $rootScope.playing.favorited = true;
        $scope.data[$rootScope.playing.service+'Favs'].unshift($rootScope.playing);

        switch ($rootScope.playing.service) {
          case "soundcloud":
            api.put('soundcloud', '/me/favorites/'+$rootScope.playing.id, soundcloud_access_token, {}, function(err, result) {
              if (err) notifier.notify({ 'title': 'Error liking track', 'message': err });
            });
            break
          case "spotify":
            api.put('spotify', '/v1/me/tracks?ids='+$rootScope.playing.id, spotify_access_token, {}, function(err, result) {
              if (err) notifier.notify({ 'title': 'Error liking track', 'message': err });
              console.log(result);
            });
            break;
          case "googlepm":
            pm.getAllTracks(function(err, library) {
              for (i of library.data.items) { 
                if (i.id == $rootScope.playing.id) {
                  var song = i;
                  break;
                }
              }
              song['rating'] = "5";
              pm.changeTrackMetadata(song, function(err, result) {
                if (err) notifier.notify({ 'title': 'Error liking track', 'message': err });
              });
            });
            break;
          case "local":
            conf.set("localFavs", $scope.data.localFavs);
            break;
        }

      }
    }

    var player = {};
    player.elPlayer = document.getElementById('player');
    player.elPlayerProgress = document.getElementById('player-progress-bar');
    player.elPlayerBuffer = document.getElementById('player-buffer-bar');
    player.elPlayerDuration = document.getElementById('player-duration');
    player.elPlayerTimeCurrent = document.getElementById('player-timecurrent');
    player.elThumb = document.getElementById('playerThumb');
    player.elPlayerProgress.style["transition-property"] = "width";
    player.elPlayerProgress.style["transition-duration"] = "0.4s";

    /* We use intervals instead of events because of CPU usage : from 35% to 11% */

    setInterval(function(){
      var mins = Math.floor(player.elPlayer.currentTime / 60,10);
      var secs = Math.floor(player.elPlayer.currentTime, 10) - mins * 60;
      if ( !isNaN(mins) || !isNaN(secs) ) player.elPlayerTimeCurrent.innerHTML = mins + ':' + (secs > 9 ? secs : '0' + secs);
    }, 1000);

    setInterval(function(){ 
      var pos = (player.elPlayer.currentTime / player.elPlayer.duration) * 100;
      player.elPlayerProgress.style.width = pos + '%';

      try {
        var Bufpos = (player.elPlayer.buffered.end(0) / player.elPlayer.duration) * 100;
        player.elPlayerBuffer.style.width = Bufpos + '%';
      } catch(e) {}

    }, 2500);

    player.elPlayer.addEventListener('waiting', function() {
      $rootScope.trackLoading = true;
      $scope.$apply();
    });

    player.elPlayer.addEventListener('canplaythrough', function() {
      $rootScope.trackLoading = false;
      $scope.$apply();
    });

    /** *  * duration only once */
    player.elPlayer.addEventListener('loadeddata', function() {
        var mins = Math.floor(player.elPlayer.duration / 60,10),
            secs = Math.floor(player.elPlayer.duration, 10) - mins * 60;
        if ( !isNaN(mins) || !isNaN(secs) ) {
            player.elPlayerDuration.innerHTML = mins + ':' + (secs > 9 ? secs : '0' + secs);
            player.elPlayerTimeCurrent.innerHTML = '0:00';
        }
    });

    /** * Responsible to add scrubbing drag or click scrub on track progress bar  */
    var scrub = document.getElementById('player-progress');

    function removeTransAndscrubTimeTrack(e) {
      player.elPlayerProgress.style["transition-duration"] = "";
      player.elPlayerProgress.style["transition-property"] = "";
      scrubTimeTrack(e);
    }

    function scrubTimeTrack(e) {
      var percent = ( e.offsetX / scrub.offsetWidth ),
          duration = player.elPlayer.duration,
          seek = percent * duration;

      if (player.elPlayer.networkState === 0 || player.elPlayer.networkState === 3) console.error("Something went wrong. I can't play this track :(");
      if (player.elPlayer.readyState > 0) { 
        player.elPlayerProgress.style.width = percent*100+"%";
        player.elPlayer.currentTime = parseInt(seek, 10);
      }
    }

    scrub.addEventListener('click', scrubTimeTrack);

    scrub.addEventListener('mousedown', function(e) {
      scrub.addEventListener('mousemove', removeTransAndscrubTimeTrack);
    });

    document.addEventListener('mouseup', function () { //If we release mouse not on progress bar
      scrub.removeEventListener('mousemove', removeTransAndscrubTimeTrack);
      player.elPlayerProgress.style["transition-property"] = "width";
      player.elPlayerProgress.style["transition-duration"] = "0.4s";
    });

    scrub.addEventListener('dragstart', function () {
      e.preventDefault();
    });

    player.elPlayer.addEventListener('ended', function() {

      if ($scope.settings.lastfm.active && $scope.settings.lastfm.scrobble) {
        console.log("Scrobbling song");
        var timestamp = Math.floor(Date.now() / 1000) - Math.floor($scope.playing.duration / 1000);
        api.post('lastfm', ['/2.0','track.scrobble'], $scope.settings.lastfm.session_key, {track: $scope.playing.title, artist: $scope.playing.artist, timestamp: timestamp}, function(err, result) {
          if (err) console.log(err);
          console.log(result);
        });
      }

      $scope.isSongPlaying = false;
      player.elPlayer.currentTime = 0;

      $scope.nextTrack();
      $rootScope.$apply(); // Fix playing icon not updating alone
    });

    /////////////////////////////////////////////
    // When we start
    /////////////////////////////////////////////

    $scope.isSongPlaying = false;
    $rootScope.playing = null;
})