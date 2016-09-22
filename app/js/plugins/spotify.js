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

spotify.loginBtnHtml = `

    <a id='btn_spotify' class='button login spotify hide' onclick="login('spotify')">Listen with <b>Spotify</b></a>
    <a id='btn_spotify2' class='button login spotify hide' onclick="logout('spotify')">Disconnect</a>
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

		api.refreshToken('spotify', settings.spotify.refresh_token, function(error, res){
			if (error) {
				settings.spotify.error = true;
				return reject([error, true]);
			}

			spotify_access_token = res.access_token;

			data.spotify = {};
			data.spotify.discover = [];
			data.spotify.mymusic = [];
			data.spotify.playlists = [];

			data.spotify.mymusic.push({title: 'Spotify', artwork: '', icon: 'spotify', id: 'favs', tracks: []});

			var addTospotifyPlaylistFavs = function(url) {
				api.get('spotify', url, spotify_access_token, {limit: 50}, function(err, result) {
					if (err) return reject([err]);

					for (i of result.items)
					  data.spotify.mymusic[0].tracks.push({'service': 'spotify', 'source': 'spotify,mymusic,favs', 'title': i.track.name, 'share_url': i.track.external_urls.spotify, 'album': {'name': i.track.album.name, 'id': i.track.album.id}, 'artist': {'name': i.track.artists[0].name, 'id': i.track.artists[0].id}, 'id': i.track.id, 'duration': i.track.duration_ms, 'artwork': i.track.album.images[0].url});

					if (result.next)
					  addTospotifyPlaylistFavs(result.next.split('.com')[1]);

				});
			}

			addTospotifyPlaylistFavs('/v1/me/tracks');
			updateLayout();

			api.get('spotify', '/v1/me/playlists', spotify_access_token, {limit: 50}, function(err, result) {

			    if (err) return reject([err]);

			    for (i of result.items) {

			      !function outer(i){

			        api.get('spotify', i.tracks.href.split('.com')[1], spotify_access_token, {limit: 100}, function(err, result) {

						var tempTracks = [];
						var isWeeklyDiscover = (i.href.indexOf("/spotifydiscover/") > -1);

						for (t of result.items){
							

							tempTracks.push({'service': 'spotify', 'source': (isWeeklyDiscover ? 'spotify,discover,' : 'spotify,playlists,')+i.id, 'title': t.track.name, 'share_url': t.track.external_urls.spotify, 'album': {'name': t.track.album.name, 'id': t.track.album.id}, 'artist': {'name': t.track.artists[0].name, 'id': t.track.artists[0].id}, 'id': t.track.id, 'duration': t.track.duration_ms, 'artwork': t.track.album.images[0].url});
						}

						if (result.next)
							api.get('spotify', result.next.split('.com')[1], spotify_access_token, {limit: 100}, function(err, result) {
								
								for (t of result.items)
									tempTracks.push({'service': 'spotify', 'source': (isWeeklyDiscover ? 'spotify,discover,' : 'spotify,playlists,')+i.id, 'title': t.track.name, 'share_url': t.track.external_urls.spotify, 'album': {'name': t.track.album.name, 'id': t.track.album.id}, 'artist': {'name': t.track.artists[0].name, 'id': t.track.artists[0].id}, 'id': t.track.id, 'duration': t.track.duration_ms, 'artwork': t.track.album.images[0].url});

							});

						if (isWeeklyDiscover)
							data.spotify.discover.push({title: i.name, id: i.id, icon: 'compass', artwork: i.images[0].url, tracks: tempTracks});
						else if (i.images[0])
							data.spotify.playlists.push({title: i.name, id: i.id, artwork: i.images[0].url, tracks: tempTracks});
						else
							data.spotify.playlists.push({title: i.name, id: i.id, artwork: 'file://'+__dirname+'/img/blank_artwork.png', tracks: tempTracks});

						renderPlaylists();


			        });


				  }(i);

				}


			  	resolve();

			 });

		})
	});


}

spotify.login = function (callback) {

	api.oauthLogin('spotify', function (code) {

	    api.init('spotify', client_ids.spotify.client_id, client_ids.spotify.client_secret);

	    api.auth('spotify', code, function (error, data) {

			if (error || data.error) return callback(error +" + "+data.error);

			settings.spotify.refresh_token = data.refresh_token;
			callback();

	    });

	});

}

spotify.like = function (trackId) {
        api.put('spotify', '/v1/me/tracks?ids='+g.playing.id, spotify_access_token, {}, function(err, result) {
          if (err) new Notification('Error liking track', {'body': err, 'tag': 'Harmony-Error', 'origin': 'Harmony' });
        });
}

spotify.unlike = function (trackId) {
    api.delete('spotify', '/v1/me/tracks?ids='+g.playing.id, spotify_access_token, {}, function(err, result) {
      if (err) new Notification('Error liking track', {'body': err, 'tag': 'Harmony-Error', 'origin': 'Harmony' });
    });
}

spotify.getStreamUrl = function (track, callback) {
	api.getStreamUrlFromName(track.duration, track.artist.name+" "+track.title, function(err, streamUrl) {
		if (err)
		  nextTrack();
		else
		  callback(streamUrl, track.id);
	});
}

spotify.contextmenuItems = [

  { title: 'View artist', fn: function(){

    spotify.viewArtist(trackList[index]);

  } },

  { title: 'View album', fn: function(){

    spotify.viewAlbum(trackList[index]);

  } }

];

spotify.viewArtist = function (track) {
	listView();

    api.get('spotify', '/v1/artists/'+track.artist.id+'/top-tracks?country=FR', spotify_access_token, {}, function(err, result) {
      if (err) return console.error(err);

      var tracks = [];

      for (i of result.tracks)
        tracks.push({'service': 'spotify', 'source': 'search'+track.artist.id, 'title': i.name, 'album': {'name': i.album.name, 'id': i.album.id}, 'artist': {'name': i.artists[0].name, 'share_url': i.external_urls.spotify, 'id': i.artists[0].id}, 'id': i.id, 'duration': i.duration_ms, 'artwork': i.album.images[0].url});

      createTrackList(tracks);
    });
}


spotify.viewAlbum = function (track) {
	listView();

    api.get('spotify', '/v1/albums/'+track.album.id+'/tracks', spotify_access_token, {limit: 50}, function(err, result) {
      if (err) return console.error(err);

      var tracks = [];

      for (i of result.items)
        tracks.push({'service': 'spotify', 'source': 'search'+track.album.id, 'title': i.name, 'album': {'name': track.album.name, 'id': track.album.id}, 'artist': {'name': i.artists[0].name, 'id': i.artists[0].id}, 'share_url': i.external_urls.spotify, 'id': i.id, 'duration': i.duration_ms, 'artwork': track.artwork});

      createTrackList(tracks);
    });
}
