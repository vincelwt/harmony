///// API STUFF /////

const request = require('request');
const api_url = 'https://api.hypem.com/v2'

function deviceID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
}

function get(endpoint, params, callback) {
	if (settings.hypemachine.token) params.hm_token = settings.hypemachine.token;

	var parts = [];

	for (let key in params)
		if (params.hasOwnProperty(key))
			parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));

	var url = api_url + endpoint + "?" + parts.join('&');

	request({
		url: url,
		method: 'GET',
		json: true
	}, (error, response, body) => {
	  callback(error, body);
	})
}

function post(endpoint, params, callback) {
	if (settings.hypemachine.token) endpoint += "?hm_token="+settings.hypemachine.token;

	request({
		url: api_url+endpoint,
		method: "POST",
		json: true,
		form: params
	}, (error, response, body) => {
		callback(error, body);
	});
}

////////////////////////////////
////////////////////////////////

class Hypemachine {
	/**
	* Fetch data
	*
	* @returns {Promise}
	*/
	static fetchData () {

		return new Promise((resolve, reject) => {

			if (!settings.hypemachine.token) return reject(['No access token', true]);

			data.hypemachine = {};
			data.hypemachine.mymusic = [];
			data.hypemachine.playlists = [];
			data.hypemachine.discover = [];

			data.hypemachine.playlists.push({
				id: 'favs',
				title: 'Liked tracks',
				icon: 'heart',
				artwork: '',
				tracks: []
			});

			data.hypemachine.discover.push({
				id: 'chart3days',
				title: 'Popular now',
				icon: 'trophy',
				artwork: '',
				tracks: []
			});

			data.hypemachine.discover.push({
				id: 'chartweek',
				title: 'Popular this week',
				icon: 'trophy',
				artwork: '',
				tracks: []
			});

			get('/me/favorites', {count: 400}, (err, result) => {
				if (err) return reject([err]);
				
				for (let i of result)
					data.hypemachine.playlists[0].tracks.push(convertTrack(i));

			});

			get('/popular', {count: 100}, (err, result) => {
				if (err) return reject([err]);
				
				for (let i of result)
					data.hypemachine.discover[0].tracks.push(convertTrack(i));
			
				get('/popular', {count: 100, mode: 'lastweek'}, (err, result) => {
					if (err) return reject([err]);
					
					for (let i of result)
						data.hypemachine.discover[1].tracks.push(convertTrack(i));

					resolve();
				});

			});

		});
	}

	/**
	 * Get the streamable URL
	 *
	 * @param track {Object} The track object
	 * @param callback {Function} Callback function
	 */
	static getStreamUrl (track, callback) {
		callback('https://hypem.com/serve/public/'+track.id, track.id);
	}

	static login (callback) {
		settings.hypemachine.user = getById("hypemachineUser").value;
		var pswrd = getById("hypemachinePasswd").value;

		if (!settings.hypemachine.user || !pswrd) return;

		post('/get_token', {username: settings.hypemachine.user, password: pswrd, device_id: deviceID()}, (err, result) => {

			if (err) return callback(err);
			if (result.status == "error") return callback(result);

			settings.hypemachine.token = result.hm_token;
			getById("LoggedBtn_hypemachine").innerHTML = settings.hypemachine.user;

			callback();

		})

	}

	/**
	 * Like a song
	 *
	 * @param trackId {string} The track's id (It uses g.playing instead though?)
	 */ 
	static like (trackId) {

		post('/me/favorites', {type: 'item', val: g.playing.id}, (err, result) => {

			if (err) new Notification('Error (un)liking track', {
				'body': err,
				'tag': 'Harmony-Error',
				'origin': 'Harmony'
			});

		})

	}

	/**
	 * UnLike a song
	 *
	 * @param trackId {string} The track's id (It uses g.playing instead though?)
	 */ 
	static unlike (trackId) {
		this.like(trackId); // This is the same method to like/unlike
	}

}

Hypemachine.discover = true;
Hypemachine.mymusic = false;
Hypemachine.playlists = true;
Hypemachine.favsLocation = "hypemachine,playlists,favs";
Hypemachine.scrobbling = true;
Hypemachine.color = "#75C044";
Hypemachine.settings = {
	active: false
};

Hypemachine.loginBtnHtml = `

	<a id='LoggedBtn_hypemachine' class='button login hypemachine hide' onclick="logout('hypemachine')"></a>
	<a id='Btn_hypemachine' class='button login hypemachine hide' onclick="removeClass('hm_form', 'hide')"><span>Listen with <b>Hype Machine</b></span>
	  <br>
	  <div id='hm_form' class='hide'>
		<div class='form-group'>
		  <input id='hypemachineUser' type='text' class='form-control' placeholder='Username'>
		  <br/>
		  <input id='hypemachinePasswd' type='password' class='form-control' placeholder='Password'>
		  <br/>
		  <button onclick="login('hypemachine')" class='btn btn-primary'>Save</button>
		</div>
	  </div>
	</a>
	<span id='error_hypemachine' class='error hide'>Error, please check your credentials</span>

`;

Hypemachine.loginBtnCss = `
	.hypemachine {
	  background-color: #83c441;
	  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AoPEQQV3BZRfQAAAiNJREFUeNrtm0tOAzEMhmur3ILuQUI8Nqzb+99hKpULdI2EwgqpLdM2Lz/G+f8ddErsL7bHCclqBUEQBEEQBEFQsUhzsJRSEneIiMIB1ABnBZMigtMESR6g1TqoOZYowBJHpNNK2xaSNli7qGvbRxKGWUPTtLlr7fEKTtJ+GgmchD80KrxeflHtIEsH18tHArw2Xwnw2nym3D8UHVyt/wR4bRAZ8NrSm4GlbZlHiL62VOalrWe9RSLn7lpA8xHJlqmbUko/x2P60xKjkKwA1m4tWTb3c5zYG7xbn5f+XiMK2bJ+aECX9mW9pKY15zva3QNrpm+EN/0lo3ArEe1JwlIOAAEQAHvubixhDNMIjLZJESqFLSaHozhqFdk8UrSES+FeEC0ngzxs49euHjzY6uIlUnUqykkJcPMWLjoR5ah+mu1I16Szt9OuRETu+sCr/3tw+tamW3StjbPYIC2JvrMa6HGGl9Arcu/WIqKyTyZczjgg3s8KvvfA6BDv3jOpCVukbgbAa/RHAdl0QjUnhCODLMk+aqkDuOow+E2lHuVqyLtyPX0hq4E9tycid+UitDoSd4fXqwEkeematKPv9HtSEZu7euoxPksaePr83DnolKlp2qdp2p/9fEs54MzKzZzB2+0u5TxnLfNa8vb68dnLkSiwisL4cPj63mweH3ptBbWWBg8dAEnWvhHWzVwK4un55b3keVwZgyAIgiAIgiDon34B3f0k5sxQPEQAAAAASUVORK5CYII=');
	}

	.hypemachine #hm_form {
		margin-left:-40px;
		width: 220px;
	}
`;

Hypemachine.contextmenuItems = [];

const convertTrack = (rawTrack) => {

	return {
		'service': 'hypemachine',
		'title': rawTrack.title,
		'share_url': 'http://hypem.com/track/'+rawTrack.itemid,
		'artist': {
			'name': rawTrack.artist,
			'id': rawTrack.artist
		},
		'album': {
			'name': '',
			'id': ''
		},
		'id': rawTrack.itemid,
		'duration': rawTrack.time * 1000,
		'artwork': rawTrack.thumb_url_large
	};

}

module.exports = Hypemachine;