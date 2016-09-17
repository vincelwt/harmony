var https = require('https'),
  md5 = require('md5'),
  request = require('request'),
  qs = require('querystring');

////////////////////////////////
////////////////////////////////
////////////////////////////////
////////////////////////////////

var soundcloud = exports;

soundcloud.discover = false;
soundcloud.mymusic = true;
soundcloud.playlists = true;
soundcloud.scrobbling = true;
soundcloud.color = "#ef6c00";

soundcloud.loginBtnHtml = `

        <a id='btn_soundcloud' class='button login soundcloud hide' onclick="login('soundcloud')">Listen with <b>SoundCloud</b></a>
        <a id='btn_soundcloud2' class='button login soundcloud hide' onclick="logout('soundcloud')">Disconnect</a>
        <span id='error_soundcloud' class='error hide'>Error, please try to login again</span>

`;

soundcloud.fetchData = function() {

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
			      data.soundcloudStream.push({'service': 'soundcloud', 'source': 'soundcloudStream', 'share_url': i.origin.permalink_url, 'title': removeFreeDL(i.origin.title), 'artist': {'id': i.origin.user.id, 'name': i.origin.user.username}, 'album': {'id': '', 'name': ''}, 'id': i.origin.id, 'stream_url': i.origin.stream_url, 'duration': i.origin.duration, 'artwork': i.origin.artwork_url});
			  
			  updateLayout();

			  api.get('soundcloud', '/me/favorites', soundcloud_access_token, {limit : 200}, function(err, result) {
			  	
			    if (err) return reject([err]); 

			    data.soundcloudPlaylistFavs = [];

			    for (i of result)
			      if (typeof i.stream_url != "undefined")
			        data.soundcloudPlaylistFavs.push({'service': 'soundcloud', 'source': 'soundcloudPlaylistFavs','title': removeFreeDL(i.title), 'artist': {'id': i.user.id, 'name': i.user.username}, 'album': {'id': '', 'name': ''}, 'share_url': i.permalink_url, 'id': i.id, 'stream_url': i.stream_url, 'duration': i.duration, 'artwork': i.artwork_url});

			    updateLayout();

			    api.get('soundcloud', '/me/playlists', soundcloud_access_token, {limit : 200}, function(err, result) {

			      data.soundcloudPlaylists = [];
			      if (err) return reject([err]); 

			      for (i of result) {

			      	if (i.artwork_url)
			     		data.soundcloudPlaylists.push({title: i.title, id: i.id, image: i.artwork_url});
			      	else if (typeof i.tracks[0] != "undefined")
			        	data.soundcloudPlaylists.push({title: i.title, id: i.id, image: i.tracks[0].artwork_url});
			        else 
			        	data.soundcloudPlaylists.push({title: i.title, id: i.id, image: ''});


			        data['soundcloudPlaylist'+i.id] = [];

			        for (t of i.tracks)
			          if (typeof t.stream_url != "undefined")
			            data['soundcloudPlaylist'+i.id].push({'service': 'soundcloud', 'source': 'soundcloudPlaylist'+i.id,'title': removeFreeDL(t.title), 'share_url': t.permalink_url, 'artist': {'id': t.user.id, 'name': t.user.username}, 'album': {'id': '', 'name': ''}, 'id': t.id, 'stream_url': t.stream_url, 'duration': t.duration, 'artwork': t.artwork_url});

			      }

			      renderPlaylists();

			      updateLayout();
			      
			      resolve();

			    }); 

			  });
			});
	      
	    })
	});
}

soundcloud.login = function (callback) {

	api.oauthLogin('soundcloud', function (code) {

	    api.init('soundcloud', client_ids.soundcloud.client_id, client_ids.soundcloud.client_secret);
	    api.auth('soundcloud', code, function (error, data) {
			if (error || data.error) return callback(error +" + "+data.error);

			settings.soundcloud.refresh_token = data.refresh_token;
			callback();
	    });

	 });

}

soundcloud.like = function (trackId) {
    api.put('spotify', '/v1/me/tracks?ids='+g.playing.id, spotify_access_token, {}, function(err, result) {
      if (err) notifier.notify({ 'title': 'Error liking track', 'message': err });
    });
}

soundcloud.unlike = function (trackId) {
    api.delete('soundcloud', '/me/favorites/'+g.playing.id, soundcloud_access_token, {}, function(err, result) {
      if (err) notifier.notify({ 'title': 'Error unliking track', 'message': err });
    });
}

soundcloud.getStreamUrl = function (track, callback) {
	callback(track.stream_url+"?client_id="+client_ids.soundcloud.client_id, track.id);
}

soundcloud.contextmenuItems = [

  { title: 'View user', fn: function() {

  	console.log(index);
  	console.log(trackList[index]);
    soundcloud.viewArtist(trackList[index]);

  } }

];

soundcloud.viewArtist = function (track) {
	listView();

    api.get('soundcloud', '/users/'+track.artist.id+'/tracks', soundcloud_access_token, {limit : 200}, function(err, result) {
      if (err) return console.error(err); 

      var tracks = [];

      for (i of result)
        if (typeof i.stream_url != "undefined")
          tracks.push({'service': 'soundcloud', 'source': 'search'+track.artist.id, 'title': removeFreeDL(i.title), 'artist': {'id': i.user.id, 'name': i.user.username}, 'album': {'id': '', 'name': ''}, 'share_url': i.permalink_url, 'id': i.id, 'stream_url': i.stream_url, 'duration': i.duration, 'artwork': i.artwork_url});

      createTrackList(tracks);

    });
}