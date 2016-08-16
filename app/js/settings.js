var dialog = require('electron').remote.dialog;

function selectFolder() {
  settings.local.paths = dialog.showOpenDialog({ properties: ['openDirectory']});
  
  if (settings.local.paths == undefined) {
    settings.local.active = false;
    addClass("btn_local2", "hide");
    removeClass("btn_local", "hide");
  } else {

    settings.local.active = true;

    addClass("btn_local", "hide");
    removeClass("btn_local2", "hide");

    document.getElementById("btn_local2").innerHTML = settings.local.paths;
  }

  conf.set('settings', settings);
}

function loginSoundcloud() {
  api.oauthLogin('soundcloud', function (code) {
    api.init('soundcloud', client_ids.soundcloud.client_id, client_ids.soundcloud.client_secret);
    api.auth('soundcloud', code, function (error, data) {
      if (error || data.error) {
        console.error(error +" + "+data.error);
        settings.soundcloud.error = true;

        removeClass("error_soundcloud", "hide");
      } else {

        settings.soundcloud.refresh_token = data.refresh_token;
        settings.soundcloud.active = true;
        settings.soundcloud.error = false;

        addClass("btn_soundcloud", "hide");
        addClass("error_soundcloud", "hide");
        removeClass("btn_soundcloud2", "hide");

        conf.set('settings', settings);
      }
    });
  });
}

function loginSpotify() {
  api.oauthLogin('spotify', function (code) {
    api.init('spotify', client_ids.spotify.client_id, client_ids.spotify.client_secret);
    api.auth('spotify', code, function (error, data) {
      if (error || data.error) {

        console.error(error +" + "+data.error);
        settings.spotify.error = true;

        removeClass("error_spotify", "hide");

      } else {

        settings.spotify.refresh_token = data.refresh_token;
        settings.spotify.active = true;
        settings.spotify.error = false;

        addClass("btn_spotify", "hide");
        addClass("error_spotify", "hide");
        removeClass("btn_spotify2", "hide");

        conf.set('settings', settings);
      }
    });
  });
}

function loginGooglepm() {
  settings.googlepm.user = document.getElementById("googlepmUser").value;
  settings.googlepm.passwd = document.getElementById("googlepmPasswd").value;
  
  if (!settings.googlepm.user || !settings.googlepm.passwd ) return;

  settings.googlepm.error = false;
  settings.googlepm.active = true;

  addClass("btn_googlepm", "hide");
  addClass("error_googlepm", "hide");
  removeClass("btn_googlepm2", "hide");

  document.getElementById("btn_googlepm2").innerHTML = settings.googlepm.user;
  conf.set('settings', settings);
}

function loginLastfm() {
  api.oauthLogin('lastfm', function (code) {
    api.init('lastfm', client_ids.lastfm.client_id, client_ids.lastfm.client_secret);
    api.lastfmGetSession(code, function (error, data) {
      if (error) {

        settings.lastfm.error = true;

        removeClass("error_lastfm", "hide");
        console.error(error);

      } else {
        parser = new DOMParser();
        xmlDoc = parser.parseFromString(data,"text/xml");

        settings.lastfm.session_key = xmlDoc.getElementsByTagName("key")[0].childNodes[0].nodeValue;
        settings.lastfm.active = true;
        settings.lastfm.error = false;

        addClass("btn_lastfm", "hide");
        addClass("error_lastfm", "hide");
        removeClass("btn_lastfm2", "hide");

        conf.set('settings', settings);
      }
    });
  });
}

function coverflow(value) {
  if (value)
    settings.coverflow = true;
  else
    settings.coverflow = false;

  conf.set('settings', settings);
}

function resetAll() {
  console.log("Reseting all...");
  data = {};
  settings = {volume: 1, coverflow: false, layout: 'list', backgroundNotify: true, repeat: true, shuffle: false, lastfm: {active: false}, spotify: {active: false}, soundcloud: {active: false}, googlepm : {user: '', passwd: '', active: false}, local: {paths:[], active: false}};
  conf.set('settings', settings);
  conf.set('data', data);
  updateBtns();
}

function logout(service) {
  settings[service].active = false;

  addClass("btn_"+service+"2", "hide");
  removeClass("btn_"+service, "hide");

  conf.set('settings', settings);
}

settings = conf.get("settings");

function updateBtns() {

  for (s of ["soundcloud", "local", "spotify", "googlepm", "lastfm"]) {
    if (settings[s].active && !settings[s].error) {
      removeClass("btn_"+s+"2", "hide");
      addClass("btn_"+s, "hide");
      if (s = "local") document.getElementById("btn_"+s+"2").innerHTML = settings.local.paths;
      if (s = "googlepm") document.getElementById("btn_"+s+"2").innerHTML = settings.googlepm.user;
    } else if (settings[s].error) {
      removeClass("error_"+s, "hide");
      removeClass("btn_"+s, "hide");
      addClass("btn_"+s+"2", "hide");
    } else {
      removeClass("btn_"+s, "hide");
      addClass("btn_"+s+"2", "hide");
    }
  }

  if (settings.coverflow)
    document.getElementById("coverflow").checked = true;
  else
    document.getElementById("coverflow").checked = false;
  
}

updateBtns();