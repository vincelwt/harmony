var recursive = require('recursive-readdir'),
    mm = require('musicmetadata'),
    basicContext = require('./js/vendor/basicContext.min.js');

Mousetrap.bind('down', function(e) {
  if (g.selected != null && g.selected+1 < trackList.length) {
    document.querySelectorAll("[index='"+g.selected+"']")[0].classList.remove("selected");
    g.selected++;
    document.querySelectorAll("[index='"+g.selected+"']")[0].classList.add("selected");
    e.preventDefault();
  }
});

Mousetrap.bind('up', function(e) {
  if (g.selected != null && g.selected > 0) {
    document.querySelectorAll("[index='"+g.selected+"']")[0].classList.remove("selected");
    g.selected--;
    document.querySelectorAll("[index='"+g.selected+"']")[0].classList.add("selected");
    e.preventDefault();
  }
});

Mousetrap.bind('enter', function(e) {
  if (g.selected != null) {
    playByIndex(g.selected);
    e.preventDefault();
  }
});

Mousetrap.bind('mod+f', function(e) {
  document.getElementById("search").focus();
});


function trackContextMenu(e, index) {
    let items = [
      { title: 'Play next', fn: function(){

        playingTrackList.splice(g.playing.indexPlaying+1, 0, trackList[index]);
        updateTrackListIndexes();

      } }
    ]

    basicContext.show(items, e)
}

function playByIndex(index) {
  playingTrackList = trackList.slice();

  updateTrackListIndexes();

  playTrack(playingTrackList[index]);

  if (settings.shuffle)
    playingTrackList = shuffle(playingTrackList);
    updateTrackListIndexes();
}

function updateTrackListIndexes() {
  var temp = JSON.parse(JSON.stringify(playingTrackList)); // Evitate object reference

  for (i = 0; i < playingTrackList.length; i++)
    temp[i]['indexPlaying'] = i;

  playingTrackList = JSON.parse(JSON.stringify(temp));
}

function toggleShuffle() {
  
  if (settings.shuffle) {
    settings.shuffle = false;
    document.getElementById("shuffle-btn").classList.remove("active");

    playingTrackList = [];
    playingTrackList.push.apply(playingTrackList, trackList);

  } else {
    settings.shuffle = true;
    document.getElementById("shuffle-btn").classList.add("active");
    playingTrackList = shuffle(playingTrackList);
  }

  conf.set('settings', settings);

  updateTrackListIndexes();
}

function renderPlaylists() {
  for (k of ["spotify", "soundcloud", "googlepm"])
    if (settings[k].active && data[k+"Playlists"])
      for (pl of data[k+"Playlists"])
        if (!document.getElementById(k+'Playlist'+pl.id)) {
          var temp = document.createElement('span');
          temp.setAttribute("onmousedown", "changeActiveTab('"+k+"Playlist"+pl.id+"')");
          temp.setAttribute("class", "nav-group-item");
          temp.setAttribute("id", k+"Playlist"+pl.id);
          temp.innerHTML = "<span class='icon icon-list'></span> "+pl.title;
          document.getElementById(k).appendChild(temp);
        }
}

function getData() {

  if (conf.get("settings") == undefined) {
    console.log("First time");
    settings = {volume: 1, layout: 'list', backgroundNotify: true, repeat: true, shuffle: false, lastfm: {active: false}, spotify: {active: false}, soundcloud: {active: false}, googlepm : {user: '', passwd: '', active: false}, local: {paths:[], active: false}};
    
    openSettings();

    return
  } else {
    settings = conf.get("settings");

    if (conf.get("data") == undefined) {
      data = {};
      conf.set('data', data);
      document.getElementById("fullscreen_loading").classList.remove("hide");
    } else {
      data = conf.get("data");
      renderPlaylists();
    }

    settings.googlepm.active = settings.googlepm.user;

    if (settings.activeTab) {
      changeActiveTab(settings.activeTab);
    } else if (settings.soundcloud.active) {
      changeActiveTab('soundcloudStream');
    } else if (settings.googlepm.active) {
      changeActiveTab('googlepmAll');
    } else if (settings.spotify.active) {
      changeActiveTab('spotifyFavs');
    } else if (settings.local.active) {
      changeActiveTab('localAll');
    } else {
      openSettings();
      return;
    }
  }

  for (s of ["soundcloud", "local", "spotify", "googlepm"]) {
    if (settings[s].active) removeClass(s, "hide");
    else addClass(s, "hide");
  }

  document.getElementById("loading_msg").classList.remove("hide");
  document.getElementById("error_msg").classList.add("hide");
  document.getElementById("retry-button").classList.add("hide");
  document.getElementById("fullscreen_offline").classList.add("hide");

  fetchLocal().then(function() {
    console.log("local fetched, testing internet");
    return testInternet();
  })

  .then(function() {
    fetchLastfm();
    console.log("internet ok, fetching soundcloud");
    fetchSoundcloud(); 
    console.log("soundcloud ok, fetching spotify");
    fetchSpotify();
    console.log("spotify ok, fetching googlepm");
    return fetchGooglepm();

  }, function() {
    console.error("Error with internet.")

    if (!settings.local.active)
      document.getElementById("fullscreen_offline").classList.remove("hide");

    for (s of ["soundcloud", "spotify", "googlepm"])
      if (settings[s].active) document.getElementById(s).classList.add("hide");

    changeActiveTab('localAll');
    document.getElementById("error").innerHTML = "Offline";
    throw "Offline";

  })

  .then(function() {
    console.log("Everything over");
    conf.set('data', data);
    clearTimeout(retryTimer);
    document.getElementById("loading_msg").classList.add("hide");
    document.getElementById("fullscreen_loading").classList.add("hide");
  })

  .catch(function(err) {
    document.getElementById("error_msg").classList.remove("hide");
    document.getElementById("loading_msg").classList.add("hide");
    document.getElementById("fullscreen_loading").classList.add("hide");
    
    if (err == "Offline") return;

    if (err[1]) {
      conf.set('settings', settings);
      openSettings();
    }

    console.error("Error fetching data : "+err[0]);
    
    document.getElementById("error").innerHTML = "Error";
    
  });

  var retryTimer = setTimeout(function(){//After 30s
    document.getElementById("retry-button").classList.remove("hide");
  }, 30000);
  
}

