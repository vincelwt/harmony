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
          temp.setAttribute("name", k);
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
    settings = {volume: 1, notifOff: false, coverflow: false, layout: 'list', repeat: true, shuffle: false, lastfm: {active: false}, spotify: {active: false}, soundcloud: {active: false}, googlepm : {user: '', passwd: '', active: false}, local: {paths:[], active: false}};
    
    openSettings();

    return
  } else {
    settings = conf.get("settings");

    if (settings.coverflow == false) addClass("layout-btn", "hide");
    else removeClass("layout-btn", "hide");
    
    if (conf.get("data") == undefined) {
      data = {};
      conf.set('data', data);
      removeClass('fullscreen_loading', "hide");
    } else {
      data = conf.get("data");
      renderPlaylists();
    }

    if (settings.activeTab) {
      changeActiveTab(settings.activeTab);
    } else if (settings.soundcloud.active) {
      changeActiveTab('soundcloudStream');
    } else if (settings.googlepm.active) {
      changeActiveTab('googlepmAll');
    } else if (settings.spotify.active) {
      changeActiveTab('spotifyPlaylistFavs');
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

  if (!settings.soundcloud.active) addClass("discover", "hide");
  else removeClass("discover", "hide");

  if (settings.soundcloud.active && !settings.local.active && !settings.googlepm.active && !settings.spotify.active) addClass("mymusic", "hide");
  else removeClass("mymusic", "hide");

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

    addClass("discover", "hide");
    removeClass("error_msg", "hide");
    addClass("error_msg", "offline");
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
      addClass("error_msg", "error");
      addClass("loading_msg", "hide");
      addClass("fullscreen_loading", "hide");

      if (err[1]) openSettings();

      console.error("Error fetching data : "+err[0]);
      
      document.getElementById("error").innerHTML = "Error";
      
    });

    //// ASYNC FUNCTION CHECKING FOR UPDATE ///

      var xhr = new XMLHttpRequest();

      xhr.open("GET", "https://api.github.com/repos/vincelwt/harmony/releases", true);

      xhr.onload = function (e) {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var newUpdate = JSON.parse(xhr.responseText);

            console.log("Latest release is "+newUpdate[0].tag_name);

            if (newUpdate[0].tag_name > process.env.npm_package_version)
                notifier.notify({'title': 'Update available', 'message': 'A new version of Harmony is available, visit the website'});

        }

      };

      xhr.send(null);

    ///////////////////////////////////////

  });

  var retryTimer = setTimeout(function(){//After 45s
    removeClass("retry-button", "hide");
  }, 45000);
  
}

function changeActiveTab(activeTab, keep_search, noRefresh) {
  removeClass(settings.activeTab, "active");
  addClass(activeTab, "active");

  if (settings.coverflow) {
    if (activeTab == "soundcloudStream") addClass("layout-btn", "hide");
    else removeClass("layout-btn", "hide");
  }

  if (!keep_search) document.getElementById("search").value = ""; // Reset search

  if (!noRefresh && //Cause we only use noRefresh on coverflow update, so we evitate an infinite loop
      settings.coverflow && settings.layout == "coverflow" && 
      settings.activeTab.indexOf('Playlist') > -1 && settings.activeTab != "spotifyPlaylistFavs" && 
      activeTab.indexOf('Playlist') > -1 && activeTab != "spotifyPlaylistFavs") {  
    
    try { coverflow('coverflow').to(coverPos(activeTab, true)) } catch (e) {}
    
    noRefresh = true;
  }

  if (settings.activeTab != activeTab) {
    g.selected = null;
    settings.activeTab = activeTab;
    document.getElementById("trackList").scrollTop = 0; //If the user scrolled, go back to top
  }

  if (!noRefresh) updateLayout();
}

