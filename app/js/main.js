function playByIndex(index) {
  playingTrackList = trackList.slice();

  updateTrackListIndexes();

  playTrack(playingTrackList[index]);

  if (settings.shuffle) {
    playingTrackList = shuffle(playingTrackList);
    updateTrackListIndexes();
  }
}

////// PUT TRACKS INDEXES IN ORDER CORRESPONDING TO TRACKLIST ///////////

function updateTrackListIndexes() {
  var temp = JSON.parse(JSON.stringify(playingTrackList)); // Evitate object reference

  for (i = 0; i < playingTrackList.length; i++)
    temp[i]['indexPlaying'] = i;

  playingTrackList = JSON.parse(JSON.stringify(temp));
}



function toggleShuffle() {
  
  if (settings.shuffle) {
    settings.shuffle = false;
    removeClass("shuffle-btn", "active");

    playingTrackList = [];
    playingTrackList.push.apply(playingTrackList, trackList);

  } else {
    settings.shuffle = true;
    addClass("shuffle-btn", "active");
    playingTrackList = shuffle(playingTrackList);
  }

  conf.set('settings', settings);

  updateTrackListIndexes();
}

////////////// PUT ITEMS IN SIDEMENU ////////////////////////


function renderPlaylists() {
  /*getById("temp_playlists").innerHTML = "";
  getById("temp_discover").innerHTML = "";
  getById("temp_mymusic").innerHTML = "";*/

  for (k of services) {
    if (!settings[k].active) continue;

    for (cat of ["discover", "mymusic", "playlists"]) {
      if (!window[k][cat] || !data[k]) continue;

      for (pl of data[k][cat]) {

        if (getById(k+","+cat+","+pl.id)) continue;

        var temp = document.createElement('span');
        temp.setAttribute("onmousedown", "changeActiveTab('"+k+","+cat+","+pl.id+"')");
        temp.setAttribute("class", "nav-group-item");
        temp.setAttribute("name", k);
        temp.setAttribute("id", k+","+cat+","+pl.id);

        temp.innerHTML = "<span style='color:"+window[k].color+"' class='icon icon-"+(pl.icon ? pl.icon : 'list')+"'></span> "+pl.title;

        if (pl.id == "favs") getById("temp_"+cat).insertBefore(temp, getById("temp_"+cat).firstChild); // We want to add favs first
        else getById("temp_"+cat).appendChild(temp);

      }
    }

  }
  
}


///////////////// FUNCTION SETTING EVERYTHING IN PLACE /////////////////


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

    } else {

      for (s of services)
        if (settings[s].active) {
          var ok = true;
          changeActiveTab(window[s].favsLocation);
        }

      // If there's no active services we open for conf
      if (!ok) return openSettings();

    }
  }

  // We hide discover and mymusic in case they'll not be used
  addClass("discover", "hide"); 
  addClass("mymusic", "hide");

  for (s of services) {

    if (settings[s].active)  { 
      removeClass(s, "hide");

      if (window[s].discover) removeClass("discover", "hide");
      if (window[s].mymusic) removeClass("mymusic", "hide");

    } else addClass(s, "hide");
  }

  removeClass("loading_msg", "hide");
  addClass("error_msg", "hide");
  addClass("retry-button", "hide");
  addClass("fullscreen_offline", "hide");

  window["local"].fetchData().then(function() {
    console.log("local fetched, testing internet");
    return testInternet();
  })

  .catch(function(e) {
    console.log(e);

    console.error("Error with internet.")

    addClass("fullscreen_offline", "hide");

    for (s of services) addClass(s, "hide"); // Hide everything but local tracks if offline
    removeClass("local", "hide")

    addClass("discover", "hide");
    removeClass("error_msg", "hide");
    addClass("error_msg", "offline");
    addClass("loading_msg", "hide");
    addClass("fullscreen_loading", "hide");

    changeActiveTab('local,mymusic,library');
    getById("error").innerHTML = "Offline";

    throw "Offline";

  }).then(function (){

    var fn = function(v){
      if (v == 'local') return; // We already fetched local data
      return window[v].fetchData();
    };

    ///// USE ALL FETCHDATA FUNCTIONS FROM ALL SERVICES
    Promise.all(services.map(fn)).then(function() {

      console.log("Everything over");
      clearTimeout(retryTimer);

      conf.set('data', data);

      addClass("loading_msg", "hide");
      addClass("fullscreen_loading", "hide");

    }).catch(function(err) {

      removeClass("error_msg", "hide");
      addClass("error_msg", "error");
      addClass("loading_msg", "hide");
      addClass("fullscreen_loading", "hide");

      if (err[1]) openSettings();

      console.error("Error fetching data : "+err[0]);
      
      getById("error").innerHTML = "Error";
      
    });

    if (settings.lastfm.active)
      api.init('lastfm', client_ids.lastfm.client_id, client_ids.lastfm.client_secret);

    //// ASYNC FUNCTION CHECKING FOR UPDATE ///

      var xhr = new XMLHttpRequest();

      xhr.open("GET", "https://api.github.com/repos/vincelwt/harmony/releases/latest", true);

      xhr.onload = function (e) {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var newUpdate = JSON.parse(xhr.responseText);

            console.log("Latest release is "+newUpdate.tag_name);

            if (newUpdate.tag_name > process.env.npm_package_version)
                notifier.notify({'title': 'Update available', 'message': 'A new version of Harmony is available, visit the website'});

        }

      };

      xhr.send(null);

    ///////////////////////////////////////

  });


  ///// SHOW RETRY BUTTON AFTER 45S
  var retryTimer = setTimeout(function(){
    removeClass("retry-button", "hide");
  }, 45000);
  
}



