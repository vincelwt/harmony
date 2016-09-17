var https = require('https'),
  md5 = require('md5'),
  request = require('request'),
  qs = require('querystring');

////////////////////////////////
////////////////////////////////
////////////////////////////////
////////////////////////////////


var spotify = exports;

spotify.discover = false;
spotify.mymusic = true;
spotify.playlists = true;
spotify.scrobbling = true;
spotify.color = "#ef6c00";

spotify.loginBtnHtml = `

        <a id='btn_spotify' class='button login spotify hide' onclick="login('spotify')">Listen with <b>Spotify</b></a>
        <a id='btn_spotify2' class='button login spotify hide' onclick="logout('spotify')">Disconnect</a>
        <span id='error_spotify' class='error hide'>Error, please try to login again</span>

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

			data.spotifyPlaylistFavs = [];

			var addTospotifyPlaylistFavs = function(url) {
				api.get('spotify', url, spotify_access_token, {limit: 50}, function(err, result) {
					if (err) return reject([err]); 

					for (i of result.items)
					  data.spotifyPlaylistFavs.push({'service': 'spotify', 'source': 'spotifyPlaylistFavs', 'title': i.track.name, 'share_url': i.track.external_urls.spotify, 'album': {'name': i.track.album.name, 'id': i.track.album.id}, 'artist': {'name': i.track.artists[0].name, 'id': i.track.artists[0].id}, 'id': i.track.id, 'duration': i.track.duration_ms, 'artwork': i.track.album.images[0].url});

					if (result.next)
					  addTospotifyPlaylistFavs(result.next.split('.com')[1]);

				});
			}

			addTospotifyPlaylistFavs('/v1/me/tracks');
			updateLayout();

			api.get('spotify', '/v1/me/playlists', spotify_access_token, {limit: 50}, function(err, result) {

			  data.spotifyPlaylists = [];
			    if (err) return reject([err]); 

			    for (i of result.items) {

			      if (i.href.indexOf("/spotifydiscover/") > -1) {
			      	removeClass("spotifyPlaylistDiscover", "hide");
			      	i.id = "Discover";
			      }

			      if (i.images[0])
			      	data.spotifyPlaylists.push({title: i.name, id: i.id, image: i.images[0].url});
			      else 
			      	data.spotifyPlaylists.push({title: i.name, id: i.id, image: 'file://'+__dirname+'/img/blank_artwork.png'});

			      data['spotifyPlaylist'+i.id] = [];

			      !function outer(i){
			        api.get('spotify', i.tracks.href.split('.com')[1], spotify_access_token, {limit: 100}, function(err, result) {
			          for (t of result.items)
			            data['spotifyPlaylist'+i.id].push({'service': 'spotify', 'source': 'spotifyPlaylist'+i.id, 'title': t.track.name, 'share_url': t.track.external_urls.spotify, 'album': {'name': t.track.album.name, 'id': t.track.album.id}, 'artist': {'name': t.track.artists[0].name, 'id': t.track.artists[0].id}, 'id': t.track.id, 'duration': t.track.duration_ms, 'artwork': t.track.album.images[0].url});
			          updateLayout();
			        });
			      }(i);
			      
			    }

			    renderPlaylists();

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
          if (err) notifier.notify({ 'title': 'Error liking track', 'message': err });
        });
}

spotify.unlike = function (trackId) {
    api.delete('spotify', '/v1/me/tracks?ids='+g.playing.id, spotify_access_token, {}, function(err, result) {
      if (err) notifier.notify({ 'title': 'Error unliking track', 'message': err });
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

    googlepm.viewArtist(trackList[index]);

  } },

  { title: 'View album', fn: function(){

    googlepm.viewAlbum(trackList[index]);

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