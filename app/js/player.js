var notifier = require('node-notifier');

var confirmId; // Use to confirm if returned streamurl in callback is same as we want to play, util if we zap fastly

var playPauseIcon = getById("playpause_icon").classList;

try {
  var mediakeys = require('mediakeys').listen();

  mediakeys.on('play', function () {
      playPause();
  })
  mediakeys.on('next', function () {
      nextTrack();
  })
  mediakeys.on('back', function () {
      prevTrack();
  })
} catch(e) {
  console.log("Mediakeys module not found.");
}

if (fs.existsSync('/usr/share/applications/Harmony.desktop')) {

  var mpris = require('mpris-service'); // We can use MPRIS
  var mprisPlayer = mpris({
    name: 'Harmony',
    identity: 'Harmony',
    supportedUriSchemes: ['file'],
    supportedMimeTypes: ['audio/mpeg', 'application/ogg'],
    supportedInterfaces: ['player'],
    desktopEntry: "Harmony"
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
  document.title = track.title + " - " + track.artist.name;
  getById("title").innerHTML = track.title + " - " + track.artist.name;

  player.elPlayer.pause();
  player.elPlayer.currentTime = 0;
  player.elPlayer.src = "";

  g.playing = track;
  g.playing.favorited = isInFavorites(track);

  if (g.playing.favorited) addClass("player_favorite", "active");
  else removeClass("player_favorite", "active");

  confirmId = track.id;
  window[g.playing.service].getStreamUrl(track, function(streamUrl, id) {
    if (confirmId == id) {
      player.elPlayer.src = streamUrl;
      player.elPlayer.play();
    }
  });

  g.isSongPlaying = true
  playPauseIcon.remove("icon-play");
  playPauseIcon.add("icon-pause");
  updatePlayingIcon();

  addClass("playing_icon", "blink");

  if (!require('electron').remote.getCurrentWindow().isFocused() && !settings.notifOff)
    notifier.notify({ 'title': track.title, 'message': 'By '+track.artist.name, 'icon': track.artwork});

  if (mprisPlayer) {
    mprisPlayer.metadata = {
      'mpris:trackid': mprisPlayer.objectPath('track/0'),
      'mpris:length': track.duration * 1000, // In microseconds
      'mpris:artUrl': (track.artwork ? track.artwork : 'file://'+__dirname+'/img/blank_artwork.png'),
      'xesam:title': track.title,
      'xesam:album': track.album.name,
      'xesam:artist': track.artist.name
    };
    mprisPlayer.playbackStatus = 'Playing';
  }

  if (settings.lastfm.active) {
    console.log("Scrobbling song");
    var duration = g.playing.duration / 1000;
    api.post('lastfm', ['/2.0','track.updateNowPlaying'], settings.lastfm.session_key, {track: g.playing.title, artist: g.playing.artist.name, duration: duration}, function(err, result) {
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

  for (var t of data[track.service+"PlaylistFavs"])
    if (t.id == track.id) return true;
  return false;

}

function FavPlaying() {
  if (g.playing.favorited) {
    data[g.playing.service+'PlaylistFavs'].splice(data[g.playing.service+'PlaylistFavs'].indexOf(getTrackObject(data[g.playing.service+'PlaylistFavs'], g.playing.id)), 1);
    notifier.notify({ 'title': 'Track unliked', 'message': g.playing.title, 'icon': g.playing.artwork });
    g.playing.favorited = false;
    removeClass("player_favorite", "active");

    window[g.playing.service].like();

  } else {

    data[g.playing.service+'PlaylistFavs'].unshift(g.playing);
    notifier.notify({ 'title': 'Track liked', 'message': g.playing.title, 'icon': g.playing.artwork });
    g.playing.favorited = true;
    addClass("player_favorite", "active");

    window[g.playing.service].unlike();

  }
}

var player = {};
player.elPlayer = getById('player');
player.elPlayerProgress = getById('player-progress-bar');
player.elPlayerBuffer = getById('player-buffer-bar');
player.elPlayerDuration = getById('player-duration');
player.elPlayerTimeCurrent = getById('player-timecurrent');
player.elThumb = getById('playerThumb');
var scrub = getById('player-progress-bar-container');

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


function toggleVolume() {
  removeClass('volume_range', 'hide');
  document.addEventListener('mouseup', function(){
    addClass('volume_range', 'hide');
    document.removeEventListener('mouseup', this);
  });
}

function volume() {
    var value = getById("volume_range").value;
    player.elPlayer.volume = parseFloat(value).toFixed(1);
    settings.volume = parseFloat(value).toFixed(1);
};

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
  playPauseIcon.remove("icon-pause");
  playPauseIcon.add("icon-play");
  scrubTimeTrack(e); // For fast click event
});

scrub.addEventListener('mouseup', function () {
  scrub.removeEventListener('mousemove', scrubTimeTrack);
  player.elPlayer.play();
  playPauseIcon.add("icon-pause");
  playPauseIcon.remove("icon-play");
});

player.elPlayer.addEventListener('ended', function() {

  if (settings.lastfm.active) {
    console.log("Scrobbling song");
    var timestamp = Math.floor(Date.now() / 1000) - Math.floor(g.playing.duration / 1000);
    api.post('lastfm', ['/2.0','track.scrobble'], settings.lastfm.session_key, {track: g.playing.title, artist: g.playing.artist.name, timestamp: timestamp}, function(err, result) {
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