//////////// CHANGES CURRENT TRACKLIST / SWITCH PLAYLISTS /////////////////////

function changeActiveTab(activeTab, keep_search, noRefresh) {

  removeClass(settings.activeTab, "active");
  addClass(activeTab, "active");

  if (!keep_search) getById("search").value = ""; // Reset search

  if (!noRefresh && //Cause we only use noRefresh on coverflow update, so we evitate an infinite loop
      settings.coverflow && settings.layout == "coverflow" && 
      settings.activeTab.indexOf('mymusic') == -1 && activeTab.indexOf('mymusic') == -1 &&
      settings.activeTab.split(',')[1] == activeTab.split(',')[1]) {  
    
    try { coverflow('coverflow').to(coverPos(activeTab, true)) } catch (e) {}
    
    noRefresh = true;
  }

  if (settings.activeTab != activeTab) {
    g.selected = null;
    settings.activeTab = activeTab;
    getById("trackList").scrollTop = 0; //If the user scrolled, go back to top
  }

  if (!noRefresh) updateLayout();
}

/////////////////// REFRESH THE TRACKLIST /////////////////////////////

function updateLayout() {
  setTimeout(function(){ // Async so it doesn't block the activetab changing process on loading large lists
    if (settings.layout == 'list' || !settings.coverflow) {

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
      
      if (settings.activeTab.indexOf('mymusic') == -1)
        try { coverflow('coverflow').to(coverPos(settings.activeTab, true)) } catch (e) {};

    }
    updatePlayingIcon();
    conf.set('settings', settings);
  }, 0);
}


//////////// SHOW THE LIST OF TRACKS (TRACKLIST) ///////////////

function createTrackList(initial) {

  if (settings.activeTab == "local,mymusic,all" ||
      settings.activeTab == "googlepm,mymusic,all" ) {

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

  var search = getById("search").value;

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
    addClass("empty_tracklist", "hide");
    removeClass("track_body", "hide");

    getById("track_body").innerHTML = "";

    for (var i = 0; i < trackList.length; i++) {
      var temp = document.createElement('tr');
      temp.setAttribute("index", i);
      temp.setAttribute("id", trackList[i].id);

      temp.setAttribute("oncontextmenu", "trackContextMenu(event, "+i+")");

      temp.setAttribute("onmousedown", "try { if (g.selected != null) document.querySelectorAll(\"[index='\"+g.selected+\"']\")[0].classList.remove('selected')} catch (e) {};g.selected="+i+";this.classList.add('selected');");
      temp.setAttribute("ondblclick", "playByIndex("+i+")");
      temp.innerHTML = "<td>"+trackList[i].title+"</td><td>"+(trackList[i].artist.name == '' ? 'Unknown artist': trackList[i].artist.name)+"</td><td class='albumCol'>"+(trackList[i].album.name == '' && trackList[i].service.indexOf('soundcloud') < 0 ? 'Unknown': trackList[i].album.name)+"</td><td style='width: 30px'>"+msToDuration(trackList[i].duration)+"</td>"
      getById("track_body").appendChild(temp);
    }
  }

}


////// SIMPLE LIST VIEW //////////////

function listView() {
  console.log("listView");
  createTrackList(getListObject(settings.activeTab).tracks);
}

//////// COVERFLOW VIEW ///////////////

function coverFlowView() {
  console.log("coverFlowView")
  updatePlayingIcon();

  g.selected = null;
  coverflowContent = {};
  coverflowItemsTmp = [];

  var currentCat = settings.activeTab.split(',')[1];

  if (currentCat !== 'mymusic') { //If we are dealing with playlists or discover, with want to coverflow with playlists (and not albums)

    for (k of services) {
      if (!settings[k].active || !data[k][currentCat]) continue;

      for (pl of data[k][currentCat]) {
        coverflowItemsTmp.push({id: k+","+currentCat+","+pl.id, title: pl.title, image: (pl.artwork != '' ? pl.artwork : 'file://'+__dirname+'/img/blank_artwork.png'), description: (k == "googlepm" ? "Play Music" : k.capitalize())});
        coverflowContent[k+","+currentCat+","+pl.id] = getListObject(k+","+currentCat+","+pl.id).tracks;
      }
    
    }

    for (z = 0; z < coverflowItemsTmp.length; z++) {

      if (coverflowItemsTmp[z].id == settings.activeTab) 
        createTrackList(coverflowContent[coverflowItemsTmp[z].id]);

    }
  } else { //If we are dealing with albums

    for (y of getListObject(settings.activeTab).tracks) {

      if (!coverPos(y.album.name))
        coverflowItemsTmp.push({title: y.album.name, image: (y.artwork && y.artwork != '' ? y.artwork : 'file://'+__dirname+'/img/blank_artwork.png'), description: y.artist.name});

      if (!coverflowContent[y.album.name]) 
        coverflowContent[y.album.name] = [];
      
      coverflowContent[y.album.name].push(y);

    }

    createTrackList(coverflowContent[coverflowItemsTmp[currentCoverIndex].title]);

  }
  
  if ( JSON.stringify(coverflowItems) == JSON.stringify(coverflowItemsTmp) ) return; // No need to update the coverflow | JSON serialize is a way to compare array of objects

  console.log("Updating covers");
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
    getById("search").value = "";

    if (!coverflowItems[z]) return;

    if (settings.activeTab.indexOf('mymusic') == -1) {

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
  getById("shuffle-btn").classList.add("active");

getById("volume_range").value = settings.volume;
player.elPlayer.volume = settings.volume;