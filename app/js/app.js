var api = require("./js/api.js"),
  fs = require('graceful-fs'),
  recursive = require('recursive-readdir'),
  mm = require('musicmetadata')
  glob = require("glob"),
  path = require("path");

var client_ids = null, soundcloud_access_token, spotify_access_token, lastfm_session_key;

var BrowserWindow = require('electron').remote.BrowserWindow;
var Configstore = require('configstore');
var conf = new Configstore("harmony");

var data = settings = g = coverflowContent = {},
	services = coverflowItems = coverflowItemsTmp = trackList = [],
	currentCoverIndex = 0;

var files = glob.sync( './app/js/plugins/*.js' );

for (file of files) {
	serviceId = file.substr(file.lastIndexOf('/')+1).slice(0, -3);
	window[serviceId] = require( path.resolve( file ) );
	services.push(serviceId);
};

console.log("We are on a -"+process.platform+"- system")

if (process.platform == "darwin") { //OSX
	removeClass("title", "hide");
	addClass("header", "osx");
} else if (process.platform == "win32") { //Windows
	addClass("header", "win32");
	addClass("footer", "win32");
	addClass("sidebar", "win32");
}

