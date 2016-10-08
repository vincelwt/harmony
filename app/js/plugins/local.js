var dialog = require('electron').remote.dialog;

////////////////////////////////
////////////////////////////////
////////////////////////////////
////////////////////////////////

var local = exports;

local.discover = false;
local.mymusic = true;
local.playlists = true;

local.favsLocation = "local,playlists,favs";

local.scrobbling = true;
local.color = "#666666";

local.settings = {
	paths: [],
	active: false
};

local.loginBtnHtml = `

    <a id='Btn_local' class='button login local hide' onclick="login('local')">Listen with <b>local tracks</b></a>
    <a id='LoggedBtn_local' class='button login local hide' onclick="login('local')"></a>
    <span id='error_local' class='error hide'>Error with your local tracks</span>

`;

local.loginBtnCss = `
	.local {
	  background-color: #6894B4;
	  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AIHDgkRjGtsSgAAAsxJREFUeNrt3b1qFGEUh/HnBIUUmhRGDVY2Noo24gVoI96EoMQ2nb2VhVhEwUYQrC1MIzYWXoBgJVGLEOz8wCQm8StxcyyyfdB9Z2eG9/lVqRZmz3/POTOzmwFJkiRJkiRJkiRJkiRJkiRJkvaXmZGZE028ru/u/5touOjnM/NlZm4Au8AgCwN2h38OMnMzM99n5kJmTlne/UWDxZ8EVoDZlo7tFXApIrYsczsd4GKLxQe4ADzJzAOWuZ0AnO3A8V0BHrontBOAEx05xmvAgqUefwBmO3Sc85l5z04w3gAc79ixzg93gmnLPp6zgDfAmQ4e80fgAfACWAY2gJ2ISANQNgBfgBk/YyPZBt4BtyJisTcBGJ56bTcZsMrsAKci4kNfdoAZi1/UQeByn5bAY9asuJMGoG5TBqBuh/oUgOPWq+4A2AEMgAo73KcAHLVe7gCqOABeAu5JACRJUp2K3LHLzBvAHHDaZaVxP9j7uv1T4HZE/Go1AJl5E7hjXVrxKCLm2g7ACg3dqtS+ViPiSNsB2MUvf7RlEBEj/fClxIWggXVozcg/eysRgFXr0Jo1A1C3dQNgBzAABsAAOAIMgB2grQB8tQ6OADkCZAeQAZAjQJ4FqC8BKPWNoB3A/8c3fpMR8bvtDlBkFumf/Ry1+CUD4B7Qw/ZvACo/AygZABdBO4AMgKodAQbADqCaA+AS6AiQI0AGQI4AVdgB1tl7LqBqDMDwaRtr1qTeEeAYGK8/EbFpAPz0GwADYABcADsSAC8HVx4AO4AjQHYAGQA5AuRZgBwBqmoEeEew5g4QEbvAN2tT7whwDFQ+AlwExyMNQN02I2LQ1QB8tj6N+1TyxUoHYMn6NO5tlwPwzPo07nlnAxARS8B9a9SY18DjojVrZE3NvApcB84B0zT3jOIafAeWgUXgbkRs+ZZIkiRJkiRJkiRJkiRJkiRJkiSAv7ZLOmGgbupvAAAAAElFTkSuQmCC);
	}
`;

local.fetchData = function(callback) {

	return new Promise(function(resolve, reject) {

		if (!settings.local.active) return resolve();

		data.local = {};
		data.local.mymusic = [];
		data.local.playlists = [];

		if (conf.get("localPlaylistFavs") == undefined) {
			data.local.playlists.push({
				title: 'Favorites',
				artwork: '',
				icon: 'heart',
				id: 'favs',
				tracks: []
			});
			conf.set("localPlaylistFavs", data.local.playlists[0]);
		} else {
			data.local.playlists[0] = conf.get("localPlaylistFavs");
		}

		data.local.mymusic.push({
			title: 'Local library',
			artwork: '',
			icon: 'drive',
			id: 'library',
			tracks: []
		});

		for (i of settings.local.paths) // Useless 'for' for now, will be useful when multiple folders possible

			recursive(i, function(err, files) {
			var finishNow = false;

			var musicFiles = [];

			for (var g of files)
				if (g.substr(g.length - 3) == "mp3" || g.substr(g.length - 3) == "wav") musicFiles.push(g);

			var last_track = musicFiles[musicFiles.length - 1];

			musicFiles.forEach(function(filename) {

				var fileStream = fs.createReadStream(filename);
				var parser = new mm(fileStream, { duration: true }, function(err, metadata) {
					if (err) return console.log(err);
					
					fileStream.destroy();

					var id = new Buffer(filename).toString('base64'); // We generate array from base64 code

					var artwork = null;

					if (metadata.picture.length > 0) {
						var picture = metadata.picture[0];
						var artwork = URL.createObjectURL(new Blob([picture.data], { 'type': 'image/' + picture.format}));
					}

					if (err || metadata.title == "" || metadata.title == undefined) {
						console.log('Metadatas not found :' + err);

						if (process.platform == "win32") var title = filename.split("\\").pop();
						else var title = filename.split('/').pop();

						data.local.mymusic[0].tracks.push({
							'service': 'local',
							'source': 'local,mymusic,library',
							'title': title,
							'share_url': 'https://www.youtube.com/results?search_query=' + encodeURIComponent(title),
							'artist': {
								'name': '',
								'id': ''
							},
							'album': {
								'name': '',
								'id': ''
							},
							'trackNumber': '',
							'id': id,
							'duration': metadata.duration * 1000,
							'artwork': artwork,
							'stream_url': 'file://' + filename
						});

					} else {
						if (!metadata.album) metadata.album = '';
						if (!metadata.artist || !metadata.artist[0]) metadata.artist[0] = '';

						data.local.mymusic[0].tracks.push({
							'service': 'local',
							'source': 'local,mymusic,library',
							'title': metadata.title,
							'share_url': 'https://www.youtube.com/results?search_query=' + encodeURIComponent(metadata.artist[0] + " " + metadata.title),
							'artist': {
								'name': metadata.artist[0],
								'id': metadata.artist[0]
							},
							'trackNumber': metadata.track.no,
							'album': {
								'name': metadata.album,
								'id': metadata.album
							},
							'id': id,
							'duration': metadata.duration * 1000,
							'artwork': artwork,
							'stream_url': 'file://' + filename
						});
					}

					if (filename == last_track) updateLayout();

				});
			});

			resolve();
		});
	});
}

local.login = function(callback) {

	settings.local.paths = dialog.showOpenDialog({
		properties: ['openDirectory']
	});

	if (settings.local.paths == undefined) return callback("No path selected");

	getById("LoggedBtn_local").innerHTML = settings.local.paths;
	callback();

}

local.like =
local.unlike = function(trackId) {
	conf.set("localPlaylistFavs", data.local.playlists[0]);
}

local.getStreamUrl = function(track, callback) {
	callback(track.stream_url, track.id);
}

local.contextmenuItems = [

	{
		title: 'Search artist',
		fn: function() {

			local.viewArtist(trackList[index]);

		}
	},

	{
		title: 'Search album',
		fn: function() {

			local.viewAlbum(trackList[index]);

		}
	},

];

local.viewArtist = function(track) {
	settings.layout = 'list';
	updateLayout();

	getById("search").value = track.artist.name;
	changeActiveTab("local,mymusic,library", true);
}

local.viewAlbum = function(track) {
	settings.layout = 'list';
	updateLayout();

	getById("search").value = track.album.name;
	changeActiveTab("local,mymusic,library", true);
}