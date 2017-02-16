var PlayMusic = require('playmusic'),
	pm = new PlayMusic();

class Googlepm {

    /**
	 * Fetch data
     * @param callback
     * @returns {Promise}
     */
    static fetchData (callback) {

		return new Promise((resolve, reject) => {
			
			pm.init({ masterToken: settings.googlepm.masterToken }, (err, res) => {
				if (err) {
					settings.googlepm.error = true;
					return reject([err, true]);
				}

				data.googlepm = {};
				data.googlepm.mymusic = [];
				data.googlepm.playlists = [];
				data.googlepm.discover = [];

				pm.getAllTracks((err, library) => {
					if (err) return reject([err]);

					data.googlepm.mymusic.push({
						title: 'Google Play Music',
						artwork: '',
						icon: 'note-beamed',
						id: 'library',
						tracks: []
					});

					data.googlepm.playlists.push({
						title: 'Thumbs up',
						artwork: '',
						id: 'favs',
						icon: 'thumbs-up',
						tracks: []
					});

					for (i of library.data.items) {

						if (i.albumArtRef === undefined) {
							i.albumArtRef = [{
								'url': ""
							}]
						};

						data.googlepm.mymusic[0].tracks.push({
							'service': 'googlepm',
							'source': 'googlepm,mymusic,library',
							'title': i.title,
							'share_url': 'https://www.youtube.com/results?search_query=' + encodeURIComponent(i.artist + " " + i.title),
							'artist': {
								'name': i.artist,
								'id': (i.artistId ? i.artistId[0] : '')
							},
							'album': {
								'name': i.album,
								'id': i.albumId
							},
							'trackNumber': i.trackNumber,
							'id': i.id,
							'duration': i.durationMillis,
							'artwork': i.albumArtRef[0].url
						});

						if (i.rating == 5)
							data.googlepm.playlists[0].tracks.push({
								'service': 'googlepm',
								'source': 'googlepm,playlists,thumbsup',
								'title': i.title,
								'share_url': 'https://www.youtube.com/results?search_query=' + encodeURIComponent(i.artist + " " + i.title),
								'artist': {
									'name': i.artist,
									'id': (i.artistId ? i.artistId[0] : '')
								},
								'album': {
									'name': i.album,
									'id': i.albumId
								},
								'id': i.id,
								'storeId': (i.storeId ? i.storeId : undefined),
								'duration': i.durationMillis,
								'artwork': i.albumArtRef[0].url,
								'RatingTimestamp': i.lastRatingChangeTimestamp
							});
					}

					pm.getFavorites((err, favorites_data) => { // Works only when all-access
						var added;
						var favorites_data = favorites_data.track;

						for (f of favorites_data) {
							for (var z = 0; z < data.googlepm.playlists[0].tracks.length; z++) {
								if (data.googlepm.playlists[0].tracks[z].storeId == f.id ||
									(data.googlepm.playlists[0].tracks[z].title == f.title && data.googlepm.playlists[0].tracks[z].artist == f.artist)) { // Already in favs, but this one probably has better metadatas

									data.googlepm.playlists[0].tracks[z] = {
										'service': 'googlepm',
										'source': 'googlepm,playlists,thumbsup',
										'title': f.title,
										'share_url': 'https://www.youtube.com/results?search_query=' + encodeURIComponent(f.artist + " " + f.title),
										'artist': {
											'name': f.artist,
											'id': f.artist
										},
										'album': {
											'name': f.album,
											'id': f.albumId
										},
										'id': f.storeId,
										'duration': f.durationMillis,
										'artwork': f.imageBaseUrl,
										'RatingTimestamp': f.lastRatingChangeTimestamp,
										'allAccess': true
									};
									added = true;
									break;
								}
								added = false;
							}

							if (!added)
								data.googlepm.playlists[0].tracks.push({
									'service': 'googlepm',
									'source': 'googlepm,playlists,thumbsup',
									'title': f.title,
									'share_url': 'https://www.youtube.com/results?search_query=' + encodeURIComponent(f.artist + " " + f.title),
									'artist': {
										'name': f.artist,
										'id': f.artist
									},
									'album': {
										'name': f.album,
										'id': f.albumId
									},
									'id': f.storeId,
									'duration': f.durationMillis,
									'artwork': f.imageBaseUrl,
									'RatingTimestamp': f.lastRatingChangeTimestamp, // Tracks with ratingTimeStamp
									'allAccess': true
								});

						}

						if (data.googlepm.playlists[0].tracks.length > 0)
							data.googlepm.playlists[0].tracks.sort( // Sort by rating date
								(a, b) => {
									if (typeof b.RatingTimestamp == 'undefined')
										return -1;
									else if (typeof a.RatingTimestamp == 'undefined')
										return 1;
									return b.RatingTimestamp - a.RatingTimestamp;
								}
							);

						updateLayout();


						pm.getPlayLists((err, playlists_data) => {

							pm.getPlayListEntries((err, playlists_entries_data) => {

								if (playlists_data.data)
									for (i of playlists_data.data.items)
										data.googlepm.playlists.push({
											title: i.name,
											id: i.id,
											tracks: []
										});


								if (playlists_entries_data.data)

									for (t of playlists_entries_data.data.items) {

									if (t.track) { // If there is already track metadatas then it's an all access song
										if (t.track.albumArtRef === undefined) {
											i.track.albumArtRef = [{
												'url': ""
											}]
										};

										for (pl of data.googlepm.playlists)
											if (pl.id == t.playlistId)
												pl.tracks.push({
													'service': 'googlepm',
													'source': 'googlepm.playlists,' + t.playlistId,
													'title': t.track.title,
													'share_url': 'https://www.youtube.com/results?search_query=' + encodeURIComponent(t.track.artist + " " + t.track.title),
													'artist': {
														'name': t.track.artist,
														'id': (t.track.artistId ? t.track.artistId[0] : '')
													},
													'album': {
														'name': t.track.album,
														'id': t.track.albumId
													},
													'trackNumber': t.track.trackNumber,
													'id': t.track.storeId,
													'duration': t.track.durationMillis,
													'artwork': t.track.albumArtRef[0].url
												});
									} else {
										var track_object = getTrackObject(data.googlepm.mymusic[0].tracks, t.trackId);
										if (track_object) {
											track_object.source = 'googlepm,playlists,' + t.playlistId;
											for (pl of data.googlepm.playlists)
												if (pl.id == t.playlistId)
													pl.tracks.push(track_object);
										}
									}
								}

								for (p of data.googlepm.playlists)
									if (typeof p.tracks[0] != "undefined")
										p.artwork = p.tracks[0].artwork; // Set the first track's artwork as playlist's artwork
									else p.artwork = '';

								renderPlaylists();
								updateLayout();

								resolve();
							});
						});

						var ifl_id;
						var temp_arr = []

						// get random song from thumbs up to create station
						for (a of data.googlepm.playlists[0].tracks)
							if (a.allAccess) temp_arr.push(a.id);

						ifl_id = temp_arr[Math.floor(Math.random() * data.googlepm.playlists[0].tracks.length)];

						if (typeof ifl_id != "undefined") {
							pm.createStation("I'm feeling lucky", ifl_id, "track", (err, station_data) => {

								if (err) return console.log(err); // We don't reject cause this can happen with non-all-access accounts

								pm.getStationTracks(station_data.mutate_response[0].id, 50, (err, station_tracks) => {
									if (err) return console.log(err);

									data.googlepm.discover.push({
										id: 'ifl',
										title: "I'm feeling lucky",
										icon: 'star',
										artwork: '',
										tracks: []
									});

									for (t of station_tracks.data.stations[0].tracks) {
										data.googlepm.discover[0].tracks.push({
											'service': 'googlepm',
											'source': 'googlepm,discover,ifl',
											'title': t.title,
											'share_url': 'https://www.youtube.com/results?search_query=' + encodeURIComponent(t.artist + " " + t.title),
											'artist': {
												'name': t.artist,
												'id': (t.artistId ? t.artistId[0] : '')
											},
											'album': {
												'name': t.album,
												'id': t.albumId
											},
											'trackNumber': t.trackNumber,
											'id': t.storeId,
											'duration': t.durationMillis,
											'artwork': (t.albumArtRef ? t.albumArtRef[0].url : '')
										});
									}

									if (typeof data.googlepm.discover[0].tracks[0] != "undefined")
										data.googlepm.discover[0].artwork = data.googlepm.discover[0].tracks[0].artwork; // Set the first track's artwork as station's artwork
									else p.artwork = '';

									renderPlaylists();
									updateLayout();

								});
							});
						}

					});
				});
			});
		});

    }

