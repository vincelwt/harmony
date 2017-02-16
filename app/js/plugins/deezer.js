/**
 * Deezer API Abstraction
 */
class Deezer {

	 /**
	 * Fetch data
	 *
	 * @returns {Promise}
	 */
	static fetchData () {
		return new Promise((resolve, reject) => {
			
			if (!settings.deezer.access_token) {
				settings.deezer.error = true;
				return reject([null, true]);
			}

			api.init('deezer', data.client_ids.deezer.client_id, data.client_ids.deezer.client_secret);	

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

			api.get('deezer', '/user/me/flow', settings.deezer.access_token, { output: 'json' }, (err, result) => {
				if (err) return reject([err]);

				for (i of result.data) 
					data.deezer.discover[0].tracks.push(convertTrack(i));

				api.get('deezer', '/user/me/playlists', settings.deezer.access_token, { output: 'json' }, (err, result) => {

					if (err) return reject([err]);

					var currentPl = 0;
					var toGet = result.data.length;

					for (i of result.data) {
						!function outer(i) {
							api.get('deezer', i.tracklist.split('.com')[1], settings.deezer.access_token, { output: 'json' }, (err, result) => {
								if (err) return console.log(err);

								var tempTracks = [];

								function moreTracks(url) {
									api.get('deezer', url.split('.com')[1], settings.deezer.access_token, { output: 'json' }, (err, result) => {
										if (err) return console.log(err);

										for (t of result.data)
											tempTracks.push(convertTrack(t));

										if (result.next) moreTracks(result.next);

									});
								}

								if (result) {
									for (t of result.data)
										tempTracks.push(convertTrack(t));

									if (result.next) moreTracks(result.next);
								}

								if (i.title.trim() == "Loved tracks")
									data.deezer.mymusic.push({
										title: "Loved tracks",
										id: 'favs',
										icon: 'heart',
										artwork: i.picture_medium,
										tracks: tempTracks
									});
								else
									data.deezer.playlists.push({
										title: i.title,
										id: i.id,
										icon: null,
										artwork: i.picture_medium,
										tracks: tempTracks
									});


								renderPlaylists();

								currentPl += 1;

								if (currentPl == toGet) resolve();

							});
						}(i);
					}
					
				});
				
			});

			updateLayout();

		});
	}

	/**
	* Called when user wants to activate the service²
	*
	* @param callback {Function} Callback function
	*/

	static login (callback) {

		api.oauthLogin('deezer', (code) => {

			api.init('deezer', data.client_ids.deezer.client_id, data.client_ids.deezer.client_secret);

			api.auth('deezer', code, (error, data) => {

				if (error || data.error) return callback(error +" + "+data.error);

				// Parsing access token from received data
				settings.deezer.access_token = data.access_token;
				callback();

			});

		});
	}

	/**
	 * Like a song
	 *
	 * @param trackId {string} The track's id (It uses g.playing instead though?)
	 */
	static like (trackId) {
		api.post('deezer', '/user/me/tracks?track_id='+g.playing.id, settings.deezer.access_token, {}, (err, result) => {
		  if (err) new Notification('Error liking track', {'body': err, 'tag': 'Harmony-Error', 'origin': 'Harmony' });
		});
	}

	/**
	 * Unlike a track
	 *
	 * @param trackId {string} The track's ID
	 */
	static unlike (trackId) {
		api.delete('deezer', '/user/me/tracks?track_id='+g.playing.id, settings.deezer.access_token, {}, (err, result) => {
		  if (err) new Notification('Error unliking track', {'body': err, 'tag': 'Harmony-Error', 'origin': 'Harmony' });
		});
	}

	/**
	 * Gets a track's streamable URL
	 *
	 * @param track {Object} The track object
	 * @param callback {Function} The callback function
	 */
	static getStreamUrl (track, callback) {
		api.getStreamUrlFromName(track.duration, track.artist.name+" "+track.title, (err, streamUrl) => {
			if (err)
			  nextTrack();
			else
			  callback(streamUrl, track.id);
		});
	}

	static viewArtist (track) {
		listView();

		api.get('deezer', '/artist/'+track.artist.id+'/top', settings.deezer.access_token, { output: 'json', limit: '30' }, (err, result) => {
		  if (err) return console.error(err);

		  var tracks = [];

		  for (i of result.data)
			tracks.push(convertTrack(i));

		  createTrackList(tracks);
		});
	}


	static viewAlbum (track) {
		listView();

		api.get('deezer', '/album/'+track.album.id+'/tracks', settings.deezer.access_token, { output: 'json' }, (err, result) => {
		  if (err) return console.error(err);

		  var tracks = [];

		  for (i of result.data){

				i.album = { title: track.album.name, id: track.album.id };

				tracks.push(convertTrack(i));
		  }

		  createTrackList(tracks);
		});
	}

}