function updateLayout() {
  setTimeout(function(){ // Async so it doesn't block the activetab changing process on loading large lists
    if (settings.layout == 'list' || settings.activeTab == "soundcloudStream" || !settings.coverflow) { //Soundcloud isn't adapted to coverflow view

      addClass("list-btn", "active");
      removeClass("coverflow-btn", "active");
      addClass("coverflow", "hide");

      listView();

    } else {

      addClass("coverflow-btn", "active");
      removeClass("list-btn", "active");
      removeClass("coverflow", "hide");

      coverFlowView();
      coverFlowView(); // Needed 2 times for an unknown bug with coverflow library, to be investigated
      
      if (settings.activeTab.indexOf('Playlist') > -1 && settings.activeTab != "spotifyPlaylistFavs")
        try { coverflow('coverflow').to(coverPos(settings.activeTab, true)) } catch (e) {};

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

  if (settings.activeTab == "localAll" ||
      settings.activeTab == "googlepmAll" ) {

    initial.sort(function(a,b) {

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

    } );
  }

  var search = document.getElementById("search").value;

  if ((search.length <= 1 && JSON.stringify(trackList) == JSON.stringify(initial)) || initial == undefined) return;

  if (search.length > 1) {
    trackList = [];

    for (var i = 0; i < initial.length; i++)
      if (isSearched(initial[i])) trackList.push(initial[i]);

  } else {
    trackList = JSON.parse(JSON.stringify(initial));
  }

  if (trackList.length == 0) {
    removeClass("empty_tracklist", "hide");
    addClass("track_body", "hide");
  } else {
    console.log("Good trackList");
    addClass("empty_tracklist", "hide");
    removeClass("track_body", "hide");

    document.getElementById("track_body").innerHTML = "";
    for (var i = 0; i < trackList.length; i++) {
      var temp = document.createElement('tr');
      temp.setAttribute("index", i);
      temp.setAttribute("id", trackList[i].id);

      if (trackList[i].service == "soundcloud")
        temp.setAttribute("oncontextmenu", "soundcloudTrackContextMenu(event, "+i+")");
      else
        temp.setAttribute("oncontextmenu", "trackContextMenu(event, "+i+")");

      temp.setAttribute("onmousedown", "try { if (g.selected != null) document.querySelectorAll(\"[index='\"+g.selected+\"']\")[0].classList.remove('selected')} catch (e) {};g.selected="+i+";this.classList.add('selected');");
      temp.setAttribute("ondblclick", "playByIndex("+i+")");
      temp.innerHTML = "<td>"+trackList[i].title+"</td><td>"+(trackList[i].artist.name == '' ? 'Unknown artist': trackList[i].artist.name)+"</td><td class='albumCol'>"+(trackList[i].album.name == '' && trackList[i].service.indexOf('soundcloud') < 0 ? 'Unknown': trackList[i].album.name)+"</td><td style='width: 30px'>"+msToDuration(trackList[i].duration)+"</td>"
      document.getElementById("track_body").appendChild(temp);
    }
  }

}

function listView() {
  console.log("listView");
  createTrackList(data[settings.activeTab]);
}

function coverFlowView() {
  console.log("coverFlowView")
  updatePlayingIcon();

  g.selected = null;
  coverflowContent = {};
  coverflowItemsTmp = [];

  if (settings.activeTab.indexOf('Playlist') > -1 && settings.activeTab != "spotifyPlaylistFavs") { //If we are dealing with playlists

    for (k of ["googlepm", "soundcloud", "spotify", "local"])
      if (settings[k].active) {

        if (k != "spotify") { // We don't want to add Spotify "my tracks" tab to the playlists
          coverflowItemsTmp.unshift({id: k+"PlaylistFavs", title: (k == "googlepm" ? "Thumbs up" : "Favorites"), image: 'file://'+__dirname+'/img/blank_artwork.png', description: (k == "googlepm" ? "Play Music" : k.capitalize())});
          coverflowContent[k+"PlaylistFavs"] = data[k+"PlaylistFavs"];
        }

        if (data[k+"Playlists"])
          for (pl of data[k+"Playlists"]) {
            coverflowItemsTmp.push({id: k+"Playlist"+pl.id, title: pl.title, image: (pl.image != '' ? pl.image : 'file://'+__dirname+'/img/blank_artwork.png'), description: (k == "googlepm" ? "Play Music" : k.capitalize())});
            coverflowContent[k+"Playlist"+pl.id] = data[k+"Playlist"+pl.id];
          }
      }

    for (z = 0; z < coverflowItemsTmp.length; z++) {

      if (coverflowItemsTmp[z].id == settings.activeTab) 
        createTrackList(coverflowContent[coverflowItemsTmp[z].id]);

    }
  } else { //If we are dealing with albums

    for (y of data[settings.activeTab]) {

      if (!coverPos(y.album.name))
        coverflowItemsTmp.push({title: y.album.name, image: (y.artwork && y.artwork != '' ? y.artwork : 'file://'+__dirname+'/img/blank_artwork.png'), description: y.artist.name});

      if (!coverflowContent[y.album.name]) 
        coverflowContent[y.album.name] = [];
      
      coverflowContent[y.album.name].push(y);

    }

    createTrackList(coverflowContent[coverflowItemsTmp[currentCoverIndex].title]);

  }
  
  if ( JSON.stringify(coverflowItems) == JSON.stringify(coverflowItemsTmp) ) return; // No need to update the coverflow | JSON serialize is a way to compare array of objects

  console.log("Passed");
  coverflowItems = coverflowItemsTmp;

  try { document.getElementsByTagName('style')[0].remove() } catch (e) {} // Bug with coverflow library, we need to remove the previous style tag created by the library, evitate html overload

  coverflow('coverflow').setup({
    playlist: coverflowItems,
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
    currentCoverIndex = z;
    document.getElementById("search").value = "";

    if (!coverflowItems[z]) return;

    if (settings.activeTab.indexOf('Playlist') > -1 && settings.activeTab != "spotifyPlaylistFavs") {

      changeActiveTab(coverflowItems[z].id, false, true);
      createTrackList(coverflowContent[coverflowItems[z].id]);

    } else {
      createTrackList(coverflowContent[coverflowItems[z].title]); // Albums are better sorted by title than by IDs
    }

    updatePlayingIcon();
   
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

setInterval(function(){ // Update every hour
  getData();
}, 3600000);

getData();

if (settings.shuffle)
  document.getElementById("shuffle-btn").classList.add("active");

document.getElementById("volume_range").value = settings.volume;
player.elPlayer.volume = settings.volume;