	/**
    * View a track's artist
    *
    * @param track {Object} The track object
    */

	static viewArtist (track) {
		settings.layout = 'list';
		updateLayout();

		getById("search").value = track.artist.name;
		changeActiveTab("googlepm,mymusic,library", true);
	}

	/**
    * View a track's album
    *
    * @param track {Object} The track object
    */

	static viewAlbum (track) {
		settings.layout = 'list';
		updateLayout();

		getById("search").value = track.album.name;
		changeActiveTab("googlepm,mymusic,library", true);
	}

	/**
	* Create a station based on a track
	*
	* @param track {Object} The track object
	*/

	static createStation (track) {
		listView();

		pm.createStation("Station", trackList[index].id, "track", (err, station_data) => {

			if (err) return console.log(err);

			pm.getStationTracks(station_data.mutate_response[0].id, 50, (err, station_tracks) => {
				if (err) {
					console.log(err);
					new Notification('Feature not available', {
						'body': 'Sorry, this feature is only available with all-access tracks.',
						'icon': track.artwork,
						'tag': 'Harmony-playTrack',
						'origin': 'Harmony'
					});
				}

				var tracks = [];

				for (t of station_tracks.data.stations[0].tracks)
					tracks.push({
						'service': 'googlepm',
						'source': 'googlepm,discover,googlepm_custom_station',
						'title': t.title,
						'share_url': 'https://www.youtube.com/results?search_query=' + encodeURIComponent(t.artist + " " + t.title),
						'artist': {
							'name': t.artist,
							'id': (t.artistId ? t.artistId[0] : '')
						},
						'album': {
							'name': t.album,
							'id': t.albumId
						},
						'trackNumber': t.trackNumber,
						'id': t.storeId,
						'duration': t.durationMillis,
						'artwork': (t.albumArtRef ? t.albumArtRef[0].url : '')
					});

				createTrackList(tracks);

			});
		});
	}