/** Static Properties **/
Deezer.discover = true;
Deezer.mymusic = true;
Deezer.playlists = true;
Deezer.favsLocation = "Deezer,mymusic,favs";
Deezer.scrobbling = true;
Deezer.color = "#3a3a3a";
Deezer.settings = {
	active: false
};

Deezer.loginBtnHtml = `

	<a id='Btn_deezer' class='button login deezer hide' onclick="login('deezer')">Listen with <b>Deezer</b></a>
	<a id='LoggedBtn_deezer' class='button login deezer hide' onclick="logout('deezer')">Disconnect</a>
	<span id='error_deezer' class='error hide'>Error, please try to login again</span>

`;

Deezer.loginBtnCss = `
	.deezer {
	  background-color: #3a3a3a;
	  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAQAAADa613fAAAAAmJLR0QA/4ePzL8AAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfgCgMPMjvVsvwFAAAEHklEQVR42u2Yz29UVRTHP3dmKoJARi1oSwQihOICGjWkNEaiC2NciAuCNrowlaUbY+LShYmJqcadif+BJoCAxhgVNWJcQCMJDSrBkP6A0oGRaWtnOtP2/TguuvTcN8O8TmZMzmd275tz3z33nu+9bw4YhmEYhmEYhmEYhmEYhmEYhmE0hOucqch2DpBVhCXOuX/+R2sqQ1KWQPldl331o3MdVR05dT65Ruom00GJZDzL2tBid9KOXOQd1SOLFNqUiBzhMVW4wmkXJ+5ItqMWW06JzinpSoh6TUI1qij72+WR6C6frxITqM/D9nkkbGpKMYFaWgHSpgtRBnlEFW5wwe8R74VY45f6F2JrduRJBoiVRRtlNCGqlxfoUqLmuER7bnb5wmP2k4lmf1VW1Khb7TO7rGmctM/ssxSU1ztKiZOqcpN1yvOi5+ho3OySY7Nnz8puOSHuCXrURGa4zCbV0FDhfvqVtzmWGHXldDuygxEeUqYU8z4/JMQd5ll17X+ixIdsU5P8gEXe5h4lqsQEKRPZyEG2qVW7NTFuH4fU50U2MMBOVethgWfQDoPbbExvdmnKzklRzWipzV7jD2aV4SPmEuMmuazeI5Ms8SdltbRmWWRMKS3H39TSmj3P09ynfkycd9cT4p5iuzrZKX7nkFoojgsEHPTc7OfcfLod6eU91SMRb5KQCMO8qD4/w0e86/HIW1T4WD1+bzNEykRybFFtHXNvYlzecxjkydHt0dYTslVNJG7ktsvUKbysJ8o1NWoGPCOC874tm97sC5xli7pGNxPjfvPs2EUq/EiP58u4yjfq8Ttb/xapl8g8X3nMPiWPMqjf+fzMr0x7TrMyX7NJ1cYJOK6ufrW+Q+pdIvtlQkLltyxH5XUJVO2q7JHPVSWUz6RP/vJow3JEKqpyYy36WllPha5WtPP4IJPgrUziiFl1Dq5VZs/ivIbP4Zo0u6+vtQZmL/IJedUjV+hiRE3lDiVOM66ON0aJT3nQoy0zopp9gWLaRISQULmjBUHUVoIjAmI1alULPdrqiO4/mmusi5KcR7/MeP60DskbHmVC+uSkRzshe2XSox2TlyVoVV9LPKsRERN7vlVDJLGvFXrfFXu0NelrReqkQgQhUj0SIZ4oiJvSotR9LenmMJtVj3xLjufU8eb5kkH61M/4q5znJfKqR86ywvPKCeWocMbdSbcjG3icbvWv7ijrGFATucV37Pb0tSLG6OdhNZFL1Djg6Wt9n97s06r9YnlFhj2mHZc9csKjHZe9MuE1+9FW9rXuvtPU7N9ZaWVfa4WCx9BVhGlVKxBSYsbT1wooqJ0SxyJVplvV11rPLvW1wiQZdqhBy1yjlwfUdZyjwC51sjBFxE61QgKuuRqGYRiGYRiGYRiGYRiGYRiGYbSZfwHCCjDNByXRvwAAAABJRU5ErkJggg==');
	}
`;


Deezer.contextmenuItems = [

  { title: 'View artist', fn: () => {

	deezer.viewArtist(trackList[index]);

  } },

  { title: 'View album', fn: () => {

	deezer.viewAlbum(trackList[index]);

  } }

];

const convertTrack = (rawTrack) => {

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

module.exports = Deezer;