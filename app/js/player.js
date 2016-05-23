var notifier = require('node-notifier');

var asyncName;

var playPauseIcon = document.getElementById("playpause_icon").classList;

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
    playPause();
  });

  mprisPlayer.on("pause", function () {
    playPause();
  });

  mprisPlayer.on("play", function () {
    playPause();
  });

  mprisPlayer.on("next", function () {
    nextTrack();
  });

  mprisPlayer.on("previous", function () {
    prevTrack();
  });

} else {
  var mprisPlayer = false;
}

Mousetrap.bind('space', function(e) {
  playPause();
  e.preventDefault();
});

Mousetrap.bind('l', function(e) {
    FavPlaying();
    e.preventDefault();
});

Mousetrap.bind(['mod+right','n'], function(e) {
  nextTrack();
  e.preventDefault();
});

Mousetrap.bind(['mod+left','p'], function(e) {
  prevTrack();
  e.preventDefault();
});

function nextTrack() {
  if (g.playing.indexPlaying+1 == playingTrackList.length) {
    playTrack(playingTrackList[0]); //We restart playlist
  } else {
    var nextTrack = playingTrackList[g.playing.indexPlaying+1];
    playTrack(nextTrack);
  }
}

function prevTrack() {
  if (g.playing.indexPlaying == 0) {
    playTrack(g.playing);
  } else {
    var prevTrack = playingTrackList[g.playing.indexPlaying-1];
    playTrack(prevTrack);
  }
}

function playTrack(track) {
  document.title = track.title + " - " + track.artist;

  player.elPlayer.pause();
  player.elPlayer.currentTime = 0;

  g.playing = track;
  g.playing.favorited = isInFavorites(track);

  if (g.playing.favorited) addClass("player_favorite", "active");
  else removeClass("player_favorite", "active");

  switch (track.service) {
    case "soundcloud":
      player.elPlayer.setAttribute('src', track.stream_url+"?client_id="+client_ids.soundcloud.client_id);
      player.elPlayer.play();
      break
    case "googlepm":
      pm.getStreamUrl(track.id, function(err, streamUrl) {
        player.elPlayer.setAttribute('src', streamUrl);
        player.elPlayer.play();
      });
      break
    case "local":
      player.elPlayer.setAttribute('src', track.stream_url);
      player.elPlayer.play();
      break
    default:
      asyncName = track.artist+" "+track.title;
      api.getStreamUrlFromName(asyncName, function(err, streamUrl) {
        if (err) {
          nextTrack();
        } else {
          if (streamUrl[1] == asyncName) {
            player.elPlayer.setAttribute('src', streamUrl[0]);
            player.elPlayer.play();
          }
        }
      });
      break
  }

  g.isSongPlaying = true
  playPauseIcon.remove("icon-play");
  playPauseIcon.add("icon-pause");
  updatePlayingIcon();

  addClass("playing_icon", "blink");

  if (!require('remote').getCurrentWindow().isFocused())
    notifier.notify({ 'title': track.title, 'message': 'By '+track.artist, 'icon': track.artwork});

  if (mprisPlayer) {
    mprisPlayer.metadata = {
      'mpris:trackid': mprisPlayer.objectPath('track/0'),
      'mpris:length': track.duration * 1000, // In microseconds
      'mpris:artUrl': (track.artwork ? track.artwork : 'file://'+__dirname+'/img/blank_artwork.png'),
      'xesam:title': track.title,
      'xesam:album': (track.album ? track.album : ''),
      'xesam:artist': track.artist
    };
    mprisPlayer.playbackStatus = 'Playing';
  }

  if (settings.lastfm.active) {
    console.log("Scrobbling song");
    var duration = g.playing.duration / 1000;
    api.post('lastfm', ['/2.0','track.updateNowPlaying'], settings.lastfm.session_key, {track: g.playing.title, artist: g.playing.artist, duration: duration}, function(err, result) {
      if (err) console.log(err);
    });
  }

}

function playPause() {
  if (player.elPlayer.paused) {
    player.elPlayer.play();
    if (g.playing) {
      g.isSongPlaying = true;
      playPauseIcon.remove("icon-play");
      playPauseIcon.add("icon-pause");
      if (mprisPlayer) mprisPlayer.playbackStatus = 'Playing';
    } else {
      playByIndex(0);
    }
  } else {
    player.elPlayer.pause();
    g.isSongPlaying = false;
    playPauseIcon.remove("icon-pause");
    playPauseIcon.add("icon-play");
    if (mprisPlayer) mprisPlayer.playbackStatus = 'Paused';
  }
}

function isInFavorites(track) {
  var t = data[track.service+"Favs"];

  var i = t.length;
  while (i--)
    if (t[i].id === track.id) return true;

  return false;
};

