var dialog = require('electron').remote.dialog;

function login(service) {
  window[service].login(function(err) {

    if (err) {
      console.error(err);

      settings[service].active = false;

      addClass("btn_"+service+"2", "hide");
      removeClass("btn_"+service, "hide");
      removeClass("error_"+service, "hide");

    } else {
      settings[service].active = true;

      addClass("btn_"+service, "hide");
      addClass("error_"+service, "hide");
      removeClass("btn_"+service+"2", "hide");

    }

    conf.set('settings', settings);

  })
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
  settings.coverflow = (value ? true : false);
  conf.set('settings', settings);
}

function notifOff(value) {
  settings.notifOff = (value ? true : false);
  conf.set('settings', settings);
}


function resetAll() {
  console.log("Reseting all...");
  data = {};
  settings = {volume: 1, notifOff: false, coverflow: false, layout: 'list', repeat: true, shuffle: false, lastfm: {active: false}, spotify: {active: false}, soundcloud: {active: false}, googlepm : {user: '', passwd: '', active: false}, local: {paths:[], active: false}};
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

  for (s of services.concat(["lastfm"])) {
    if (settings[s].active && !settings[s].error) {
      removeClass("btn_"+s+"2", "hide");
      addClass("btn_"+s, "hide");
      if (s = "local") getById("btn_"+s+"2").innerHTML = settings.local.paths;
      if (s = "googlepm") getById("btn_"+s+"2").innerHTML = settings.googlepm.user;
    } else if (settings[s].error) {
      removeClass("error_"+s, "hide");
      removeClass("btn_"+s, "hide");
      addClass("btn_"+s+"2", "hide");
    } else {
      removeClass("btn_"+s, "hide");
      addClass("btn_"+s+"2", "hide");
    }
  }
    
  getById("coverflow").checked = (settings.coverflow ? true : false);
  getById("notifOff").checked = (settings.notifOff ? true : false);
  
}

function addBtns() {
  for (s of services)
    getById("tempServices").innerHTML += window[s].loginBtnHtml;
}

addBtns();

updateBtns();
