var PlayMusic = require('playmusic'),
  	pm = new PlayMusic();

////////////////////////////////
////////////////////////////////
////////////////////////////////
////////////////////////////////


var googlepm = exports;

googlepm.discover = false;
googlepm.mymusic = true;
googlepm.playlists = true;
googlepm.scrobbling = true;
googlepm.color = "#ef6c00";

googlepm.loginBtnHtml = `

        <a id='btn_googlepm2' class='button login googlepm hide' onclick="logout('googlepm')"></a>
        <a id='btn_googlepm' class='button login googlepm hide'><span>Listen with <b>Play Music</b></span>
          <br>
          <div style='margin-left:-40px;width: 220px'>
            <div class='form-group'>
              <input id='googlepmUser' type='text' class='form-control' placeholder='Email'>
              <br/>
              <input id='googlepmPasswd' type='password' class='form-control' placeholder='Password'>
              <br/>
              <button onclick="login('googlepm')" class='btn btn-primary'>Save</button>
            </div>
          </div>
        </a>
        <span id='error_googlepm' class='error hide'>Error, please check your credentials</span>
`;

googlepm.fetchData = function() {

	return new Promise(function(resolve, reject) {

		if (!settings.googlepm.active) return resolve();
		pm.init({masterToken: settings.googlepm.masterToken}, function(err, res) {
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

			    data.googlepmAll.push({'service': 'googlepm', 'source': 'googlepmAll', 'title': i.title, 'share_url': 'https://www.youtube.com/results?search_query='+encodeURIComponent(i.artist+" "+i.title), 'artist': {'name': i.artist, 'id': (i.artistId ? i.artistId[0] : '')}, 'album':{'name': i.album, 'id': i.albumId}, 'trackNumber': i.trackNumber, 'id': i.id, 'duration': i.durationMillis, 'artwork': i.albumArtRef[0].url});

			    if (i.rating == 5)
			      data.googlepmPlaylistFavs.push({'service': 'googlepm', 'source': 'googlepmPlaylistFavs', 'title': i.title, 'share_url': 'https://www.youtube.com/results?search_query='+encodeURIComponent(i.artist+" "+i.title), 'artist': {'name': i.artist, 'id': (i.artistId ? i.artistId[0] : '')}, 'album':{'name': i.album, 'id': i.albumId}, 'id': i.id, 'storeId': (i.storeId ? i.storeId : undefined), 'duration': i.durationMillis, 'artwork': i.albumArtRef[0].url, 'RatingTimestamp': i.lastRatingChangeTimestamp});
			  }

			  pm.getFavorites(function(err, favorites_data) { // Works only when all-access
			  	var added;
		        var favorites_data = favorites_data.track;

		        for (f of favorites_data) {
		        	for (var z = 0; z < data.googlepmPlaylistFavs.length; z++) {
		        		if (data.googlepmPlaylistFavs[z].storeId == f.id || 
		        			(data.googlepmPlaylistFavs[z].title == f.title && data.googlepmPlaylistFavs[z].artist == f.artist)) { // Already in favs, but this one probably has better metadatas

		        			data.googlepmPlaylistFavs[z] = {'service': 'googlepm', 'source': 'googlepmPlaylistFavs', 'title': f.title, 'share_url': 'https://www.youtube.com/results?search_query='+encodeURIComponent(f.artist+" "+f.title), 'artist': {'name': f.artist, 'id': f.artist}, 'album':{'name': f.album, 'id': f.albumId}, 'id': f.storeId, 'duration': f.durationMillis, 'artwork': f.imageBaseUrl, 'RatingTimestamp': f.lastRatingChangeTimestamp};
		        			added = true;
		        			break;
		        		}
		        		added = false;
		        	}

		        	if (!added)
		        		data.googlepmPlaylistFavs.push({'service': 'googlepm', 'source': 'googlepmPlaylistFavs', 'title': f.title, 'share_url': 'https://www.youtube.com/results?search_query='+encodeURIComponent(f.artist+" "+f.title), 'artist': {'name': f.artist, 'id': f.artist}, 'album':{'name': f.album, 'id': f.albumId}, 'id': f.storeId, 'duration': f.durationMillis, 'artwork': f.imageBaseUrl, 'RatingTimestamp': f.lastRatingChangeTimestamp});

		    	}

		    	if (data.googlepmPlaylistFavs.length > 0)
			    	data.googlepmPlaylistFavs.sort( // Sort by rating date
					    function(a, b) {
					    	if (typeof b.RatingTimestamp == 'undefined')
						  return -1;
						else if (typeof a.RatingTimestamp == 'undefined')
						  return 1;
						return b.RatingTimestamp - a.RatingTimestamp;
					    }
					)

		    	updateLayout();
		      });

			  

			  pm.getPlayLists(function(err, playlists_data) {
			    data.googlepmPlaylists = [];
			    pm.getPlayListEntries(function(err, playlists_entries_data) {

			      if (playlists_data.data)
				      for (i of playlists_data.data.items) {
				        data.googlepmPlaylists.push({title: i.name, id: i.id });
				        data['googlepmPlaylist'+i.id] = [];
				      }

			      
			      if (playlists_entries_data.data)
				      for (t of playlists_entries_data.data.items) {
				        if (t.track) {
				        	if (t.track.albumArtRef === undefined) { i.track.albumArtRef = [{'url': ""}] };

				        	data['googlepmPlaylist'+t.playlistId].push({'service': 'googlepm', 'source': 'googlepmPlaylist'+t.playlistId, 'title': t.track.title, 'share_url': 'https://www.youtube.com/results?search_query='+encodeURIComponent(t.track.artist+" "+t.track.title), 'artist': {'name': t.track.artist, 'id': (t.track.artistId ? t.track.artistId[0] : '')}, 'album':{'name': t.track.album, 'id': t.track.albumId}, 'trackNumber': t.track.trackNumber, 'id': t.track.storeId, 'duration': t.track.durationMillis, 'artwork': t.track.albumArtRef[0].url});
				        } else {
				        	var track_object = getTrackObject(data.googlepmAll, t.trackId);
				        	if (track_object) {
					        	track_object.source = 'googlepmPlaylist'+t.playlistId;
					          	data['googlepmPlaylist'+t.playlistId].push(track_object);
					        }
				        }
				      }

			      for (p of data.googlepmPlaylists)
			      	if (typeof data['googlepmPlaylist'+p.id][0] != "undefined")
			      		p.image = data['googlepmPlaylist'+p.id][0].artwork; // Set the first track's artwork as playlist's artwork
			      	else p.image = '';

			      renderPlaylists();
			      updateLayout();
			      
			      resolve();

			    });
			  });
			});
		});
	});

}

