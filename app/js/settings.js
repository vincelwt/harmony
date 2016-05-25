var dialog = require('electron').remote.dialog;

function selectFolder() {
  settings.local.paths = dialog.showOpenDialog({ properties: ['openDirectory']});
  
  if (settings.local.paths == undefined) {
    settings.local.active = false;
    document.getElementById("btn_local2").classList.add("hide");
    document.getElementById("btn_local").classList.remove("hide");
  } else {
    settings.local.active = true;
    document.getElementById("btn_local").classList.add("hide");
    document.getElementById("btn_local2").classList.remove("hide");
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
        document.getElementById("error_soundcloud").classList.remove("hide");
      } else {
        console.log(data);
        settings.soundcloud.refresh_token = data.refresh_token;
        settings.soundcloud.active = true;
        settings.soundcloud.error = false;

        document.getElementById("btn_soundcloud").classList.add("hide");
        document.getElementById("btn_soundcloud2").classList.remove("hide");
        document.getElementById("error_soundcloud").classList.add("hide");
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
        document.getElementById("error_spotify").classList.remove("hide");
      } else {
        console.log(data);
        settings.spotify.refresh_token = data.refresh_token;
        settings.spotify.active = true;
        settings.spotify.error = false;

        document.getElementById("btn_spotify").classList.add("hide");
        document.getElementById("btn_spotify2").classList.remove("hide");
        document.getElementById("error_spotify").classList.add("hide");
        conf.set('settings', settings);
      }
    });
  });
}

function loginGooglepm() {
  settings.googlepm.user = document.getElementById("googlepmUser").value;
  settings.googlepm.passwd = document.getElementById("googlepmPasswd").value;
  settings.googlepm.error = false;
  document.getElementById("btn_googlepm").classList.add("hide");
  document.getElementById("btn_googlepm2").classList.remove("hide");
  document.getElementById("error_googlepm").classList.add("hide");
  document.getElementById("btn_googlepm2").innerHTML = settings.googlepm.user;
  conf.set('settings', settings);
}

function loginLastfm() {
  api.oauthLogin('lastfm', function (code) {
    api.init('lastfm', client_ids.lastfm.client_id, client_ids.lastfm.client_secret);
    api.lastfmGetSession(code, function (error, data) {
      if (error) {
        settings.lastfm.error = true;
        document.getElementById("error_lastfm").classList.remove("hide");
        console.error(error);
      } else {
        parser = new DOMParser();
        xmlDoc = parser.parseFromString(data,"text/xml");

        settings.lastfm.session_key = xmlDoc.getElementsByTagName("key")[0].childNodes[0].nodeValue;
        settings.lastfm.active = true;
        settings.lastfm.error = false;
        document.getElementById("error_lastfm").classList.add("hide");
        conf.set('settings', settings);
      }
    });
  });
}

function resetAll() {
  console.log("Reseting all...");
  data = {};
  settings = {layout: 'list', backgroundNotify: true, repeat: true, shuffle: false, lastfm: {active: false}, spotify: {active: false}, soundcloud: {active: false}, googlepm : {user: '', passwd: '', active: false}, local: {paths:[], active: false}};
  conf.set('settings', settings);
  conf.set('data', data);
}

function logout(service) {
  settings[service].active = false;
  document.getElementById("btn_"+service+"2").classList.add("hide");
  document.getElementById("btn_"+service).classList.remove("hide");
}

settings = conf.get("settings");

for (s of ["soundcloud", "local", "spotify", "googlepm", "lastfm"]) {
  if (settings[s].active && !settings[s].error) {
    document.getElementById("btn_"+s+"2").classList.remove("hide");
    if (s = "local") document.getElementById("btn_"+s+"2").innerHTML = settings.local.paths;
    if (s = "googlepm") document.getElementById("btn_"+s+"2").innerHTML = settings.googlepm.user;
  } else if (settings[s].error) {
    document.getElementById("error_"+s).classList.remove("hide");
    document.getElementById("btn_"+s).classList.remove("hide");
  } else {
    document.getElementById("btn_"+s).classList.remove("hide");
  }
}