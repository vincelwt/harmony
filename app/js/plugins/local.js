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

local.loginBtnHtml = `

        <a id='btn_local' class='button login local hide' onclick="login('local')">Listen with <b>local tracks</b></a>
        <a id='btn_local2' class='button login local hide' onclick="login('local')"></a>
        <span id='error_local' class='error hide'>Error with your local tracks</span>

`;

local.fetchData = function(callback) {

	return new Promise(function(resolve, reject) {

		if (!settings.local.active) return resolve();

		data.local = {};
		data.local.mymusic = [];
		data.local.playlists = [];

		if (conf.get("localPlaylistFavs") == undefined) {
		  data.local.playlists.push({title: 'Favorites', artwork: '', icon: 'heart', id: 'favs', tracks: []});
		  conf.set("localPlaylistFavs", data.local.playlists[0]);
		} else {
		  data.local.playlists[0] = conf.get("localPlaylistFavs");
		} 

		data.local.mymusic.push({title: 'Local library', artwork: '', icon: 'drive', id: 'library', tracks: []});

		for (i of settings.local.paths) // Useless 'for' for now, will be useful when multiple folders possible

		  recursive(i, function (err, files) {
		  	var finishNow = false;
		  	
		  	var musicFiles = [];

		  	for (var g of files)
		  		if (g.substr(g.length - 3) == "mp3" || g.substr(g.length - 3) == "wav") musicFiles.push(g);

		  	var last_track = musicFiles[musicFiles.length - 1];

		  	musicFiles.forEach(function (filename) {

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

		              data.local.mymusic[0].tracks.push({'service': 'local', 'source': 'local,mymusic,library', 'title': title, 'share_url': 'https://www.youtube.com/results?search_query='+encodeURIComponent(title), 'artist': {'name': '', 'id': ''}, 'album': {'name': '', 'id': ''}, 'trackNumber': '', 'id': id, 'duration': metadata.duration*1000, 'artwork': artwork, 'stream_url': 'file://'+filename});
		            
		            } else {
		              if (!metadata.album) metadata.album = '';
		              if (!metadata.artist || !metadata.artist[0]) metadata.artist[0] = '';

		              data.local.mymusic[0].tracks.push({'service': 'local', 'source': 'local,mymusic,library', 'title': metadata.title, 'share_url': 'https://www.youtube.com/results?search_query='+encodeURIComponent(metadata.artist[0]+" "+metadata.title), 'artist': {'name': metadata.artist[0], 'id': metadata.artist[0] }, 'trackNumber': metadata.track.no, 'album': {'name': metadata.album, 'id': metadata.album}, 'id': id, 'duration': metadata.duration*1000, 'artwork': artwork, 'stream_url': 'file://'+filename});
		            }

		            if (filename == last_track) updateLayout();

				});
			});

		    resolve();
		  });
	});
}

local.login = function (callback) {

	settings.local.paths = dialog.showOpenDialog({ properties: ['openDirectory']});
  
	if (settings.local.paths == undefined) return callback("No path selected");

	getById("btn_local2").innerHTML = settings.local.paths;
	callback();

}

local.like = 
local.unlike = function (trackId) {
    conf.set("localPlaylistFavs", data.local.playlists[0]);
}

local.getStreamUrl = function (track, callback) {
	callback(track.stream_url, track.id);
}

local.contextmenuItems = [

  { title: 'View artist', fn: function(){

    local.viewArtist(trackList[index]);

  } },

  { title: 'View album', fn: function(){

    local.viewAlbum(trackList[index]);

  } },

];

local.viewArtist = function (track) {
	listView();

    getById("search").value = track.artist.name;
    changeActiveTab("localAll", true);
}

local.viewAlbum = function (track) {
	listView();

    getById("search").value = track.album.name;
    changeActiveTab("localAll", true);
}