/**
 * Tests the internet connection & Gets the latest API Keys & Secrets
 *
 * @returns {Promise} The XMLHttpRequest that's testing the internet connection
 */
function testInternet() {
	console.log("Testing internet...");

	return new Promise(function(resolve, reject) {
		var api_creds_url = "http://harmony-player.surge.sh/harmony.json";

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

/**
 * Gets an element by its id
 * (Surely this didn't need to be abstracted)
 *
 * @param id {String}
 * @returns {HTMLElement} The HTML Element
 */
function getById(id) {
	return document.getElementById(id);
}

/**
 * Returns true if the current tracks matched the search value
 *
 * @param track {Object} The track Object
 * @returns {boolean}
 */
function isSearched(track) {
	const search = getById("search").value.toLowerCase();

	if (search.length > 1) {
		const titleContainsValue = track.title.toLowerCase().indexOf(search) > -1;
		const artistContainsValue = track.artist.name.toLowerCase().indexOf(search) > -1;
		const albumContainsValue = track.album.name.toLowerCase().indexOf(search) > -1;

        return titleContainsValue ||  artistContainsValue || albumContainsValue;
	}

	return true;
}

/**
 * Gets the parameter by name
 *
 * @param name {string} The name
 * @param url {string} The URL containing the parameter
 * @returns {string}
 */
function getParameterByName(name, url) {
	name = name.replace(/[\[\]]/g, "\\$&");
	const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
	const results = regex.exec(url);

	if (!results || !results[2]) {
        return null;
	}

	return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/**
 * Get the hostname of an url
 * @param url {string}
 * @returns {string}
 */
function getHostname(url) {
	const l = document.createElement("a");
	l.href = url;
	return l.hostname;
}

/**
 * Get the full object of a track
 * @param source {Object}: the location of the track
 * @param id {String}: the id of the track
 * @returns {Object}
 */
function getTrackObject(source, id) {
	for (let i = 0; i < source.length; i++) {
        if (source[i].id === id) {
            return source[i];
        }
	}

	return null;
}

/**
 * Get the full object of a track list
 * @param locationString {String}: the location of the list
 * @returns {Object}
 */
function getListObject(locationString) {

	const location = locationString.split(",");

	if (!data[location[0]]) return false;

	for (let o of data[location[0]][location[1]]) {
        if (o.id == location[2]) {
            return o;
		}
	}

	return false;
}

String.prototype.capitalize = () => {
	return this.charAt(0).toUpperCase() + this.slice(1);
};

function coverPos(title, id) {
	for (let x = 0; x < coverflowItemsTmp.length; x++) {
        if ((!id && coverflowItemsTmp[x].title == title) || (id && coverflowItems[x].id == title)) {
            return x;
		}
	}

	return false;
}

/**
 * Randomize an array
 * @param array {Object}: the array to randomize
 * @returns {Object}
 */
function shuffle(array) {
	let currentIndex = array.length;
	let temporaryValue = null;
	let randomIndex = null;

	while (0 !== currentIndex) {

		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}


/**
 * Sort an track list object by a certain key
 * @param Array {Object}: the array to sort
 * @param key {string}: the key used to sort
 * @returns {Object}
 */
Array.prototype.sortBy = function(key) { // Don't use arrow function for the -this-

	switch (key) {

		case 'track': {
            this.sort((a, b) => {
                if (a.title < b.title)
                    return -1;
                if (a.title > b.title)
                    return 1;

                return 0;
            });

            break;
		}

		case 'artist': {
            this.sort((a, b) => {
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
		}

		case 'time': {
            this.sort((a, b) => {
                if (a.duration < b.duration)
                    return -1;
                if (a.duration > b.duration)
                    return 1;

                return 0;
            });

            break;
		}

		case 'album': {
            this.sort((a, b) => {
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
		}
			
		default: {
			break;
		}

	}

	return this;
};

/**
 * Converts a millisecond duration in minutes:seconds format
 * @param ms {number}: the duration in milliseconds
 * @returns {string}
 */
function msToDuration(ms) {
	let seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);

	seconds = seconds - (minutes * 60);

	if (seconds.toString().length == 1) {
        seconds = '0' + seconds;
	}

	return minutes + ':' + seconds;
}

/**
 * Update the small playing icon next to the playing track's name
 */
function updatePlayingIcon() {
	if (g.playing) {
		const icon_playing = getById("playing_icon");
        const playing_song = getById(g.playing.id);

		if (icon_playing) {
            icon_playing.parentNode.removeChild(icon_playing);
		}

		if (playing_song) {
			const icon_playing_c = playing_song.firstChild;
			const iconHTML = " <span class='icon icon-play' id='playing_icon'></span> ";

			icon_playing_c.innerHTML = iconHTML + icon_playing_c.innerHTML
		}

	}
}

/**
 * Add a specific class to element(s)
 * @param id {string or Object}: the elements to add the class
 * @returns {string}
 */
function addClass(id, className) {
	if (Array.isArray(id)) {
        for (let i of id) {
            getById(i).classList.add(className);
        }
	} else if (getById(id)) {
        getById(id).classList.add(className);
	} else if (document.getElementsByName(id)) {
        const elements = document.getElementsByName(id);
        elements.forEach(anElement => anElement.classList.remove(className));
	}
}

/**
 * Remove a specific class from element(s)
 * @param id {string or Object}: the elements to add the class
 * @returns {string}
 */
function removeClass(id, className) {
	if (Array.isArray(id)) {
        for (let i of id) {
            getById(i).classList.remove(className);
        }
	} else if (getById(id)) {
        getById(id).classList.remove(className);
	} else if (document.getElementsByName(id)) {
		const elements = document.getElementsByName(id);
        elements.forEach(anElement => anElement.classList.remove(className));
	}

}

function ISO8601ToSeconds(input) {
	const reptms = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
	let hours = 0,
		minutes = 0,
		seconds = 0,
		totalseconds;

	if (reptms.test(input)) {
		const matches = reptms.exec(input);

		if (matches[1]) hours = Number(matches[1]);
		if (matches[2]) minutes = Number(matches[2]);
		if (matches[3]) seconds = Number(matches[3]);

		totalseconds = hours * 3600 + minutes * 60 + seconds;
	}

	return (totalseconds);
}


/**
 * Converts invalid artwork urls to the default one
 * @param artwork {string}
 * @returns {string}
 */
function testArtwork(artwork) {
	let returnedArtwork = artwork;

	if (artwork == undefined || artwork == '' || artwork == null) {
        returnedArtwork = 'file://' + __dirname + '/img/blank_artwork.png';
	}

	return returnedArtwork;
}
