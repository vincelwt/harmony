////////////////////////////////
////////////////////////////////
////////////////////////////////
////////////////////////////////
var spotify = exports;

spotify.discover = true;
spotify.mymusic = true;
spotify.playlists = true;

spotify.favsLocation = "spotify,mymusic,favs";

spotify.scrobbling = true;
spotify.color = "#75C044";

spotify.settings = {
	active: false
};

spotify.loginBtnHtml = `

    <a id='Btn_spotify' class='button login spotify hide' onclick="login('spotify')">Listen with <b>Spotify</b></a>
    <a id='LoggedBtn_spotify' class='button login spotify hide' onclick="logout('spotify')">Disconnect</a>
    <span id='error_spotify' class='error hide'>Error, please try to login again</span>

`;

spotify.loginBtnCss = `
	.spotify {
	  background-color: #75C044;
	  background-image: url(data:image/png;base64,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);
	}
`;

spotify.fetchData = function() {

	return new Promise(function(resolve, reject) {

		if (!settings.spotify.active) return resolve();

		if (!settings.spotify.refresh_token) {
			settings.spotify.error = true;
			return reject([null, true]);
		}

		api.init('spotify', client_ids.spotify.client_id, client_ids.spotify.client_secret);

		api.refreshToken('spotify', settings.spotify.refresh_token, function(error, res) {
			if (error) {
				settings.spotify.error = true;
				return reject([error, true]);
			}

			spotify_access_token = res.access_token;

			data.spotify = {};
			data.spotify.discover = [];
			data.spotify.mymusic = [];
			data.spotify.playlists = [];

			data.spotify.mymusic.push({
				title: 'Spotify',
				artwork: '',
				icon: 'spotify',
				id: 'favs',
				tracks: []
			});

			var addTospotifyPlaylistFavs = function(url) {
				api.get('spotify', url, spotify_access_token, {
					limit: 50
				}, function(err, result) {
					if (err) return reject([err]);

					for (i of result.items)
						data.spotify.mymusic[0].tracks.push(spotify.convertTrack(i.track));

					if (result.next)
						addTospotifyPlaylistFavs(result.next.split('.com')[1]);

				});
			}

			addTospotifyPlaylistFavs('/v1/me/tracks');
			updateLayout();

			api.get('spotify', '/v1/me/playlists', spotify_access_token, { limit: 50 }, function(err, result) {

				if (err) return reject([err]);

				for (i of result.items) {

					!function outer(i) {

						api.get('spotify', i.tracks.href.split('.com')[1], spotify_access_token, { limit: 100 }, function(err, result) {
							if (err) return console.log(err);

							var tempTracks = [];
							var isWeeklyDiscover = (i.href.indexOf("/spotifydiscover/") > -1);

							if (result)
							for (t of result.items)
								tempTracks.push(spotify.convertTrack(t.track));

							if (result.next)
								api.get('spotify', result.next.split('.com')[1], spotify_access_token, { limit: 100 }, function(err, result) {
									if (err) return console.log(err);
									
									for (t of result.items)
										tempTracks.push(spotify.convertTrack(t.track));

								});

							if (isWeeklyDiscover)
								data.spotify.discover.push({
									title: i.name,
									id: i.id,
									icon: 'compass',
									artwork: i.images[0].url,
									tracks: tempTracks
								});
							else
								data.spotify.playlists.push({
									title: i.name,
									id: i.id,
									artwork: (i.images[0] ? i.images[0].url : 'file://' + __dirname + '/img/blank_artwork.png'),
									tracks: tempTracks
								});

							renderPlaylists();

						});

					}(i);
				}

				resolve();

			});

		})
	});


}

spotify.login = function(callback) {

	api.oauthLogin('spotify', function(code) {

		api.init('spotify', client_ids.spotify.client_id, client_ids.spotify.client_secret);

		api.auth('spotify', code, function(error, data) {

			if (error || data.error) return callback(error + " + " + data.error);

			settings.spotify.refresh_token = data.refresh_token;
			callback();

		});

	});

}

spotify.like = function(trackId) {
	api.put('spotify', '/v1/me/tracks?ids=' + g.playing.id, spotify_access_token, {}, function(err, result) {
		if (err) new Notification('Error liking track', {
			'body': err,
			'tag': 'Harmony-Error',
			'origin': 'Harmony'
		});
	});
}

spotify.unlike = function(trackId) {
	api.delete('spotify', '/v1/me/tracks?ids=' + g.playing.id, spotify_access_token, {}, function(err, result) {
		if (err) new Notification('Error liking track', {
			'body': err,
			'tag': 'Harmony-Error',
			'origin': 'Harmony'
		});
	});
}

spotify.getStreamUrl = function(track, callback) {
	api.getStreamUrlFromName(track.duration, track.artist.name + " " + track.title, function(err, streamUrl) {
		if (err)
			nextTrack();
		else
			callback(streamUrl, track.id);
	});
}

spotify.contextmenuItems = [

	{
		title: 'View artist',
		fn: function() {

			spotify.viewArtist(trackList[index]);

		}
	},

	{
		title: 'View album',
		fn: function() {

			spotify.viewAlbum(trackList[index]);

		}
	}

];

spotify.viewArtist = function(track) {
	listView();

	api.get('spotify', '/v1/artists/' + track.artist.id + '/top-tracks?country=FR', spotify_access_token, {}, function(err, result) {
		if (err) return console.error(err);

		var tracks = [];

		for (i of result.tracks)
			tracks.push(spotify.convertTrack(i));

		createTrackList(tracks);
	});
}


spotify.viewAlbum = function(track) {
	listView();

	api.get('spotify', '/v1/albums/' + track.album.id + '/tracks', spotify_access_token, { limit: 50 }, function(err, result) {
		if (err) return console.error(err);

		var tracks = [];

		for (i of result.items)
			tracks.push(spotify.convertTrack(i));

		createTrackList(tracks);
	});
}

spotify.convertTrack = function(rawTrack) {

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

}