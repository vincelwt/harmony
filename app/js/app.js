const api = require("./js/api.js");
const fs = require('graceful-fs');
const recursive = require('recursive-readdir');
const mm = require('musicmetadata');
const glob = require("glob");
const path = require("path");

const BrowserWindow = require('electron').remote.BrowserWindow;
const Configstore = require('configstore');
const conf = new Configstore("harmony");

let client_ids = null;
let soundcloud_access_token = null;
let spotify_access_token = null;
let lastfm_session_key = null;

let data = settings = g = coverflowContent = {};
let services = coverflowItems = coverflowItemsTmp = trackList = [];
let currentCoverIndex = 0;
let sortKey = 'none';

const files = glob.sync( __dirname+'/js/plugins/*.js' );

for (let file of files) {
	const serviceId = file.substr(file.lastIndexOf('/')+1).slice(0, -3);
	window[serviceId] = require( path.resolve( file ) );
	services.push(serviceId);
}

console.log("We are on a -"+process.platform+"- system");

if (process.platform == "darwin") { //OSX
	removeClass("title", "hide");
	addClass("header", "osx");
} else if (process.platform == "win32") { //Windows
	addClass("header", "win32");
	addClass("sidebar", "win32");
}

