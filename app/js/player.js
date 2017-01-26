const isDebInstall = fs.existsSync('/usr/share/applications/Harmony.desktop');
const isAppImageInstall = fs.existsSync(process.env['HOME'] + '/.local/share/applications/appimagekit-harmony.desktop');
const scrub = getById('player-progress-bar-container');
let confirmId;
let playPauseIcon = getById("playpause_icon").classList;
let mprisPlayer = { enabled: false };
let g = window.g;

/**
 * Player class
 */
class Player {

    /**
     * Play the next track
     */
    static nextTrack () {
        let nextTrack = playingTrackList[g.playing.indexPlaying + 1];
        const isLastTrack = g.playing.indexPlaying + 1 == playingTrackList.length;

        // We restart playlist
        if (isLastTrack) {
            nextTrack = playingTrackList[0];
        }

        Player.playTrack(nextTrack)
    }

    /**
     * Play the previous track
     */
    static prevTrack () {
        let prevTrack = playingTrackList[g.playing.indexPlaying - 1];
        const isFirstTrack = g.playing.indexPlaying == 0;

        // We restart the song
        if (isFirstTrack) {
            prevTrack = g.playing;
        }

        Player.playTrack(prevTrack);
    }

    /**
     * Sets the class for the track element
     *
     * @param isFavorite {boolean} If the current track is a favorite or not.
     */
    static setFavoriteClass (isFavorite) {
        if (isFavorite) {
            addClass("player_favorite", "active");
        } else {
            removeClass("player_favorite", "active");
        }
    }

    /**
     * Play a given track.
     *
     * @param track {Object} The track object
     */
    static playTrack (track) {
        const windowIsFocused = require('electron').remote.getCurrentWindow().isFocused();
        const notificationsDisabled = settings.notifOff;
        const lastFmActive = settings.lastfm.active;

        getById("player-title").innerHTML = track.title;
        getById("player-artist").innerHTML = track.artist.name;
        getById("player-cover").src = testArtwork(track.artwork);

        Player.elPlayer.pause();
        Player.elPlayer.currentTime = 0;
        Player.elPlayer.src = "";

        g.playing = track;
        g.playing.favorited = Player.isInFavorites(track);

        Player.setFavoriteClass(g.playing.favorited);

        confirmId = track.id;

        window[g.playing.service].getStreamUrl(track, (streamUrl, id) => {
            if (confirmId == id) {
                Player.elPlayer.src = streamUrl;
                Player.elPlayer.play();
            }
        });

        g.isSongPlaying = true;
        playPauseIcon.remove("icon-play");
        playPauseIcon.add("icon-pause");
        updatePlayingIcon();

        addClass("playing_icon", "blink");

        if (!windowIsFocused && !notificationsDisabled) {
            new Notification(track.title, {
                'body': 'By ' + track.artist.name,
                'icon': track.artwork,
                'tag': 'Harmony-playTrack',
                'origin': 'Harmony'
            });
        }

        if (mprisPlayer.enabled) {
            mprisPlayer.metadata = {
                'mpris:trackid': mprisPlayer.objectPath('track/0'),
                'mpris:length': track.duration * 1000,
                'mpris:artUrl': testArtwork(track.artwork),
                'xesam:title': track.title,
                'xesam:album': track.album.name,
                'xesam:artist': [track.artist.name]
            };

            mprisPlayer.playbackStatus = 'Playing';
        }

        const currentlyScrobbling = window[g.playing.service].scrobbling;

        if (lastFmActive && currentlyScrobbling) {
            console.log("Scrobbling song");
            const duration = g.playing.duration / 1000;

            api.post('lastfm', ['/2.0', 'track.updateNowPlaying'], settings.lastfm.session_key,
                { track: g.playing.title, artist: g.playing.artist.name, duration: duration },
                err => console.log(err)
            );
        }

    }

