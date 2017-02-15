/**
 * Spotify API Abstraction
 */
class Spotify {

    /**
	 * Fetches data
	 *
     * @returns {Promise}
     */
	static fetchData () {

        return new Promise((resolve, reject) => {

            if (!settings.spotify.active) {
                return resolve();
			}

            if (!settings.spotify.refresh_token) {
                settings.spotify.error = true;
                return reject([null, true]);
            }

            api.init('spotify', data.client_ids.spotify.client_id, data.client_ids.spotify.client_secret);

            api.refreshToken('spotify', settings.spotify.refresh_token, (error, res) => {
                if (error) {
                    settings.spotify.error = true;
                    return reject([error, true]);
                }

                spotify_access_token = res.access_token;

                data.spotify = {};
                data.spotify.discover = [];
                data.spotify.mymusic = [];
                data.spotify.playlists = [];


                api.get('spotify', '/v1/me/playlists', spotify_access_token, { limit: 50 }, (err, result) => {

                    if (err) {
                        return reject([err]);
					}

                    for (let i of result.items) {

                        !function outer(i) {

                            api.get('spotify', i.tracks.href.split('.com')[1], spotify_access_token, { limit: 100 }, (err, result) => {
                                if (err) {
                                    return console.log(err);
								}

                                let tempTracks = [];
                                const isWeeklyDiscover = (i.href.indexOf("/spotifydiscover/") > -1);

                                function moreTracks(url) {
                                    api.get('spotify', url.split('.com')[1], spotify_access_token, { limit: 100 }, (err, result) => {
                                        if (err) return console.log(err);

                                        for (t of result.items)
                                            tempTracks.push(convertTrack(t.track));

                                        if (result.next) moreTracks(result.next);

                                    });
                                }

                                if (result) {
                                    for (let t of result.items) {
                                        tempTracks.push(convertTrack(t.track));
									}

                                    if (result.next) {
                                        moreTracks(result.next);
									}
                                }

                                if (!isWeeklyDiscover) {
                                    data.spotify.discover.push({
                                        title: i.name,
                                        id: i.id,
                                        icon: 'compass',
                                        artwork: i.images[0].url,
                                        tracks: tempTracks
                                    });
								} else {
                                    data.spotify.playlists.push({
                                        title: i.name,
                                        id: i.id,
                                        artwork: (i.images[0] ? i.images[0].url : ''),
                                        tracks: tempTracks
                                    });
								}

                                updateLayout();
                                renderPlaylists();

                            });

                        }(i);
                    }

                    let tempMytracks = [];

                    const addToSpotifyPlaylistFavs = (url) => {
                        api.get('spotify', url, spotify_access_token, { limit: 50 }, (err, result) => {
                            if (err) {
                                return reject([err]);
							}

                            for (let i of result.items) {
                                tempMytracks.push(convertTrack(i.track));
							}

                            if (result.next) {
                                addToSpotifyPlaylistFavs(result.next.split('.com')[1]);
							} else {

                                data.spotify.mymusic.push({
                                    title: 'Spotify',
                                    artwork: '',
                                    icon: 'spotify',
                                    id: 'favs',
                                    tracks: tempMytracks
                                });

                                renderPlaylists();
                                resolve();
                            }

                        });
                    };

                    addToSpotifyPlaylistFavs('/v1/me/tracks');

                });


            })
        });


    }

    /**
	 * Called when user wants to activate the service
	 *
     * @param callback {Function} Callback function
     */
    static login (callback) {

        api.oauthLogin('spotify', (code) => {

            api.init('spotify', data.client_ids.spotify.client_id, data.client_ids.spotify.client_secret);

            api.auth('spotify', code, (error, data) => {

                if (error || data.error) {
                    return callback(`${error} + ${data.error}`);
				}

                settings.spotify.refresh_token = data.refresh_token;
                callback();

            });

        });

    }

