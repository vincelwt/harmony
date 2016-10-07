////////////////////////////////
////////////////////////////////
////////////////////////////////
////////////////////////////////
var soundcloud = exports;

soundcloud.discover = true;
soundcloud.mymusic = false;
soundcloud.playlists = true;

soundcloud.favsLocation = "soundcloud,playlists,favs";

soundcloud.scrobbling = true;
soundcloud.color = "#EF4500";

soundcloud.settings = {
	active: false
};

soundcloud.loginBtnHtml = `

    <a id='Btn_soundcloud' class='button login soundcloud hide' onclick="login('soundcloud')">Listen with <b>SoundCloud</b></a>
    <a id='LoggedBtn_soundcloud' class='button login soundcloud hide' onclick="logout('soundcloud')">Disconnect</a>
    <span id='error_soundcloud' class='error hide'>Error, please try to login again</span>

`;

soundcloud.loginBtnCss = `
	.soundcloud {
	  background-color: #EF4500;
	  background-image: url(data:image/png;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/n97cEACAAAAIOj/63YEKgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEcBBIUELdBjAbgAAAAASUVORK5CYII=);
	}
`;

soundcloud.fetchData = function() {

	return new Promise(function(resolve, reject) {

		if (!settings.soundcloud.active) return resolve();

		if (!settings.soundcloud.refresh_token) {
			settings.soundcloud.error = true;
			return reject([null, true]);
		}

		api.init('soundcloud', client_ids.soundcloud.client_id, client_ids.soundcloud.client_secret);

		api.refreshToken('soundcloud', settings.soundcloud.refresh_token, function(error, creds) {

			if (error) {
				settings.soundcloud.error = true;
				return reject([error, true]);
			}

			data.soundcloud = {};
			data.soundcloud.discover = [];
			data.soundcloud.playlists = [];

			settings.soundcloud.refresh_token = creds.refresh_token;
			soundcloud_access_token = creds.access_token;
			conf.set('settings', settings);

			api.get('soundcloud', '/me/activities', soundcloud_access_token, { limit: 200 }, function(err, result) {

				if (err) return reject([err]);

				data.soundcloud.discover.push({
					id: 'stream',
					title: 'Feed',
					icon: 'globe',
					artwork: '',
					tracks: []
				});

				for (i of result.collection)
					if (i.origin !== null && typeof i.origin.stream_url != "undefined" && i.origin !== null && (i.type == "track" || i.type == "track-sharing" || i.type == "track-repost"))
						data.soundcloud.discover[0].tracks.push(convertTrack(i.origin));

				api.get('soundcloud', '/me/playlists', soundcloud_access_token, { limit: 200 }, function(err, result) {

					if (err) return reject([err]);

					for (i of result) {
						var temp_tracks = [];

						for (t of i.tracks)
							if (typeof t.stream_url != "undefined")
								temp_tracks.push(convertTrack(t));

						if (i.artwork_url)
							data.soundcloud.playlists.push({
								id: i.id,
								title: i.title,
								artwork: i.artwork_url,
								tracks: temp_tracks
							});
						else
							data.soundcloud.playlists.push({
								id: i.id,
								title: i.title,
								artwork: (typeof i.tracks[0] != "undefined" ? i.tracks[0].artwork_url : ''),
								tracks: temp_tracks
							});

					}

					renderPlaylists();

					updateLayout();

					resolve();

				});


				api.get('soundcloud', '/me/favorites', soundcloud_access_token, { limit: 200 }, function(err, favorites) {

					if (err) return reject([err]);

					data.soundcloud.playlists.unshift({
						id: 'favs',
						title: 'Liked tracks',
						icon: 'soundcloud',
						artwork: '',
						tracks: []
					});

					for (tr of favorites)
						if (typeof tr.stream_url != "undefined")
							data.soundcloud.playlists[0].tracks.push(convertTrack(tr));

					updateLayout();

					renderPlaylists();
				});

			});

		});
	});
}

soundcloud.login = function(callback) {

	api.oauthLogin('soundcloud', function(code) {

		api.init('soundcloud', client_ids.soundcloud.client_id, client_ids.soundcloud.client_secret);
		api.auth('soundcloud', code, function(error, data) {
			if (error || data.error) return callback(error + " + " + data.error);

			settings.soundcloud.refresh_token = data.refresh_token;
			callback();
		});

	});

}

soundcloud.like = function(trackId) {
	api.put('soundcloud', '/me/favorites/' + g.playing.id, soundcloud_access_token, {}, function(err, result) {
		if (err) new Notification('Error liking track', {
			'body': err,
			'tag': 'Harmony-Error',
			'origin': 'Harmony'
		});
	});
}

soundcloud.unlike = function(trackId) {
	api.delete('soundcloud', '/me/favorites/' + g.playing.id, soundcloud_access_token, {}, function(err, result) {
		if (err) new Notification('Error liking track', {
			'body': err,
			'tag': 'Harmony-Error',
			'origin': 'Harmony'
		});
	});
}

soundcloud.getStreamUrl = function(track, callback) {
	callback(track.stream_url + "?client_id=" + client_ids.soundcloud.client_id, track.id);
}

soundcloud.contextmenuItems = [

	{
		title: 'View user',
		fn: function() {

			soundcloud.viewArtist(trackList[index]);

		}
	}

];

soundcloud.viewArtist = function(track) {
	listView();

	api.get('soundcloud', '/users/' + track.artist.id + '/tracks', soundcloud_access_token, {
		limit: 200
	}, function(err, result) {
		if (err) return console.error(err);

		var tracks = [];

		for (i of result)
			if (typeof i.stream_url != "undefined")
				tracks.push(convertTrack(i));

		createTrackList(tracks);

	});
}

var convertTrack = function(rawTrack) {

	return {
		'service': 'soundcloud',
		'title': removeFreeDL(rawTrack.title),
		'artist': {
			'id': rawTrack.user.id,
			'name': rawTrack.user.username
		},
		'album': {
			'id': '',
			'name': ''
		},
		'share_url': rawTrack.permalink_url,
		'id': rawTrack.id,
		'stream_url': rawTrack.stream_url,
		'duration': rawTrack.duration,
		'artwork': rawTrack.artwork_url
	}

}

function removeFreeDL(string) { 
  return string.replace("[Free DL]", "")
              .replace("(Free DL)", "")
              .replace("[Free Download]", "")
              .replace("(Free Download)", "") 
}