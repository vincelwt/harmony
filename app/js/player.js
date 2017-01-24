var confirmId; // Use to confirm if returned streamurl in callback is same as we want to play, util if we zap fastly

var playPauseIcon = getById("playpause_icon").classList;

try {
	var mediakeys = require('mediakeys').listen();

	mediakeys.on('play', function() {
		playPause();
	});

	mediakeys.on('next', function() {
		nextTrack();
	});

	mediakeys.on('back', function() {
		prevTrack();
	});

} catch (e) {
	console.log("Mediakeys module not found.");

	try { // Windows fix based on MarshallOfSound's ll-keyboard-hook-win npm package (MIT)
		if (process.platform === 'win32') {
			var remote = require('electron').remote;
			var globalShortcut = remote.globalShortcut;
			let keyRegisterFn = (...args) => globalShortcut.register(...args);

			const hook = require('ll-keyboard-hook-win');

			keyRegisterFn = (key, fn) => {
				hook.on('down', key, fn);
			};

			keyRegisterFn('MediaPlayPause', () => {
				playPause();
			});

			keyRegisterFn('MediaNextTrack', () => {
				nextTrack();
			});

			keyRegisterFn('MediaPreviousTrack', () => {
				prevTrack();
			});

			console.log(process.platform + " detected. Using ll-keyboard-hook-win.");
		}
	} catch (e) {
		console.log("ll-keyboard-hook-win module not found.");
	}
}

/** Only changes mprisPlayer if we need it to **/
let mprisPlayer = false;

if (fs.existsSync('/usr/share/applications/Harmony.desktop') // Deb Install
	|| fs.existsSync(process.env['HOME'] + '/.local/share/applications/appimagekit-harmony.desktop')) { // For AppImages

	try {
		var mpris = require('mpris-service'); // We can use MPRIS

		mprisPlayer = mpris({
			name: 'Harmony',
			identity: 'Harmony',
			supportedUriSchemes: ['file'],
			supportedMimeTypes: ['audio/mpeg', 'application/ogg'],
			supportedInterfaces: ['player'],
			desktopEntry: "Harmony"
		});

		mprisPlayer.on("playpause", function() {
			playPause();
		});

		mprisPlayer.on("pause", function() {
			playPause();
		});

		mprisPlayer.on("play", function() {
			playPause();
		});

		mprisPlayer.on("next", function() {
			nextTrack();
		});

		mprisPlayer.on("previous", function() {
			prevTrack();
		});
	} catch (e) {
		console.error("Error loading MPRIS module");
		console.error(e);
	}

}

function nextTrack() {
	let nextTrack = playingTrackList[g.playing.indexPlaying + 1];
	const isLastTrack = g.playing.indexPlaying + 1 == playingTrackList.length;

	// We restart playlist
	if (isLastTrack) {
		nextTrack = playingTrackList[0];
	}

	playTrack(nextTrack)
}

function prevTrack() {
	let prevTrack = playingTrackList[g.playing.indexPlaying - 1];
	const isFirstTrack = g.playing.indexPlaying == 0;

	// We restart the song
	if (isFirstTrack) {
		prevTrack = g.playing;
	}

	playTrack(prevTrack);
}

