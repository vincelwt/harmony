function testInternet() {
	console.log("Testing internet...");

	return new Promise(function(resolve, reject) {
	var api_creds_url = "https://dl.dropboxusercontent.com/u/39260904/harmony.json";

	var xhr = new XMLHttpRequest();

	xhr.open("GET", api_creds_url, true);

	xhr.onload = function (e) {
		if (xhr.readyState === 4)
			if (xhr.status === 200) {
				client_ids = JSON.parse(xhr.responseText);
				return resolve();
			} else {
				console.log(xhr.statusText);
				return reject([xhr.statusText]);
			}
	};

	xhr.onerror = function (e) {
		console.error(xhr.statusText);
		return reject([xhr.statusText]);
	};

	xhr.send(null);

	});

}

function fetchLastfm() { 
	if (settings.lastfm.active)
		api.init('lastfm', client_ids.lastfm.client_id, client_ids.lastfm.client_secret);
}

function fetchLocal() {

	return new Promise(function(resolve, reject) {

		if (!settings.local.active) return resolve();

		if (conf.get("localPlaylistFavs") == undefined) {
		  data.localPlaylistFavs = [];
		  conf.set("localPlaylistFavs", data.localPlaylistFavs);
		} else {
		  data.localPlaylistFavs = conf.get("localPlaylistFavs");
		} 

		data.localAll = [];

		for (i of settings.local.paths) // Useless 'for' for now, will be useful when multiple folders possible

		  recursive(i, function (err, files) {

		  	var final_track = files[files.length - 1];

		  	files.forEach(function (filename) {
		  		if (filename.substr(filename.length - 3) != "mp3") return;
		  		
		  		var fileStream = fs.createReadStream(filename);
				var parser = new mm(fileStream, { duration: true }, function (err, metadata) {
					fileStream.destroy();
					var id = new Buffer(filename).toString('base64');
					var artwork = null;

					if (metadata.picture.length > 0) {
						var picture = metadata.picture[0];
						var artwork = URL.createObjectURL(new Blob([picture.data], {'type': 'image/' + picture.format}));
					} 

		            if (err || metadata.title == "" || metadata.title == undefined) {
		              console.log(err);
		              
		              if (process.platform=="win32") var title = filename.split("\\").pop();
		              else var title = filename.split('/').pop();

		              data.localAll.push({'service': 'local', 'source': 'localAll', 'title': title, 'artist': {'name': '', 'id': ''}, 'album': {'name': '', 'id': ''}, 'id': id, 'duration': metadata.duration*1000, 'artwork': artwork, 'stream_url': 'file://'+filename});
		            } else {
		              data.localAll.push({'service': 'local', 'source': 'localAll', 'title': metadata.title, 'artist': {'name': metadata.artist[0], 'id': metadata.artist[0] }, 'album': {'name': metadata.album, 'id': metadata.album}, 'id': id, 'duration': metadata.duration*1000, 'artwork': artwork, 'stream_url': 'file://'+filename});
		            }

		            if (filename == final_track) updateTrackList();
		            
				});

			});

		    resolve();
		  });
	});

}