	/**
	* Called when user wants to activate the service
	*
	* @param trackId {string} The track's id (It uses g.playing instead though?)
	*/

	static login (callback) {
		settings.googlepm.user = getById("googlepmUser").value;
		var pm_passwd = getById("googlepmPasswd").value;

		if (!settings.googlepm.user || !pm_passwd) return;

		pm.login({ email: settings.googlepm.user, password: pm_passwd }, (err, pm_login_data) => { // fetch auth token
			if (err) return callback(err);

			settings.googlepm.masterToken = pm_login_data.masterToken;
			getById("LoggedBtn_googlepm").innerHTML = settings.googlepm.user;
			callback();

		});

	}

	/**
	* Like a song
	*
	* @param trackId {string} The track's id (It uses g.playing instead though?)
	*/

	static like (trackId) {
		pm.getAllTracks((err, library) => {

			for (i of library.data.items)
				if (i.id == g.playing.id) {
					var song = i;
					break;
				}

			if (typeof song == "undefined") {
				pm.getAllAccessTrack(g.playing.id, (err, track) => {
					track['rating'] = "5";
					pm.changeTrackMetadata(track, (err, result) => {
						if (err) new Notification('Error liking track', {
							'body': err,
							'tag': 'Harmony-Error',
							'origin': 'Harmony'
						});
					});
				});
			} else {
				song['rating'] = "5";
				pm.changeTrackMetadata(song, (err, result) => {
					if (err) new Notification('Error liking track', {
						'body': err,
						'tag': 'Harmony-Error',
						'origin': 'Harmony'
					});
				});
			}

		});
	}