function changeActiveTab(activeTab) {
  removeClass(settings.activeTab, "active");
  addClass(activeTab, "active");

  if (settings.activeTab != activeTab) {
    document.getElementById("search").value = ""; // Reset search
    g.selected = null; //Reset selected
    settings.activeTab = activeTab;
    document.getElementById("trackList").scrollTop = 0; //If the user scrolled, go back to top
    updateTrackList();

  }
}

function updateTrackList() {
  setTimeout(function(){ // Async so it doesn't block the activetab changing process on loading large lists
    if (settings.layout == 'list' || settings.activeTab.indexOf("soundcloud") > -1) { //Soundcloud isn't adapted to coverflow view
      listView();
    } else {
      coverFlowView();
      coverFlowView(); // Needed for an unknown bug with coverflow library, to be investigated
    }
    updatePlayingIcon();
    conf.set('settings', settings);
  }, 0);
}

function createTrackList(initial) {
  var search = document.getElementById("search").value.toLowerCase();
  if (search.length > 1) {
    trackList = [];
    for (var i = 0; i < initial.length; i++)
      if (initial[i].title.toLowerCase().indexOf(search) > -1 || initial[i].artist.toLowerCase().indexOf(search) > -1)
        trackList.push(initial[i]);
  } else {
    trackList = initial;
  }

  document.getElementById("track_body").innerHTML = "";
  for (var i = 0; i < trackList.length; i++) {
    var temp = document.createElement('tr');
    temp.setAttribute("index", i);
    temp.setAttribute("id", trackList[i].id);
    temp.setAttribute("oncontextmenu", "trackContextMenu(event, "+i+")");
    temp.setAttribute("onmousedown", "if (g.selected != null) document.querySelectorAll(\"[index='\"+g.selected+\"']\")[0].classList.remove('selected');g.selected="+i+";this.classList.add('selected');");
    temp.setAttribute("ondblclick", "playByIndex("+i+")");
    temp.innerHTML = "<td>"+trackList[i].title+"</td><td>"+trackList[i].artist+"</td><td style='width: 30px'>"+msToDuration(trackList[i].duration)+"</td>"
    document.getElementById("track_body").appendChild(temp);
  }
}

function listView() {
  document.getElementById("list-btn").classList.add("active");
  document.getElementById("coverflow-btn").classList.remove("active");
  document.getElementById("coverflow").classList.add("hide");

  createTrackList(data[settings.activeTab]);
}

function coverFlowView() {
  document.getElementById("coverflow-btn").classList.add("active");
  document.getElementById("list-btn").classList.remove("active");
  document.getElementById("coverflow").classList.remove("hide");

  var albumsCover = [],
      albums = {};

  function albumAlready(title) {
    for (x = 0; x < albumsCover.length; x++)
      if (albumsCover[x].title == title) return true;
    return false;
  }

  for (y of data[settings.activeTab]) {
    if (albumAlready(y.album) == false)
      albumsCover.push({title: y.album, image: (y.artwork ? y.artwork : 'file://'+__dirname+'/img/blank_artwork.png'), description: y.artist});

    if (!albums[y.album]) 
      albums[y.album] = [];
    
    albums[y.album].push(y);
  }

  createTrackList(albums[albumsCover[0].title]);

  coverflow('coverflow').setup({
    playlist: albumsCover,
    width: '100%',
    height: 250,
    y: -20,
    backgroundcolor: "f9f9f9",
    coverwidth: 180,
    coverheight: 180,
    fixedsize: true,
    textoffset: 50,
    textstyle: ".coverflow-text{color:#000000;text-align:center;font-family:Arial Rounded MT Bold,Arial;} .coverflow-text h1{font-size:14px;font-weight:normal;line-height:21px;} .coverflow-text h2{font-size:11px;font-weight:normal;} "
  }).on('focus', function(z, link) {
    if (albumsCover[z])
      createTrackList(albums[albumsCover[z].title]);
  });
}

function openSettings() {
  var settingsWin = new BrowserWindow({ title: 'Settings', width: 350, height: 530, show: true, nodeIntegration: true });
  settingsWin.setMenu(null);
  settingsWin.loadURL('file://'+__dirname+'/settings.html');
  //settingsWin.webContents.openDevTools();
  settingsWin.on('close', function() { getData(); }, false);
}


//////////////////////////////
//     When we start      ///
////////////////////////////

setInterval(function(){ // Update every 30 minutes
  getData();
}, 1800000);

getData();

if (settings.shuffle)
  document.getElementById("shuffle-btn").classList.add("active");

document.getElementById("volume_range").value = settings.volume;
player.elPlayer.volume = settings.volume;