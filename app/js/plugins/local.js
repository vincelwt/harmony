const dialog = require('electron').remote.dialog;

class Local {

    /**
	 * Fetch data from local sources
     * @param callback
     * @returns {Promise}
     */
    static fetchData (callback) {

        return new Promise((resolve, reject) => {

            if (!settings.local.active) {
                return resolve();
			}

            data.local = {};
            data.local.mymusic = [];
            data.local.playlists = [];

            if (conf.get("localPlaylistFavs") === undefined) {
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

            // Useless 'for' for now, will be useful when multiple folders possible
            for (let i of settings.local.paths) {
                recursive(i, (err, files) => {
                    if (files === undefined) {
                        settings.local.error = true;
                        return reject([err, true])
                    }

                    let finishNow = false;
                    let musicFiles = [];

                    for (let g of files) {
                    	const isMP3 = g.substr(g.length - 3) === "mp3";
                    	const isWAV = g.substr(g.length - 3) === "wav";

                        if (isMP3 || isWAV) {
                            musicFiles.push(g);
						}
					}

                    let last_track = musicFiles[musicFiles.length - 1];

                    musicFiles.forEach(filename => {

                        const fileStream = fs.createReadStream(filename);
                        const parser = new mm(fileStream, { duration: true }, (err, metadata) => {
                            if (err) {
                                return console.log(err);
							}

                            fileStream.destroy();

                            const id = new Buffer(filename).toString('base64'); // We generate array from base64 code
                            let artwork = null;

                            if (metadata.picture.length > 0) {
                                let picture = metadata.picture[0];
                                artwork = URL.createObjectURL(new Blob([picture.data], { 'type': 'image/' + picture.format}));
                            }

                            if (err || metadata.title === "" || metadata.title === undefined) {
                                console.log('Metadatas not found :' + err);
                                let title = filename.split('/').pop();

                                if (process.platform == "win32") {
                                    title = filename.split("\\").pop();
								}

                                data.local.mymusic[0].tracks.push({
                                    'service': 'local',
                                    'source': 'local,mymusic,library',
                                    'title': title,
                                    'share_url': `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`,
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
                                    'stream_url': `file://${filename}`
                                });

                            } else {
                                metadata.album = metadata.album || "";
                                metadata.artist[0] = metadata.artist[0] || '';
                                const ytLookup = metadata.artist[0] + " " + metadata.title;

                                data.local.mymusic[0].tracks.push({
                                    'service': 'local',
                                    'source': 'local,mymusic,library',
                                    'title': metadata.title,
                                    'share_url': `https://www.youtube.com/results?search_query=${encodeURIComponent(ytLookup)}`,
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
                                    'stream_url': `file://${filename}`
                                });
                            }

                            if (filename === last_track) {
                                updateLayout();
							}

                        });
                    });

                    resolve();
                });
			}
        });
    }

    /**
     * Like a local song
     */
    static like () {
        this.toggleLike();
    }

    /**
     * Unlike a static song
     */
    static unlike () {
        this.toggleLike();
    }

    /**
     * Toggle the like status on a local song
     */
    toggleLike () {
        conf.set("localPlaylistFavs", data.local.playlists[0]);
    }

    /**
     * Get the streamable URL from a local song
     *
     * @param track {Object} The track object
     * @param callback {Function} The callback function
     */
    static getStreamUrl (track, callback) {
        callback(track.stream_url, track.id);
    }

    /**
     * View the local artist
     *
     * @param track {Object} The track object
     */
    static viewArtist (track) {
        settings.layout = 'list';
        updateLayout();

        getById("search").value = track.artist.name;
        changeActiveTab("local,mymusic,library", true);
    }

    /**
     * View the local album
     *
     * @param track {Object} The track object
     */
    static viewAlbum (track) {
        settings.layout = 'list';
        updateLayout();

        getById("search").value = track.album.name;
        changeActiveTab("local,mymusic,library", true);
    }

}

/** Static Properties **/
Local.discover = false;
Local.mymusic = true;
Local.playlists = true;
Local.favsLocation = "local,playlists,favs";
Local.scrobbling = true;
Local.color = "#666666";
Local.settings = {
	paths: [],
	active: false
};
Local.contextmenuItems = [

    {
        title: 'Search artist',
        fn: () => Local.viewArtist(trackList[index])
    },

    {
        title: 'Search album',
        fn: () => Local.viewAlbum(trackList[index])
    },

];
Local.loginBtnHtml = `

    <a id='Btn_local' class='button login local hide' onclick="login('local')">Listen with <b>local tracks</b></a>
    <a id='LoggedBtn_local' class='button login local hide' onclick="login('local')"></a>
    <span id='error_local' class='error hide'>Error with your path</span>

`;
Local.loginBtnCss = `
	.local {
	  background-color: #6894B4;
	  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AIHDgkRjGtsSgAAAsxJREFUeNrt3b1qFGEUh/HnBIUUmhRGDVY2Noo24gVoI96EoMQ2nb2VhVhEwUYQrC1MIzYWXoBgJVGLEOz8wCQm8StxcyyyfdB9Z2eG9/lVqRZmz3/POTOzmwFJkiRJkiRJkiRJkiRJkiRJkvaXmZGZE028ru/u/5touOjnM/NlZm4Au8AgCwN2h38OMnMzM99n5kJmTlne/UWDxZ8EVoDZlo7tFXApIrYsczsd4GKLxQe4ADzJzAOWuZ0AnO3A8V0BHrontBOAEx05xmvAgqUefwBmO3Sc85l5z04w3gAc79ixzg93gmnLPp6zgDfAmQ4e80fgAfACWAY2gJ2ISANQNgBfgBk/YyPZBt4BtyJisTcBGJ56bTcZsMrsAKci4kNfdoAZi1/UQeByn5bAY9asuJMGoG5TBqBuh/oUgOPWq+4A2AEMgAo73KcAHLVe7gCqOABeAu5JACRJUp2K3LHLzBvAHHDaZaVxP9j7uv1T4HZE/Go1AJl5E7hjXVrxKCLm2g7ACg3dqtS+ViPiSNsB2MUvf7RlEBEj/fClxIWggXVozcg/eysRgFXr0Jo1A1C3dQNgBzAABsAAOAIMgB2grQB8tQ6OADkCZAeQAZAjQJ4FqC8BKPWNoB3A/8c3fpMR8bvtDlBkFumf/Ry1+CUD4B7Qw/ZvACo/AygZABdBO4AMgKodAQbADqCaA+AS6AiQI0AGQI4AVdgB1tl7LqBqDMDwaRtr1qTeEeAYGK8/EbFpAPz0GwADYABcADsSAC8HVx4AO4AjQHYAGQA5AuRZgBwBqmoEeEew5g4QEbvAN2tT7whwDFQ+AlwExyMNQN02I2LQ1QB8tj6N+1TyxUoHYMn6NO5tlwPwzPo07nlnAxARS8B9a9SY18DjojVrZE3NvApcB84B0zT3jOIafAeWgUXgbkRs+ZZIkiRJkiRJkiRJkiRJkiRJkiSAv7ZLOmGgbupvAAAAAElFTkSuQmCC);
	}
`;

module.exports = Local;