	/**
	* Unlike a song
	*
	* @param trackId {string} The track's id (It uses g.playing instead though?)
	*/

	static unlike (trackId) {
		pm.getAllTracks((err, library) => {
			for (i of library.data.items)
				if (i.id == trackId) {
					var song = i;
					break;
				}

			if (typeof song == "undefined") {
				pm.getAllAccessTrack(trackId, (err, track) => {
					track['rating'] = "1";
					pm.changeTrackMetadata(track, (err, result) => {
						if (err) new Notification('Error liking track', {
							'body': err,
							'tag': 'Harmony-Error',
							'origin': 'Harmony'
						});
					});
				});
			} else {
				song['rating'] = "1";
				pm.changeTrackMetadata(song, (err, result) => {
					if (err) new Notification('Error liking track', {
						'body': err,
						'tag': 'Harmony-Error',
						'origin': 'Harmony'
					});
				});
			}

		});
	}

	/**
	* Gets a track's streamable URL
	*
	* @param track {Object} The track object
	* @param callback {Function} The callback function
	*/

	static getStreamUrl (track, callback) {
		pm.getStreamUrl(track.id, (err, streamUrl) => {

			if (streamUrl == undefined)
				api.getStreamUrlFromName(track.duration, track.artist.name + " " + track.title, (err, streamUrl) => {
					if (err) nextTrack();
					else callback(streamUrl, track.id);
				});

			else callback(streamUrl, track.id);
		});
	}

}


/** Static Properties **/
Googlepm.discover = true;
Googlepm.mymusic = true;
Googlepm.playlists = true;
Googlepm.favsLocation = "googlepm,playlists,favs";
Googlepm.scrobbling = true;
Googlepm.color = "#ef6c00";
Googlepm.settings = {
	user: '',
	active: false
};

Googlepm.loginBtnHtml = `

    <a id='LoggedBtn_googlepm' class='button login googlepm hide' onclick="logout('googlepm')"></a>

    <a id='Btn_googlepm' class='button login googlepm hide' onclick="removeClass('pm_form', 'hide')" ><span>Listen with <b>Play Music</b></span>
      <br>
      <div id='pm_form' class='hide'>
        <div class='form-group'>
          <input id='googlepmUser' type='text' class='form-control' placeholder='Email'>
          <br>
          <input id='googlepmPasswd' type='password' class='form-control' placeholder='Password'>
          <br>
          <button onclick="login('googlepm')" class='btn btn-primary'>Save</button>
		</div>
		<br>
		<span class='link' onclick="require('electron').shell.openExternal('https://github.com/vincelwt/harmony#google-play-music-2-factors-auth')">Using 2-steps authentication ?</span>
      </div>
    </a>
    <span id='error_googlepm' class='error hide'>Error, please check your credentials</span>
`;

Googlepm.loginBtnCss = `
	.googlepm {
	  background-color: #ef6c00;
	  background-image:url('data:image/png;base64,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');
	}

	.googlepm #pm_form {
		margin-left:-40px;
		width: 220px;
		height: 200px;
	}

	.googlepm .link {
		color: #192e4a;
		text-decoration: underline;
		font-size: 11px;
		top: -90px;
		cursor: pointer;
    	position: relative;
	}
`;

Googlepm.contextmenuItems = [

	{
		title: 'Search artist',
		fn: () => { Googlepm.viewArtist(trackList[index]) }
	},

	{
		title: 'Search album',
		fn: () => { Googlepm.viewAlbum(trackList[index]) }
	},

	{
		title: 'Start station',
		fn: () => { Googlepm.createStation(trackList[index]) }
	}

];

module.exports = Googlepm;