var recursive = require('recursive-readdir'),
    mm = require('musicmetadata');

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
  for (k of ["googlepm", "soundcloud", "spotify"])
    if (settings[k].active && data[k+"Playlists"])
      for (pl of data[k+"Playlists"])
        if (!document.getElementById(k+'Playlist'+pl.id)) {
          var temp = document.createElement('span');
          temp.setAttribute("onmousedown", "changeActiveTab('"+k+"Playlist"+pl.id+"')");
          temp.setAttribute("class", "nav-group-item");
          temp.setAttribute("id", k+"Playlist"+pl.id);

          switch (k) {
            case 'spotify':
              var color = "#75C044";
              break
            case 'googlepm':
              var color = "#ef6c00";
              break
            case 'soundcloud':
              var color = "#EF4500";
              break
          }

          temp.innerHTML = "<span style='color:"+color+"' class='icon icon-list'></span> "+pl.title;
          document.getElementById("playlists").appendChild(temp);
        }
}

function getData() {
  addClass("retry-button", "hide");

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

  removeClass("loading_msg", "hide");
  addClass("error_msg", "hide");
  addClass("retry-button", "hide");
  addClass("fullscreen_offline", "hide");

  fetchLocal().then(function() {
    console.log("local fetched, testing internet");
    return testInternet();
  })

  .catch(function() {

    console.error("Error with internet.")

    addClass("fullscreen_offline", "hide");
    for (s of ["soundcloud", "spotify", "googlepm"]) addClass(s, "hide");

    removeClass("error_msg", "hide");
    addClass("loading_msg", "hide");
    addClass("fullscreen_loading", "hide");

    changeActiveTab('localAll');
    document.getElementById("error").innerHTML = "Offline";
    console.log("Error configured");
    throw "Offline";

  }).then(function (){

    Promise.all([fetchLastfm(), fetchSoundcloud(), fetchGooglepm(), fetchSpotify()]).then(function() {

      console.log("Everything over");
      conf.set('data', data);
      clearTimeout(retryTimer);
      addClass("loading_msg", "hide");
      addClass("fullscreen_loading", "hide");

    }).catch(function(err) {

      removeClass("error_msg", "hide");
      addClass("loading_msg", "hide");
      addClass("fullscreen_loading", "hide");

      if (err[1]) openSettings();

      console.error("Error fetching data : "+err[0]);
      
      document.getElementById("error").innerHTML = "Error";
      
    });

  });

  var retryTimer = setTimeout(function(){//After 30s
    removeClass("retry-button", "hide");
  }, 30000);
  
}

function changeActiveTab(activeTab, keep_search) {
  removeClass(settings.activeTab, "active");
  addClass(activeTab, "active");

  if (activeTab.indexOf("soundcloud") > -1) addClass("layout-btn", "hide");
  else removeClass("layout-btn", "hide");
  
  if (!keep_search) document.getElementById("search").value = ""; // Reset search

  if (settings.activeTab != activeTab) {
    g.selected = null;
    settings.activeTab = activeTab;
    document.getElementById("trackList").scrollTop = 0; //If the user scrolled, go back to top
  }

  updateTrackList();

}

function updateTrackList() {
  setTimeout(function(){ // Async so it doesn't block the activetab changing process on loading large lists
    if (settings.layout == 'list' || settings.activeTab.indexOf("soundcloud") > -1) { //Soundcloud isn't adapted to coverflow view
      listView();
    } else {
      coverFlowView();
      coverFlowView(); // Needed 2 times for an unknown bug with coverflow library, to be investigated
    }
    updatePlayingIcon();
    conf.set('settings', settings);
  }, 0);
}

function isSearched(track) {
  var search = document.getElementById("search").value.toLowerCase();
  if (search.length > 1)
    if (track.title.toLowerCase().indexOf(search) > -1 || track.artist.name.toLowerCase().indexOf(search) > -1 || track.album.name.toLowerCase().indexOf(search) > -1)
      return true;
    else
      return false;
  else
    return true;
}

function createTrackList(initial) {
  var search = document.getElementById("search").value;


  if ((search.length <= 1 && JSON.stringify(trackList) == JSON.stringify(initial)) || initial.length == 0 || initial == undefined) return;
  
  if (search.length > 1) {
    trackList = [];

    for (var i = 0; i < initial.length; i++)
      if (isSearched(initial[i])) trackList.push(initial[i]);

  } else {
    trackList = initial;
  }

  document.getElementById("track_body").innerHTML = "";
  for (var i = 0; i < trackList.length; i++) {
    var temp = document.createElement('tr');
    temp.setAttribute("index", i);
    temp.setAttribute("id", trackList[i].id);

    if (trackList[i].service == "soundcloud")
      temp.setAttribute("oncontextmenu", "soundcloudTrackContextMenu(event, "+i+")");
    else
      temp.setAttribute("oncontextmenu", "trackContextMenu(event, "+i+")");

    temp.setAttribute("onmousedown", "if (g.selected != null) document.querySelectorAll(\"[index='\"+g.selected+\"']\")[0].classList.remove('selected');g.selected="+i+";this.classList.add('selected');");
    temp.setAttribute("ondblclick", "playByIndex("+i+")");
    temp.innerHTML = "<td>"+trackList[i].title+"</td><td>"+trackList[i].artist.name+"</td><td style='width: 30px'>"+msToDuration(trackList[i].duration)+"</td>"
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
  g.selected = null;

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
    if (albumAlready(y.album.name) == false && isSearched(y))
      albumsCover.push({title: y.album.name, image: (y.artwork ? y.artwork : 'file://'+__dirname+'/img/blank_artwork.png'), description: y.artist.name});

    if (!albums[y.album.name]) 
      albums[y.album.name] = [];
    
    albums[y.album.name].push(y);
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
  conf.set('settings', settings);
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