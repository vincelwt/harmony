/**
 * Show a given tab on the settings page
 *
 * @param id {string} The tab's ID
 */
function showTab(id) {
	addClass(['services', 'settings'], 'hide');
	removeClass(['services_btn', 'settings_btn'], 'selected');

	removeClass(id, 'hide');
	addClass(id+'_btn', 'selected');
}

/**
 * Login to a given API
 *
 * @param service {Object} The services's API Object
 */
function login(service) {
	window[service].login(err => {

		if (err) {
			console.error(err);

			settings[service].active = false;

			addClass("LoggedBtn_" + service, "hide");
			removeClass(["Btn_" + service, "error_" + service], "hide");

		} else {
			settings[service].active = true;
			settings[service].error = false;

			addClass(["Btn_" + service, "error_" + service], "hide");
			removeClass("LoggedBtn_" + service, "hide");
		}

		conf.set('settings', settings);

	})
}

/**
 * Login to last FM
 *
 * ??? This should really be part of login()
 */
function loginLastfm() {
	api.oauthLogin('lastfm', function(code) {
		api.init('lastfm', data.client_ids.lastfm.client_id, data.client_ids.lastfm.client_secret);
		api.lastfmGetSession(code, function(error, data) {
			if (error) {

				settings.lastfm.error = true;

				removeClass("error_lastfm", "hide");
				return console.error(error);

			}

			parser = new DOMParser();
			xmlDoc = parser.parseFromString(data, "text/xml");

			settings.lastfm.session_key = xmlDoc.getElementsByTagName("key")[0].childNodes[0].nodeValue;
			settings.lastfm.active = true;
			settings.lastfm.error = false;

			addClass(["Btn_lastfm", "error_lastfm"], "hide");
			removeClass("LoggedBtn_lastfm", "hide");

			conf.set('settings', settings);

		});
	});
}

function checkbox(tochange, value) {
	settings[tochange] = !!value;
	conf.set('settings', settings);
}

function dropdown(tochange, value) {
	settings[tochange] = (value);
	conf.set('settings', settings);
}

/**
 * Reset all settings
 */
function resetAll() {
	console.log("Reseting all...");
	data = {};
	settings = {
		volume: 1,
		notifOff: false,
		tray: false,
		coverflow: false,
		refreshOnStart: false,
		enableCoverflow: false,
		repeat: true,
		shuffle: false,
		lastfm: {
			active: false
		}
	};
	conf.set('settings', settings);
	conf.set('data', data);
	updateBtns();
}

/**
 * Logout of a given service
 *
 * @param service {Object} The services's API Object
 */
function logout(service) {
	settings[service].active = false;

	addClass("LoggedBtn_" + service, "hide");
	removeClass("Btn_" + service, "hide");

	conf.set('settings', settings);
}

function updateBtns() {
	for (s of services) {
		getById("tempServices").innerHTML += window[s].loginBtnHtml;
		getById("tempStyles").innerHTML += window[s].loginBtnCss;
	}

	for (s of services.concat(["lastfm"])) {

		if (!settings[s]) settings[s] = window[s].login;

		if (settings[s].active && !settings[s].error) {

			removeClass("LoggedBtn_" + s, "hide");
			addClass("Btn_" + s, "hide");
			if (s = "googlepm") getById("LoggedBtn_" + s).innerHTML = settings[s].user;
			if (s = "hypemachine") getById("LoggedBtn_" + s).innerHTML = settings[s].user;
			if (s = "local") getById("LoggedBtn_" + s).innerHTML = settings[s].paths;

		} else if (settings[s].error) {
			removeClass(["error_" + s, "Btn_" + s], "hide");
			addClass("LoggedBtn_" + s, "hide");
		} else {
			removeClass("Btn_" + s, "hide");
			addClass("LoggedBtn_" + s, "hide");
		}
	}

	if (settings.tray) {
		removeClass("trayIconSettings","hide")
	} else {
		addClass("trayIconSettings","hide")
	}

	getById("coverflow").checked = settings.enableCoverflow;
	getById("notifOff").checked = settings.notifOff;
	getById("dark").checked = settings.dark;
	getById("refreshOnStart").checked = settings.refreshOnStart;
	getById("tray").checked = settings.tray;
	getById("trayIconStyle").value = settings.trayIconStyle;

}

settings = conf.get("settings");
updateBtns();