    /**
	 * Like a song 
	 *
     * @param trackId {string} The track's id (Again, unused)
     */
    static like (trackId) {
        api.put('spotify', '/v1/me/tracks?ids=' + g.playing.id, spotify_access_token, {}, err => {
            if (err) {
                new Notification('Error liking track', {
                    'body': err,
                    'tag': 'Harmony-Error',
                    'origin': 'Harmony'
                });
			}
        });
    }

    /**
	 * Unlike a song
	 *
     * @param trackId {string} The track's id
     */
	static unlike (trackId) {
        api.delete('spotify', '/v1/me/tracks?ids=' + g.playing.id, spotify_access_token, {}, err => {
            if (err) {
                new Notification('Error liking track', {
                    'body': err,
                    'tag': 'Harmony-Error',
                    'origin': 'Harmony'
                });
			}
        });
    }

    /**
	 * Get the streamable URL
	 *
     * @param track {Object} The track object
     * @param callback {Function} Callback function
     */
    static getStreamUrl (track, callback) {
        api.getStreamUrlFromName(track.duration, `${track.artist.name} ${track.title}`, (err, streamUrl) => {
            if (err) {
            	/** This was just nextTrack(), not sure if it was meant to reference the player object **/
                Player.nextTrack();
			} else {
                callback(streamUrl, track.id);
            }
        });
    }

    /**
	 * View the artist
	 *
     * @param track {Object} The track object
     */
    static viewArtist (track) {
        listView();

        /**
		 * Should introduce a setting here so users can choose country instead of defaulting to france
         */
        api.get('spotify', `/v1/artists/${track.artist.id}/top-tracks?country=FR`, spotify_access_token, {}, (err, result) => {
            if (err) {
                return console.error(err);
			}

            let tracks = [];

            for (let i of result.tracks) {
                tracks.push(convertTrack(i));
			}

            createTrackList(tracks);
        });
    }

    /**
	 * View an album
	 *
     * @param track {Object} The track object
     */
    static viewAlbum (track) {
        listView();

        api.get('spotify', `/v1/albums/${track.album.id}/tracks`, spotify_access_token, { limit: 50 }, (err, result) => {
            if (err) {
                return console.error(err);
			}

            let tracks = [];

            for (let i of result.items) {
                tracks.push(convertTrack(i));
			}

            createTrackList(tracks);
        });
    }

}

/** Static Properties **/
Spotify.discover = true;
Spotify.mymusic = true;
Spotify.playlists = true;
Spotify.favsLocation = "spotify,mymusic,favs";
Spotify.scrobbling = true;
Spotify.color = "#75C044";
Spotify.settings = {
	active: false
};

Spotify.loginBtnHtml = `

    <a id='Btn_spotify' class='button login spotify hide' onclick="login('spotify')">Listen with <b>Spotify</b></a>
    <a id='LoggedBtn_spotify' class='button login spotify hide' onclick="logout('spotify')">Disconnect</a>
    <span id='error_spotify' class='error hide'>Error, please try to login again</span>

`;

Spotify.loginBtnCss = `
	.spotify {
	  background-color: #75C044;
	  background-image: url('data:image/png;base64,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');
	}
`;

Spotify.contextmenuItems = [

	{
		title: 'View artist',
		fn: () => Spotify.viewArtist(trackList[index])
	},

	{
		title: 'View album',
		fn: () => Spotify.viewAlbum(trackList[index])
	}

];

const convertTrack = (rawTrack) => {

	return {
		'service': 'spotify',
		'title': rawTrack.name,
		'share_url': rawTrack.external_urls.spotify,
		'album': {
			'name': rawTrack.album.name,
			'id': rawTrack.album.id
		},
		'artist': {
			'name': rawTrack.artists[0].name,
			'id': rawTrack.artists[0].id
		},
		'id': rawTrack.id,
		'duration': rawTrack.duration_ms,
		'artwork': rawTrack.album.images[0].url
	};

};

module.exports = Spotify;