function playTrack(track) {
	//document.title = track.title + " - " + track.artist.name;

	getById("player-title").innerHTML = track.title;
	getById("player-artist").innerHTML = track.artist.name;
	getById("player-cover").src = testArtwork(track.artwork),

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
		new Notification(track.title, { 'body': 'By ' + track.artist.name, 'icon': track.artwork, 'tag': 'Harmony-playTrack', 'origin': 'Harmony' });

	if (mprisPlayer) {
		mprisPlayer.metadata = {
			'mpris:trackid': mprisPlayer.objectPath('track/0'),
			'mpris:length': track.duration * 1000, // In microseconds
			'mpris:artUrl': testArtwork(track.artwork),
			'xesam:title': track.title,
			'xesam:album': track.album.name,
			'xesam:artist': [track.artist.name]
		};
		mprisPlayer.playbackStatus = 'Playing';
	}

	if (settings.lastfm.active && window[g.playing.service].scrobbling) {
		console.log("Scrobbling song");
		var duration = g.playing.duration / 1000;
		api.post('lastfm', ['/2.0', 'track.updateNowPlaying'], settings.lastfm.session_key, { track: g.playing.title, artist: g.playing.artist.name, duration: duration }, function(err, result) {
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

	var favsLocation = window[track.service].favsLocation;
	var favsList = getListObject(favsLocation).tracks;

	if (!favsList) return false;

	for (t of favsList)
		if (t.id == track.id) return true;
	return false;

}

function FavPlaying(onlyFav) {
	var favsLocation = window[g.playing.service].favsLocation;
	var favsList = getListObject(favsLocation).tracks;

	if (!g.playing.favorited) {

		favsList.unshift(g.playing);
		new Notification('Track liked', { 'body': g.playing.title, 'icon': g.playing.artwork, 'tag': 'Harmony-Like', 'origin': 'Harmony' });
		g.playing.favorited = true;
		addClass("player_favorite", "active");
		window[g.playing.service].like();

	} else {

		if (onlyFav) 
			return new Notification('Track already liked', { 'body': g.playing.title, 'icon': g.playing.artwork, 'tag': 'Harmony-Like', 'origin': 'Harmony' });

		favsList.splice(favsList.indexOf(getTrackObject(favsList, g.playing.id)), 1);
		new Notification('Track unliked', { 'body': g.playing.title, 'icon': g.playing.artwork, 'tag': 'Harmony-Like', 'origin': 'Harmony' });
		g.playing.favorited = false;
		removeClass("player_favorite", "active");
		window[g.playing.service].unlike();

	}
}

var player = {};
player.elPlayer = getById('player');
player.elPlayerProgress = getById('player-progress-bar');
player.elPlayerBuffer = getById('player-buffer-bar');
player.elPlayerTimeLeft = getById('player-timeleft');

var scrub = getById('player-progress-bar-container');

player.elPlayer.addEventListener('timeupdate', function() {
	var mins = Math.floor((player.elPlayer.duration - player.elPlayer.currentTime) / 60, 10);
	var secs = Math.floor(player.elPlayer.duration - player.elPlayer.currentTime, 10) - mins * 60;

	if (!isNaN(mins) || !isNaN(secs))
		player.elPlayerTimeLeft.innerHTML = '-' + mins + ':' + (secs > 9 ? secs : '0' + secs);

	var pos = (player.elPlayer.currentTime / player.elPlayer.duration) * 100;
	player.elPlayerProgress.style.transform = 'translateX(' + pos + '%)'; //Translate is way more efficient than width : from 35% CPU to <10%
});

player.elPlayer.addEventListener('progress', function() {
	try {
		var Bufpos = (player.elPlayer.buffered.end(0) / player.elPlayer.duration) * 100;
		player.elPlayerBuffer.style.transform = 'translateX(' + Bufpos + '%)';
	} catch (e) {}
});

player.elPlayer.addEventListener('canplaythrough', function() {
	removeClass("playing_icon", "blink");
});

function toggleVolume() {
	removeClass('volume_range', 'hide');
	document.addEventListener('mouseup', function() {
		addClass('volume_range', 'hide');
		document.removeEventListener('mouseup', this);
	});
}

function volume() {
	var value = getById("volume_range").value;
	settings.volume = player.elPlayer.volume = parseFloat(value).toFixed(1);

	if (value > 0.6) {
		removeClass(['volume3', 'volume2', 'volume1'],'hide');
	} else if (value <= 0.6 && value > 0.2) {
		addClass('volume3', 'hide');
		removeClass(['volume2', 'volume1'], 'hide');
	} else if (value > 0) {
		addClass(['volume3', 'volume2'], 'hide');
		removeClass('volume1', 'hide');
	} else {
		addClass(['volume3', 'volume2', 'volume1'],'hide');
	}
}

/** * Responsible to add scrubbing drag or click scrub on track progress bar  */

function scrubTimeTrack(e) {
	var scrubWidth = parseFloat(window.getComputedStyle(scrub).width);

	var percent = (e.offsetX / scrubWidth),
		seek = percent * player.elPlayer.duration;

	if (player.elPlayer.networkState === 0 || player.elPlayer.networkState === 3)
		console.error("Oups, can't play this track");

	if (player.elPlayer.readyState > 0) {
		player.elPlayerProgress.style.transform = 'translateX(' + percent * 100 + '%)';
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

scrub.addEventListener('mouseup', function() {
	scrub.removeEventListener('mousemove', scrubTimeTrack);
	player.elPlayer.play();
	playPauseIcon.add("icon-pause");
	playPauseIcon.remove("icon-play");
});

player.elPlayer.addEventListener('ended', function() {

	if (settings.lastfm.active && window[g.playing.service].scrobbling) {
		console.log("Scrobbling song");
		var timestamp = Math.floor(Date.now() / 1000) - Math.floor(g.playing.duration / 1000);
		api.post('lastfm', ['/2.0', 'track.scrobble'], settings.lastfm.session_key, { track: g.playing.title, artist: g.playing.artist.name, timestamp: timestamp }, function(err, result) {
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