    /**
     * Toggle play or pause.
     */
    static playPause () {
        let playbackStatus = 'Playing';
        let playing = true;

        /** Should really convert this into using pub/sub **/
        if (Player.elPlayer.paused) {
            Player.elPlayer.play();
            if (g.playing) {
                playPauseIcon.remove("icon-play");
                playPauseIcon.add("icon-pause");
            } else {
                playByIndex(0);
            }
        } else {
            Player.elPlayer.pause();
            playing = false;
            playPauseIcon.remove("icon-pause");
            playPauseIcon.add("icon-play");
            playbackStatus = 'Paused';
        }

        g.isSongPlaying = playing;

        if (mprisPlayer.enabled) {
            mprisPlayer.playbackStatus = playbackStatus;
        }
    }

    /**
     * Find tracks in favorites
     *
     * @param track {Object} The track object
     * @returns {boolean} True if the track is in favorites
     */
    static isInFavorites (track) {
        const favsLocation = window[track.service].favsLocation;
        const favsList = getListObject(favsLocation).tracks;

        if (!favsList) {
            return false;
        }

        for (let aTrack of favsList) {
            if (aTrack.id == track.id) {
                return true;
            }
        }

    }

    /**
     * Determines whether the current track is in favorites or not
     *
     * @param onlyFav {boolean} True if its an already liked track.
     * @returns {*} Returns a new notification
     */
    static FavPlaying (onlyFav) {
        const favsLocation = window[g.playing.service].favsLocation;
        const favsList = getListObject(favsLocation).tracks;
        let playing = g.playing;
        let notificationTitle = 'Track liked';

        if (!playing.favorited) {

            favsList.unshift(playing);

            playing.favorited = true;
            addClass("player_favorite", "active");
            window[playing.service].like();

        } else {
            favsList.splice(favsList.indexOf(getTrackObject(favsList, playing.id)), 1);
            playing.favorited = false;
            removeClass("player_favorite", "active");
            window[playing.service].unlike();
            notificationTitle = 'Track unliked';
        }

        if (onlyFav) {
            notificationTitle = 'Track already liked';
        }

        return new Notification(notificationTitle, {
            'body': playing.title,
            'icon': playing.artwork,
            'tag': 'Harmony-Like',
            'origin': 'Harmony'
        });
    }

}

/**
 * Static properties, Electron doesn't support these natively yet.
 */
Player.elPlayer = getById('player');
Player.elPlayerProgress = getById('player-progress-bar');
Player.elPlayerBuffer = getById('player-buffer-bar');
Player.elPlayerTimeLeft = getById('player-timeleft');

try {
    const mediakeys = require('mediakeys').listen();

    mediakeys.on('play', () => Player.playPause());

    mediakeys.on('next', () => Player.nextTrack());

    mediakeys.on('back', () => Player.prevTrack());

} catch (e) {
    console.log("Mediakeys module not found.");

    try {
        /**
         * Windows fix based on MarshallOfSound's ll-keyboard-hook-win npm package (MIT)
         */
        if (process.platform === 'win32') {
            const remote = require('electron').remote;
            const globalShortcut = remote.globalShortcut;
            let keyRegisterFn = (...args) => globalShortcut.register(...args);

            const hook = require('ll-keyboard-hook-win');

            keyRegisterFn = (key, fn) => hook.on('down', key, fn);

            keyRegisterFn('MediaPlayPause', () => Player.playPause());

            keyRegisterFn('MediaNextTrack', () => Player.nextTrack());

            keyRegisterFn('MediaPreviousTrack', () => Player.prevTrack());

            console.log(process.platform + " detected. Using ll-keyboard-hook-win.");
        }
    } catch (e) {
        console.log("ll-keyboard-hook-win module not found.");
    }
}

if (isDebInstall || isAppImageInstall) { // For AppImages

    try {
        const mpris = require('mpris-service'); // We can use MPRIS

        mprisPlayer = mpris({
            name: 'Harmony',
            identity: 'Harmony',
            supportedUriSchemes: ['file'],
            supportedMimeTypes: ['audio/mpeg', 'application/ogg'],
            supportedInterfaces: ['player'],
            desktopEntry: "Harmony"
        });

        mprisPlayer.on("playpause", () => Player.playPause());
        mprisPlayer.on("pause", () => Player.playPause());
        mprisPlayer.on("play", () => Player.playPause());
        mprisPlayer.on("next", () => Player.nextTrack());
        mprisPlayer.on("previous", () => Player.prevTrack());

        mprisPlayer.enabled = true;

    } catch (e) {
        console.error("Error loading MPRIS module");
        console.error(e);
    }

}