function FavPlaying() {
  if (g.playing.favorited) {
    data[g.playing.service+'Favs'].splice(data[g.playing.service+'Favs'].indexOf(getTrackObject(data[g.playing.service+'Favs'], g.playing.id)), 1);
    notifier.notify({ 'title': 'Track unliked', 'message': g.playing.title });
    g.playing.favorited = false;

    removeClass("player_favorite", "active");

    switch (g.playing.service) {
      case "soundcloud":
        api.delete('soundcloud', '/me/favorites/'+g.playing.id, soundcloud_access_token, {}, function(err, result) {
          if (err) notifier.notify({ 'title': 'Error unliking track', 'message': err });
        });
        break;
      case "spotify":
        api.delete('spotify', '/v1/me/tracks?ids='+g.playing.id, spotify_access_token, {}, function(err, result) {
          if (err) notifier.notify({ 'title': 'Error unliking track', 'message': err });
          console.log(result);
        });
        break;
      case "googlepm":
        pm.getAllTracks(function(err, library) {
          for (i of library.data.items) { 
            if (i.id == g.playing.id) {
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
        conf.set("localFavs", data.localFavs);
        break;
    }

  } else {

    notifier.notify({ 'title': 'Track liked', 'message': g.playing.title });
    g.playing.favorited = true;
    addClass("player_favorite", "active");
    data[g.playing.service+'Favs'].unshift(g.playing);

    switch (g.playing.service) {
      case "soundcloud":
        api.put('soundcloud', '/me/favorites/'+g.playing.id, soundcloud_access_token, {}, function(err, result) {
          if (err) notifier.notify({ 'title': 'Error liking track', 'message': err });
        });
        break
      case "spotify":
        api.put('spotify', '/v1/me/tracks?ids='+g.playing.id, spotify_access_token, {}, function(err, result) {
          if (err) notifier.notify({ 'title': 'Error liking track', 'message': err });
          console.log(result);
        });
        break;
      case "googlepm":
        pm.getAllTracks(function(err, library) {
          for (i of library.data.items) { 
            if (i.id == g.playing.id) {
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
        conf.set("localFavs", data.localFavs);
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
var scrub = document.getElementById('player-progress-bar-container');

player.elPlayer.addEventListener('timeupdate', function() {
  var mins = Math.floor(player.elPlayer.currentTime / 60,10);
  var secs = Math.floor(player.elPlayer.currentTime, 10) - mins * 60;

  if ( !isNaN(mins) || !isNaN(secs) ) 
    player.elPlayerTimeCurrent.innerHTML = mins + ':' + (secs > 9 ? secs : '0' + secs);

  var pos = (player.elPlayer.currentTime / player.elPlayer.duration) * 100; 
  player.elPlayerProgress.style.transform = 'translateX('+pos+'%)'; //Translate is way more efficient than width : from 35% CPU to <10%
});

player.elPlayer.addEventListener('progress', function() {
  try {
    var Bufpos = (player.elPlayer.buffered.end(0) / player.elPlayer.duration) * 100; 
    player.elPlayerBuffer.style.transform = 'translateX('+Bufpos+'%)';
  } catch (e) {}
});

player.elPlayer.addEventListener('canplaythrough', function() {
  removeClass("playing_icon", "blink");
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

function scrubTimeTrack(e) {
  var scrubWidth = parseFloat(window.getComputedStyle(scrub).width);

  var percent = ( e.offsetX / scrubWidth),
      seek = percent * player.elPlayer.duration;

  if ( player.elPlayer.networkState === 0 || player.elPlayer.networkState === 3 )
    console.error("Oups, can't play this track");

  if (player.elPlayer.readyState > 0) {
    player.elPlayerProgress.style.transform = 'translateX('+percent*100+'%)';
    player.elPlayer.currentTime = parseInt(seek, 10);
  }
}

scrub.addEventListener('mousedown', function(e) {
  scrub.addEventListener('mousemove', scrubTimeTrack);
  player.elPlayer.pause(); // For smoothness on drag
  scrubTimeTrack(e); // For fast click event
});

scrub.addEventListener('mouseup', function () {
  scrub.removeEventListener('mousemove', scrubTimeTrack);
  player.elPlayer.play();
});

player.elPlayer.addEventListener('ended', function() {

  if (settings.lastfm.active && settings.lastfm.scrobble) {
    console.log("Scrobbling song");
    var timestamp = Math.floor(Date.now() / 1000) - Math.floor(g.playing.duration / 1000);
    api.post('lastfm', ['/2.0','track.scrobble'], settings.lastfm.session_key, {track: g.playing.title, artist: g.playing.artist, timestamp: timestamp}, function(err, result) {
      if (err) console.log(err);
    });
  }

  g.isSongPlaying = false;
  playPauseIcon.remove("icon-pause");
  playPauseIcon.add("icon-play");

  player.elPlayer.currentTime = 0;

  nextTrack();
});

/////////////////////////////////////////////
// When we start
/////////////////////////////////////////////

g.isSongPlaying = false;
playPauseIcon.add("icon-play");

g.playing = null;