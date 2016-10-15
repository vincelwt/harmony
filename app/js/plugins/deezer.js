////////////////////////////////
////////////////////////////////
////////////////////////////////
////////////////////////////////


var deezer = exports;

deezer.discover = true;
deezer.mymusic = false;
deezer.playlists = true;

deezer.favsLocation = "deezer,mymusic,favs";

deezer.scrobbling = true;
deezer.color = "#3a3a3a";

deezer.settings = {active: false};

deezer.loginBtnHtml = `

    <a id='Btn_deezer' class='button login deezer hide' onclick="login('deezer')">Listen with <b>Deezer</b></a>
    <a id='LoggedBtn_deezer' class='button login deezer hide' onclick="logout('deezer')">Disconnect</a>
    <span id='error_deezer' class='error hide'>Error, please try to login again</span>

`;

deezer.loginBtnCss = `
	.deezer {
	  background-color: #3a3a3a;
	  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAQAAADa613fAAAAAmJLR0QA/4ePzL8AAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfgCgMPMjvVsvwFAAAEHklEQVR42u2Yz29UVRTHP3dmKoJARi1oSwQihOICGjWkNEaiC2NciAuCNrowlaUbY+LShYmJqcadif+BJoCAxhgVNWJcQCMJDSrBkP6A0oGRaWtnOtP2/TguuvTcN8O8TmZMzmd275tz3z33nu+9bw4YhmEYhmEYhmEYhmEYhmEYhmE0hOucqch2DpBVhCXOuX/+R2sqQ1KWQPldl331o3MdVR05dT65Ruom00GJZDzL2tBid9KOXOQd1SOLFNqUiBzhMVW4wmkXJ+5ItqMWW06JzinpSoh6TUI1qij72+WR6C6frxITqM/D9nkkbGpKMYFaWgHSpgtRBnlEFW5wwe8R74VY45f6F2JrduRJBoiVRRtlNCGqlxfoUqLmuER7bnb5wmP2k4lmf1VW1Khb7TO7rGmctM/ssxSU1ztKiZOqcpN1yvOi5+ho3OySY7Nnz8puOSHuCXrURGa4zCbV0FDhfvqVtzmWGHXldDuygxEeUqYU8z4/JMQd5ll17X+ixIdsU5P8gEXe5h4lqsQEKRPZyEG2qVW7NTFuH4fU50U2MMBOVethgWfQDoPbbExvdmnKzklRzWipzV7jD2aV4SPmEuMmuazeI5Ms8SdltbRmWWRMKS3H39TSmj3P09ynfkycd9cT4p5iuzrZKX7nkFoojgsEHPTc7OfcfLod6eU91SMRb5KQCMO8qD4/w0e86/HIW1T4WD1+bzNEykRybFFtHXNvYlzecxjkydHt0dYTslVNJG7ktsvUKbysJ8o1NWoGPCOC874tm97sC5xli7pGNxPjfvPs2EUq/EiP58u4yjfq8Ttb/xapl8g8X3nMPiWPMqjf+fzMr0x7TrMyX7NJ1cYJOK6ufrW+Q+pdIvtlQkLltyxH5XUJVO2q7JHPVSWUz6RP/vJow3JEKqpyYy36WllPha5WtPP4IJPgrUziiFl1Dq5VZs/ivIbP4Zo0u6+vtQZmL/IJedUjV+hiRE3lDiVOM66ON0aJT3nQoy0zopp9gWLaRISQULmjBUHUVoIjAmI1alULPdrqiO4/mmusi5KcR7/MeP60DskbHmVC+uSkRzshe2XSox2TlyVoVV9LPKsRERN7vlVDJLGvFXrfFXu0NelrReqkQgQhUj0SIZ4oiJvSotR9LenmMJtVj3xLjufU8eb5kkH61M/4q5znJfKqR86ywvPKCeWocMbdSbcjG3icbvWv7ijrGFATucV37Pb0tSLG6OdhNZFL1Djg6Wt9n97s06r9YnlFhj2mHZc9csKjHZe9MuE1+9FW9rXuvtPU7N9ZaWVfa4WCx9BVhGlVKxBSYsbT1wooqJ0SxyJVplvV11rPLvW1wiQZdqhBy1yjlwfUdZyjwC51sjBFxE61QgKuuRqGYRiGYRiGYRiGYRiGYRiGYbSZfwHCCjDNByXRvwAAAABJRU5ErkJggg==');
	}
`;

