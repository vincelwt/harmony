angular.module('swing30').controller('PlayerController', function($filter, $rootScope, $scope, hotkeys) {
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
      var nextTrack = getNextTrack($scope[$rootScope.playing.source], $rootScope.playing.id);
      if ($scope.shuffle) {
        var rand = Math.floor(Math.random() * $scope[$rootScope.playing.source].length);
        $scope.playTrack($scope[$rootScope.playing.source][rand])
      } else if (nextTrack !== null) {
        $scope.playTrack(nextTrack);
      } else if ($scope.repeat) { // If repeat is on, we restart playlist
        $scope.playTrack($scope[$rootScope.playing.source][0]) 
      } else {
        $rootScope.playing = null;
        $scope.isSongPlaying = false;
      }
    }

    $scope.prevTrack = function() {
      var prevTrack = getPrevTrack($scope[$rootScope.playing.source], $rootScope.playing.id);
      if (prevTrack !== null ) {
        $scope.playTrack(prevTrack);
      } else {
        $scope.playTrack($rootScope.playing);
      }
    }

    $rootScope.playTrack = function(track) {
      $rootScope.playing = track;

      $(player.elPlayerProgress).css({ width: '0%' });

      notifier.notify({ 'title': track.title, 'message': 'By '+track.artist, 'icon': track.artwork});
      document.title = track.title + " - " + track.artist;
      $rootScope.playing.favorited = $scope.isInFavorites(track);

      if (track.service == "soundcloud") {
        player.elPlayer.setAttribute('src', track.stream_url+"?client_id="+client_ids.sc.client_id);
        player.elPlayer.play();
      } else if (track.service == "GooglePm") {
        pm.getStreamUrl(track.id, function(err, streamUrl) {
          player.elPlayer.setAttribute('src', streamUrl);
          player.elPlayer.play();
        });
      } else if (track.service == "local") {
        player.elPlayer.setAttribute('src', track.stream_url);
        player.elPlayer.play();
      }

      //player.elThumb.setAttribute('src', track.artwork);
      //player.elThumb.setAttribute('alt', track.title);
      $scope.isSongPlaying = true
    }


    $scope.playPause = function() {
      if (player.elPlayer.paused) {
        player.elPlayer.play();
        $scope.isSongPlaying = true;
      } else {
        player.elPlayer.pause();
        $scope.isSongPlaying = false;
      }
    }

    $scope.isInFavorites = function(track) {
      if (track.service == 'GooglePm') {
        var t = $scope.GooglePmFavs
      } else if (track.service == 'soundcloud') {
        var t = $scope.soundcloudFavs
      } else if (track.service == 'local') {
        var t = $scope.localFavs
      }

      var i = t.length;
      while (i--) {
        if (t[i].id === track.id) return true;
      }
      return false;
    };

    $scope.FavPlaying = function() {
      if ($rootScope.playing.favorited) {
        if ($rootScope.playing.service == "soundcloud") {
          $scope.soundcloudFavs.splice($scope.soundcloudFavs.indexOf(getTrackObject($scope['soundcloudFavs'], $rootScope.playing.id)), 1);
          sc.delete('sc', '/me/favorites/'+$rootScope.playing.id, sc_access_token, {}, function(err, result) {
            if (err) notifier.notify({ 'title': 'Error unliking track', 'message': err });
          });
          notifier.notify({ 'title': 'Track unliked', 'message': $rootScope.playing.title });
          $rootScope.playing.favorited = false;
        } else if ($rootScope.playing.service == "local") {
          $scope.localFavs.splice($scope.localFavs.indexOf(getTrackObject($scope['localFavs'], $rootScope.playing.id)), 1);
          conf.set("localFavs", $scope.localFavs)
          notifier.notify({ 'title': 'Track unliked', 'message': $rootScope.playing.title });
          $rootScope.playing.favorited = false;
        } else if ($rootScope.playing.service == "GooglePm") {
          notifier.notify({ 'title': 'Sorry', 'message': "This isn't supported at the moment." });
        }
      } else {
        if ($rootScope.playing.service == "soundcloud") {
          $scope.soundcloudFavs.unshift($rootScope.playing);
          sc.put('sc', '/me/favorites/'+$rootScope.playing.id, sc_access_token, {}, function(err, result) {
            if (err) notifier.notify({ 'title': 'Error liking track', 'message': err });
          });
          notifier.notify({ 'title': 'Track liked', 'message': $rootScope.playing.title });
          $rootScope.playing.favorited = true;
        } else if ($rootScope.playing.service == "local") {
          $scope.localFavs.unshift($rootScope.playing);
          conf.set("localFavs", $scope.localFavs)
          notifier.notify({ 'title': 'Track liked', 'message': $rootScope.playing.title });
          $rootScope.playing.favorited = true;
        } else if ($rootScope.playing.service == "GooglePm") {
          notifier.notify({ 'title': 'Sorry', 'message': "This isn't supported at the moment." });
        }
      }
    }

    var player = {};
    player.elPlayer = document.getElementById('player');
    player.elPlayerProgress = document.getElementById('player-progress');
    player.elPlayerDuration = document.getElementById('player-duration');
    player.elPlayerTimeCurrent = document.getElementById('player-timecurrent');
    player.elThumb = document.getElementById('playerThumb');

    /** * Add event listener "time update" to song bar progress * and song timer progress */
    $(player.elPlayer).bind('timeupdate', function() {
        var pos = (player.elPlayer.currentTime / player.elPlayer.duration) * 100;
        var mins = Math.floor(player.elPlayer.currentTime / 60,10);
        var secs = Math.floor(player.elPlayer.currentTime, 10) - mins * 60;
        if ( !isNaN(mins) || !isNaN(secs) ) $(player.elPlayerTimeCurrent).text(mins + ':' + (secs > 9 ? secs : '0' + secs))
        $(player.elPlayerProgress).css({ width: pos + '%' });
    });

    /** *  * duration only once */
    $(player.elPlayer).bind('loadeddata', function() {
        var mins = Math.floor(player.elPlayer.duration / 60,10),
            secs = Math.floor(player.elPlayer.duration, 10) - mins * 60;
        if ( !isNaN(mins) || !isNaN(secs) ) {
            $(player.elPlayerDuration).text(mins + ':' + (secs > 9 ? secs : '0' + secs));
            $(player.elPlayerTimeCurrent).text('0:00');
        }
    });

    /** * Responsible to add scrubbing drag or click scrub on track progress bar  */
    var scrub = $(player.elPlayerProgress).parent().off();

    function scrubTimeTrack(e, el) {
        var percent = ( e.offsetX / $(el).width() ),
            duration = player.elPlayer.duration,
            seek = percent * duration;

        if (player.elPlayer.networkState === 0 || player.elPlayer.networkState === 3) console.error("Something went wrong. I can't play this track :(");
        if (player.elPlayer.readyState > 0)  player.elPlayer.currentTime = parseInt(seek, 10);
    }

    scrub.on('click', function(e) {  
      scrubTimeTrack(e, this) 
    });

    scrub.on('mousedown', function (e) {
        scrub.on('mousemove', function (e) { scrubTimeTrack(e, this); });
    });

    scrub.on('mouseup', function (e) {
        scrub.unbind('mousemove');
    });

    scrub.on('dragstart', function (e) {
        e.preventDefault();
    });

    player.elPlayer.addEventListener('ended', function() {
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