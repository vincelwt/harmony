function testInternet() {
	console.log("Testing internet...");

	return new Promise(function(resolve, reject) {
		var api_creds_url = "https://dl.dropboxusercontent.com/u/39260904/harmony.json";

		var xhr = new XMLHttpRequest();

		xhr.open("GET", api_creds_url, true);

		xhr.onload = function(e) {
			if (xhr.readyState === 4)
				if (xhr.status === 200) {
					data.client_ids = JSON.parse(xhr.responseText);
					conf.set('data', data);
					return resolve();
				} else {
					console.log(xhr.statusText);
					return reject([xhr.statusText]);
				}
		};

		xhr.onerror = function(e) {
			console.error(xhr.statusText);
			return reject([xhr.statusText]);
		};

		xhr.send(null);

	});

}

function getById(id) {
	return document.getElementById(id);
}

function isSearched(track) {
	var search = getById("search").value.toLowerCase();
	if (search.length > 1)
		if (track.title.toLowerCase().indexOf(search) > -1 || track.artist.name.toLowerCase().indexOf(search) > -1 || track.album.name.toLowerCase().indexOf(search) > -1)
			return true;
		else
			return false;

	return true;
}

function getParameterByName(name, url) {
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function getHostname(url) {
	var l = document.createElement("a");
	l.href = url;
	return l.hostname;
};

function getTrackObject(source, id) {
	for (i = 0; i < source.length; i++)
		if (source[i].id == id) return source[i];

	return null;
}

function getListObject(locationString) {

	var location = locationString.split(",");

	if (!data[location[0]]) return false;

	for (o of data[location[0]][location[1]])
		if (o.id == location[2]) return o;

	return false;
}

String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
}

function coverPos(title, id) {
	for (x = 0; x < coverflowItemsTmp.length; x++)
		if ((!id && coverflowItemsTmp[x].title == title) || (id && coverflowItems[x].id == title)) return x;

	return false;
}

function shuffle(array) {
	var currentIndex = array.length,
		temporaryValue, randomIndex;

	while (0 !== currentIndex) {

		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}

Array.prototype.sortBy = function(key) {

	switch (key) {

		case 'track':

			this.sort(function(a, b) {
				if (a.title < b.title)
					return -1;
				if (a.title > b.title)
					return 1;

				return 0;
			});

			break;

		case 'artist':

			this.sort(function(a, b) {
				if (a.artist.name < b.artist.name)
					return -1;
				if (a.artist.name > b.artist.name)
					return 1;

				if (a.artist.name == b.artist.name) {
					if (a.album.name < b.album.name)
						return -1;
					if (a.album.name > b.album.name)
						return 1;

					if (a.album.name == b.album.name) {
						if (a.trackNumber < b.trackNumber)
							return -1;
						if (a.trackNumber > b.trackNumber)
							return 1;
					}
				}

				return 0;
			});

			break;

		case 'time':

			this.sort(function(a, b) {
				if (a.duration < b.duration)
					return -1;
				if (a.duration > b.duration)
					return 1;

				return 0;
			});

			break;

		case 'album':

			this.sort(function(a, b) {
				if (a.album.name < b.album.name)
					return -1;
				if (a.album.name > b.album.name)
					return 1;

				if (a.album.name == b.album.name) {
					if (a.artist.name < b.artist.name)
						return -1;
					if (a.artist.name > b.artist.name)
						return 1;

					if (a.artist.name == b.artist.name) {
						if (a.trackNumber < b.trackNumber)
							return -1;
						if (a.trackNumber > b.trackNumber)
							return 1;
					}
				}

				return 0;
			});

			break;
			
		default:

	}

	return this;
}

function msToDuration(ms) {
	var seconds = Math.floor(ms / 1000),
		minutes = Math.floor(seconds / 60),
		seconds = seconds - (minutes * 60);
	if (seconds.toString().length == 1) seconds = '0' + seconds;
	return minutes + ':' + seconds;
}

function updatePlayingIcon() {
	if (g.playing) {
		var icon_playing = getById("playing_icon");
		if (icon_playing) icon_playing.parentNode.removeChild(icon_playing);

		var playing_song = getById(g.playing.id);

		if (playing_song) {
			var icon_playing_c = playing_song.firstChild;
			icon_playing_c.innerHTML = " <span class='icon icon-play' id='playing_icon'></span> " + icon_playing_c.innerHTML
		}

	}
}

function addClass(id, className) {
	if (Array.isArray(id))
		for (var i of id)
			getById(i).classList.add(className);

	else if (getById(id)) // If it's an id
		getById(id).classList.add(className);

	else if (document.getElementsByName(id)) // If it's a name and not an id
		for (var i = 0; i < document.getElementsByName(id).length; i++)
		document.getElementsByName(id)[i].classList.add(className);
}

function removeClass(id, className) {
	if (Array.isArray(id))
		for (var i of id)
			getById(i).classList.remove(className);

	else if (getById(id))
		getById(id).classList.remove(className);

	else if (document.getElementsByName(id))
		for (var i = 0; i < document.getElementsByName(id).length; i++)
			document.getElementsByName(id)[i].classList.remove(className);
}

function ISO8601ToSeconds(input) {

	var reptms = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
	var hours = 0,
		minutes = 0,
		seconds = 0,
		totalseconds;

	if (reptms.test(input)) {
		var matches = reptms.exec(input);
		if (matches[1]) hours = Number(matches[1]);
		if (matches[2]) minutes = Number(matches[2]);
		if (matches[3]) seconds = Number(matches[3]);
		totalseconds = hours * 3600 + minutes * 60 + seconds;
	}

	return (totalseconds);
}

function testArtwork(artwork) {
	if (artwork == undefined || artwork == '' || artwork == null)
		return 'file://' + __dirname + '/img/blank_artwork.png';
	else return artwork;
}