deezer.fetchData = function() {

	return new Promise(function(resolve, reject) {

		if (!settings.deezer.active) return resolve();

		if (!settings.deezer.access_token) {
			settings.deezer.error = true;
			return reject([null, true]);
		}

		api.init('deezer', client_ids.deezer.client_id, client_ids.deezer.client_secret);	

		data.deezer = {};
		data.deezer.discover = [];
		data.deezer.mymusic = [];
		data.deezer.playlists = [];

		data.deezer.discover.push({
			title: 'Flow', 
			artwork: '', 
			icon: 'user', 
			id: 'favs', 
			tracks: []
		});

		api.get('deezer', '/user/me/flow', settings.deezer.access_token, { output: 'json' }, function(err, result) {
			if (err) return reject([err]);

			for (i of result.data) 
				data.deezer.discover[0].tracks.push(convertTrack(i));

			api.get('deezer', '/user/me/playlists', settings.deezer.access_token, { output: 'json' }, function(err, result) {

				if (err) return reject([err]);

				for (i of result.data)
					!function outer(i) {
						api.get('deezer', i.tracklist.split('.com')[1], settings.deezer.access_token, { output: 'json' }, function(err, result) {
							if (err) return console.log(err);

							var tempTracks = [];

							for (t of result.data)
								tempTracks.push(convertTrack(t));

							data.deezer.playlists.push({
								title: i.title,
								id: i.id,
								icon: (i.title.trim() == "Loved tracks" ? 'heart' : null),
								artwork: i.picture_medium,
								tracks: tempTracks
							});

							renderPlaylists();

						});
					}(i);
					
			});
			
		});

		updateLayout();

		resolve();

	});


}

deezer.login = function (callback) {

	api.oauthLogin('deezer', function (code) {

	    api.init('deezer', client_ids.deezer.client_id, client_ids.deezer.client_secret);

	    api.auth('deezer', code, function (error, data) {

			if (error || data.error) return callback(error +" + "+data.error);

			// Parsing access token from received data
			settings.deezer.access_token = data.access_token;
			callback();

	    });

	});

}

deezer.like = function (trackId) {
    api.put('deezer', '/user/me/tracks?track_id='+g.playing.id, settings.deezer.access_token, {}, function(err, result) {
      if (err) new Notification('Error liking track', {'body': err, 'tag': 'Harmony-Error', 'origin': 'Harmony' });
    });
}

deezer.unlike = function (trackId) {
    api.delete('deezer', '/user/me/tracks?track_id='+g.playing.id, settings.deezer.access_token, {}, function(err, result) {
      if (err) new Notification('Error unliking track', {'body': err, 'tag': 'Harmony-Error', 'origin': 'Harmony' });
    });
}

deezer.getStreamUrl = function (track, callback) {
	api.getStreamUrlFromName(track.duration, track.artist.name+" "+track.title, function(err, streamUrl) {
		if (err)
		  nextTrack();
		else
		  callback(streamUrl, track.id);
	});
}

deezer.contextmenuItems = [

  { title: 'View artist', fn: function(){

    deezer.viewArtist(trackList[index]);

  } },

  { title: 'View album', fn: function(){

    deezer.viewAlbum(trackList[index]);

  } }

];

deezer.viewArtist = function (track) {
	listView();

    api.get('deezer', '/artist/'+track.artist.id+'/top', settings.deezer.access_token, { output: 'json', limit: '30' }, function(err, result) {
      if (err) return console.error(err);

      var tracks = [];

      for (i of result.data)
        tracks.push(convertTrack(i));

      createTrackList(tracks);
    });
}


deezer.viewAlbum = function (track) {
	listView();

    api.get('deezer', '/album/'+track.album.id+'/tracks', settings.deezer.access_token, { output: 'json' }, function(err, result) {
      if (err) return console.error(err);

      var tracks = [];

      for (i of result.data){

      		i.album = { title: track.album.name, id: track.album.id };

        	tracks.push(convertTrack(i));
      }

      createTrackList(tracks);
    });
}


var convertTrack = function(rawTrack) {

	return {
		'service': 'deezer',
		'title': rawTrack.title,
		'share_url': rawTrack.link,
		'album': {
			'name': rawTrack.album.title,
			'id': rawTrack.album.id
		},
		'artist': {
			'name': rawTrack.artist.name,
			'id': rawTrack.artist.id
		},
		'id': rawTrack.id,
		'duration': rawTrack.duration * 1000,
		'artwork': rawTrack.album.cover_medium
	};

}