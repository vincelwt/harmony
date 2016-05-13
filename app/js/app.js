var PlayMusic = require('playmusic'),
  pm = new PlayMusic(),
  api = require("./js/api.js"),
  fs = require('fs');

var client_ids = null, soundcloud_access_token, spotify_access_token, lastfm_session_key;

var BrowserWindow = require('electron').remote.BrowserWindow;
var Configstore = require('configstore');
var conf = new Configstore("harmony");
 
angular.module('harmony',['cfp.hotkeys', 'sly', 'ui.bootstrap.contextMenu']);