googlepm.login = function (callback) {
  settings.googlepm.user = document.getElementById("googlepmUser").value;
  var pm_passwd = document.getElementById("googlepmPasswd").value;
  
  if (!settings.googlepm.user || !pm_passwd ) return;

  pm.login({email: settings.googlepm.user, password: pm_passwd}, function(err, pm_login_data) {  // fetch auth token
    if (err) return callback(err);

    settings.googlepm.masterToken = pm_login_data.masterToken;
    callback();

  });

}

googlepm.like = function (trackId) {
    pm.getAllTracks(function(err, library) {

      for (i of library.data.items) 
        if (i.id == g.playing.id) {
          var song = i;
          break;
        }

      if (typeof song == "undefined") {
        pm.getAllAccessTrack(g.playing.id, function(err, track) {
          track['rating'] = "5";
          pm.changeTrackMetadata(track, function(err, result) {
            if (err) notifier.notify({ 'title': 'Error liking track', 'message': err });
          });
        });
      } else {
        song['rating'] = "5";
        pm.changeTrackMetadata(song, function(err, result) {
          if (err) notifier.notify({ 'title': 'Error liking track', 'message': err });
        });
      }

    });
}

googlepm.unlike = function (trackId) {
	pm.getAllTracks(function(err, library) {
      for (i of library.data.items)
        if (i.id == trackId) {
          var song = i;
          break;
        }

      if (typeof song == "undefined") {
        pm.getAllAccessTrack(trackId, function(err, track) {
          track['rating'] = "1";
          pm.changeTrackMetadata(track, function(err, result) {
            if (err) notifier.notify({ 'title': 'Error liking track', 'message': err });
          });
        });
      } else {
        song['rating'] = "1";
        pm.changeTrackMetadata(song, function(err, result) {
          if (err) notifier.notify({ 'title': 'Error liking track', 'message': err });
        });
      }

    }); 
}

googlepm.getStreamUrl = function (track, callback) {
	pm.getStreamUrl(track.id, function(err, streamUrl) {
		if (streamUrl == undefined)

			api.getStreamUrlFromName(track.duration, track.artist.name+" "+track.title, function(err, streamUrl) {
				if (err) nextTrack();
				else callback(streamUrl, track.id);
			});

		else callback(streamUrl, track.id);
	});
}

googlepm.contextmenuItems = [

  { title: 'View artist', fn: function(){

    googlepm.viewArtist(trackList[index]);

  } },

  { title: 'View album', fn: function(){

    googlepm.viewAlbum(trackList[index]);

  } }

];

googlepm.viewArtist = function (track) {
	listView();

    document.getElementById("search").value = track.artist.name;
    changeActiveTab("googlepmAll", true);
}


googlepm.viewAlbum = function (track) {
	listView();

    document.getElementById("search").value = track.album.name;
    changeActiveTab("googlepmAll", true);
}