function fetchSoundcloud() {

	return new Promise(function(resolve, reject) {

		if (!settings.soundcloud.active) return resolve();

		if (!settings.soundcloud.refresh_token) { 
			settings.soundcloud.error = true;
			return reject([null,true]);
		}

		api.init('soundcloud', client_ids.soundcloud.client_id, client_ids.soundcloud.client_secret);
		api.refreshToken('soundcloud', settings.soundcloud.refresh_token, function(error, creds){
			if (error) {
				settings.soundcloud.error = true;
				return reject([error, true]);
			}

			settings.soundcloud.refresh_token = creds.refresh_token;
			soundcloud_access_token = creds.access_token;
			conf.set('settings', settings);

			api.get('soundcloud', '/me/activities', soundcloud_access_token, {limit : 200}, function(err, result) {
			  if (err) return reject([err]); 

			  data.soundcloudStream = [];

			  for (i of result.collection)
			    if (i.origin !== null && typeof i.origin.stream_url != "undefined" && i.origin !== null && (i.type == "track" || i.type == "track-sharing" || i.type == "track-repost"))
			      data.soundcloudStream.push({'service': 'soundcloud', 'source': 'soundcloudStream', 'title': removeFreeDL(i.origin.title), 'artist': {'id': i.origin.user.id, 'name': i.origin.user.username}, 'id': i.origin.id, 'stream_url': i.origin.stream_url, 'duration': i.origin.duration, 'artwork': i.origin.artwork_url});
			  
			  updateTrackList();

			  api.get('soundcloud', '/me/favorites', soundcloud_access_token, {limit : 200}, function(err, result) {
			  	
			    if (err) return reject([err]); 

			    data.soundcloudPlaylistFavs = [];

			    for (i of result)
			      if (typeof i.stream_url != "undefined")
			        data.soundcloudPlaylistFavs.push({'service': 'soundcloud', 'source': 'soundcloudPlaylistFavs','title': removeFreeDL(i.title), 'artist': {'id': i.user.id, 'name': i.user.username}, 'album': {'id': '', 'name': ''}, 'id': i.id, 'stream_url': i.stream_url, 'duration': i.duration, 'artwork': i.artwork_url});

			    updateTrackList();

			    api.get('soundcloud', '/me/playlists', soundcloud_access_token, {limit : 200}, function(err, result) {

			      data.soundcloudPlaylists = [];
			      if (err) return reject([err]); 

			      for (i of result) {

			      	if (i.artwork_url)
			     		data.soundcloudPlaylists.push({title: i.title, id: i.id, image: i.artwork_url});
			      	else
			        	data.soundcloudPlaylists.push({title: i.title, id: i.id, image: i.tracks[0].artwork_url});
			        

			        data['soundcloudPlaylist'+i.id] = [];

			        for (t of i.tracks)
			          if (typeof t.stream_url != "undefined")
			            data['soundcloudPlaylist'+i.id].push({'service': 'soundcloud', 'source': 'soundcloudPlaylist'+i.id,'title': removeFreeDL(t.title), 'artist': {'id': t.user.id, 'name': t.user.username}, 'album': {'id': '', 'name': ''}, 'id': t.id, 'stream_url': t.stream_url, 'duration': t.duration, 'artwork': t.artwork_url});

			      }

			      renderPlaylists();

			      updateTrackList();
			      
			      resolve();

			    }); 

			  });
			});
	      
	    })
	});

}

function fetchGooglepm() {

	return new Promise(function(resolve, reject) {

		if (!settings.googlepm.active) return resolve();
		pm.init({email: settings.googlepm.user, password: settings.googlepm.passwd}, function(err, res) {
			if (err) {
				settings.googlepm.error = true;
				return reject([err, true]);
			}

			pm.getAllTracks(function(err, library) {
			  if (err) return reject([err]);

			  data.googlepmAll = [];
			  data.googlepmPlaylistFavs = [];

			  for (i of library.data.items) { 
			    if (i.albumArtRef === undefined) { i.albumArtRef = [{'url': ""}] };

			    data.googlepmAll.push({'service': 'googlepm', 'source': 'googlepmAll', 'title': i.title, 'artist': {'name': i.artist, 'id': (i.artistId ? i.artistId[0] : '')}, 'album':{'name': i.album, 'id': i.albumId}, 'id': i.id, 'duration': i.durationMillis, 'artwork': i.albumArtRef[0].url});

			    if (i.rating == 5)
			      data.googlepmPlaylistFavs.push({'service': 'googlepm', 'source': 'googlepmPlaylistFavs', 'title': i.title, 'artist': {'name': i.artist, 'id': (i.artistId ? i.artistId[0] : '')}, 'album':{'name': i.album, 'id': i.albumId}, 'id': i.id, 'duration': i.durationMillis, 'artwork': i.albumArtRef[0].url});
			  }

			  updateTrackList();

			  pm.getPlayLists(function(err, playlists_data) {
			    data.googlepmPlaylists = [];
			    pm.getPlayListEntries(function(err, playlists_entries_data) {

			      for (i of playlists_data.data.items) {
			      	console.log(playlists_entries_data.data.items[0]);
			        data.googlepmPlaylists.push({title: i.name, id: i.id });
			        data['googlepmPlaylist'+i.id] = [];
			      }
			      
			      for (t of playlists_entries_data.data.items) {

			        var track_object = getTrackObject(data.googlepmAll, t.trackId);
			        if (track_object) {
			          track_object.source = 'googlepmPlaylist'+t.playlistId;
			          data['googlepmPlaylist'+t.playlistId].push(track_object);
			    	}
			      }

			      for (p of data.googlepmPlaylists) {
			      	p.image = data['googlepmPlaylist'+p.id][0].artwork; // Set the first track's artwork as playlist's artwork
			      }

			      renderPlaylists();
			      updateTrackList();
			      
			      resolve();

			    });
			  });
			});
		});
	});

}