Player.elPlayer.addEventListener('timeupdate', () => {
    const mins = Math.floor((Player.elPlayer.duration - Player.elPlayer.currentTime) / 60, 10);
    const secs = Math.floor(Player.elPlayer.duration - Player.elPlayer.currentTime, 10) - mins * 60;
    const pos = (Player.elPlayer.currentTime / Player.elPlayer.duration) * 100;
    const seconds = (secs > 9 ? secs : '0' + secs);

    if (!isNaN(mins) || !isNaN(secs)) {
        Player.elPlayerTimeLeft.innerHTML = '-' + mins + ':' + seconds;
    }

    Player.elPlayerProgress.style.transform = 'translateX(' + pos + '%)';
});

Player.elPlayer.addEventListener('progress', () => {
    try {
        const Bufpos = (Player.elPlayer.buffered.end(0) / Player.elPlayer.duration) * 100;
        Player.elPlayerBuffer.style.transform = 'translateX(' + Bufpos + '%)';
    } catch (e) {}
});

Player.elPlayer.addEventListener('canplaythrough', () => removeClass("playing_icon", "blink"));

function toggleVolume () {
    removeClass('volume_range', 'hide');
    document.addEventListener('mouseup', function() {
        addClass('volume_range', 'hide');
        document.removeEventListener('mouseup', this);
    });
}

function volume () {
    const value = getById("volume_range").value;
    settings.volume = Player.elPlayer.volume = parseFloat(value).toFixed(1);

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

/**
 * Scrubs the player progress bar.
 *
 * @param e {Event} The mouse event
 */
function scrubTimeTrack (e) {
    const scrubWidth = parseFloat(window.getComputedStyle(scrub).width);
    const percent = (e.offsetX / scrubWidth);
    const seek = percent * Player.elPlayer.duration;

    if (Player.elPlayer.networkState === 0 || Player.elPlayer.networkState === 3)
        console.error("Oups, can't play this track");

    if (Player.elPlayer.readyState > 0) {
        Player.elPlayerProgress.style.transform = 'translateX(' + percent * 100 + '%)';
        Player.elPlayer.currentTime = parseInt(seek, 10);
    }
}

scrub.addEventListener('mousedown', (e) => {
    scrub.addEventListener('mousemove', scrubTimeTrack);
    Player.elPlayer.pause(); // For smoothness on drag
    playPauseIcon.remove("icon-pause");
    playPauseIcon.add("icon-play");
    scrubTimeTrack(e); // For fast click event
});

scrub.addEventListener('mouseup', () => {
    scrub.removeEventListener('mousemove', scrubTimeTrack);
    Player.elPlayer.play();
    playPauseIcon.add("icon-pause");
    playPauseIcon.remove("icon-play");
});

Player.elPlayer.addEventListener('ended', () => {

    if (settings.lastfm.active && window[g.playing.service].scrobbling) {
        console.log("Scrobbling song");
        const timestamp = Math.floor(Date.now() / 1000) - Math.floor(g.playing.duration / 1000);
        api.post('lastfm', ['/2.0', 'track.scrobble'], settings.lastfm.session_key,
            { track: g.playing.title, artist: g.playing.artist.name, timestamp: timestamp },
            err => console.log(err)
        );
    }

    g.isSongPlaying = false;
    playPauseIcon.remove("icon-pause");
    playPauseIcon.add("icon-play");

    Player.elPlayer.currentTime = 0;

    Player.nextTrack();
});

/////////////////////////////////////////////
// When we start
/////////////////////////////////////////////

g.isSongPlaying = false;
playPauseIcon.add("icon-play");

g.playing = null;