function fetchSpotify() {

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
					  data.spotifyPlaylistFavs.push({'service': 'spotify', 'source': 'spotifyPlaylistFavs', 'title': i.track.name, 'album': {'name': i.track.album.name, 'id': i.track.album.id}, 'artist': {'name': i.track.artists[0].name, 'id': i.track.artists[0].id}, 'id': i.track.id, 'duration': i.track.duration_ms, 'artwork': i.track.album.images[0].url});

					if (result.next)
					  addTospotifyPlaylistFavs(result.next.split('.com')[1]);

				});
			}

			addTospotifyPlaylistFavs('/v1/me/tracks');
			updateTrackList();

			api.get('spotify', '/v1/me/playlists', spotify_access_token, {limit: 50}, function(err, result) {

			  data.spotifyPlaylists = [];
			    if (err) return reject([err]); 

			    for (i of result.items) {

			      if (i.images[0])
			      	data.spotifyPlaylists.push({title: i.name, id: i.id, image: i.images[0].url});
			      else 
			      	data.spotifyPlaylists.push({title: i.name, id: i.id, image: 'file://'+__dirname+'/img/blank_artwork.png'});

			      data['spotifyPlaylist'+i.id] = [];

			      !function outer(i){
			        api.get('spotify', i.tracks.href.split('.com')[1], spotify_access_token, {limit: 100}, function(err, result) {
			          for (t of result.items)
			            data['spotifyPlaylist'+i.id].push({'service': 'spotify', 'source': 'spotifyPlaylist'+i.id, 'title': t.track.name, 'album': {'name': t.track.album.name, 'id': t.track.album.id}, 'artist': {'name': t.track.artists[0].name, 'id': t.track.artists[0].id}, 'id': t.track.id, 'duration': t.track.duration_ms, 'artwork': t.track.album.images[0].url});
			          updateTrackList();
			        });
			      }(i);
			      
			    }

			    renderPlaylists();

			  	resolve();

			 });

			
		})
	});

}


function viewArtist(track) {

    switch (track.service) {

      case "soundcloud":
        api.get('soundcloud', '/users/'+track.artist.id+'/tracks', soundcloud_access_token, {limit : 200}, function(err, result) {
          if (err) return console.error(err); 

          var tracks = [];

          for (i of result)
            if (typeof i.stream_url != "undefined")
              tracks.push({'service': 'soundcloud', 'source': 'search'+track.artist.id, 'title': removeFreeDL(i.title), 'artist': {'id': i.user.id, 'name': i.user.username}, 'album': {'id': '', 'name': ''}, 'id': i.id, 'stream_url': i.stream_url, 'duration': i.duration, 'artwork': i.artwork_url});

          createTrackList(tracks);

        });

        break;

      case "spotify":
        api.get('spotify', '/v1/artists/'+track.artist.id+'/top-tracks?country=FR', spotify_access_token, {}, function(err, result) {
          if (err) return console.error(err);

          var tracks = [];

          for (i of result.tracks)
            tracks.push({'service': 'spotify', 'source': 'search'+track.artist.id, 'title': i.name, 'album': {'name': i.album.name, 'id': i.album.id}, 'artist': {'name': i.artists[0].name, 'id': i.artists[0].id}, 'id': i.id, 'duration': i.duration_ms, 'artwork': i.album.images[0].url});

          createTrackList(tracks);
        });

        break;

      case "googlepm":

        document.getElementById("search").value = track.artist.name;
        changeActiveTab("googlepmAll", true);
        break;

      case "local":

        document.getElementById("search").value = track.artist.name;
        changeActiveTab("localAll", true);
        break;

    }
}

function viewAlbum(track) {

    switch (track.service) {

      case "spotify":
        api.get('spotify', '/v1/albums/'+track.album.id+'/tracks', spotify_access_token, {limit: 50}, function(err, result) {
          if (err) return console.error(err);

          var tracks = [];

          for (i of result.items)
            tracks.push({'service': 'spotify', 'source': 'search'+track.album.id, 'title': i.name, 'album': {'name': track.album.name, 'id': track.album.id}, 'artist': {'name': i.artists[0].name, 'id': i.artists[0].id}, 'id': i.id, 'duration': i.duration_ms, 'artwork': track.artwork});

          createTrackList(tracks);
        });

        break;

      case "googlepm":
        document.getElementById("search").value = track.album.name;
        changeActiveTab("googlepmAll", true);
        break;

      case "local":

        document.getElementById("search").value = track.album.name;
        changeActiveTab("localAll", true);
        break;

    }

}