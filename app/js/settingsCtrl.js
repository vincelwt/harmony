var dialog = require('remote').require('dialog');

angular.module('harmony').controller('SettingsController', function($scope) {

    $scope.selectFolder = function() {
      $scope.settings.local.paths = dialog.showOpenDialog({ properties: ['openDirectory']});
      $scope.settings.local.active = true;
      conf.set('settings', $scope.settings);
    }

    $scope.loginSoundcloud = function() {
      api.oauthLogin('soundcloud', function (code) {
        api.init('soundcloud', client_ids.soundcloud.client_id, client_ids.soundcloud.client_secret);
        api.auth('soundcloud', code, function (error, data) {
          if (error || data.error) {
            console.error(error +" + "+data.error);
            $scope.settings.soundcloud.error = true;
          } else {
            console.log(data);
            $scope.settings.soundcloud.refresh_token = data.refresh_token;
            $scope.settings.soundcloud.active = true;
            $scope.settings.soundcloud.error = false;
            $scope.$apply();
            conf.set('settings', $scope.settings);
          }
        });
      });
    }

    $scope.loginSpotify = function() {
      api.oauthLogin('spotify', function (code) {
        api.init('spotify', client_ids.spotify.client_id, client_ids.spotify.client_secret);
        api.auth('spotify', code, function (error, data) {
          if (error || data.error) {
            console.error(error +" + "+data.error);
            $scope.settings.spotify.error = true;
          } else {
            console.log(data);
            $scope.settings.spotify.refresh_token = data.refresh_token;
            $scope.settings.spotify.active = true;
            $scope.settings.spotify.error = false;
            $scope.$apply();
            conf.set('settings', $scope.settings);
          }
        });
      });
    }

    $scope.loginGooglepm = function() {
      conf.set('settings', $scope.settings);
    }

    $scope.loginLastfm = function() {
      api.oauthLogin('lastfm', function (code) {
        api.init('lastfm', client_ids.lastfm.client_id, client_ids.lastfm.client_secret);
        api.lastfmGetSession(code, function (error, data) {
          if (error) {
            $scope.settings.lastfm.error = true;
            console.error(error);
          } else {
            parser = new DOMParser();
            xmlDoc = parser.parseFromString(data,"text/xml");

            $scope.settings.lastfm.session_key = xmlDoc.getElementsByTagName("key")[0].childNodes[0].nodeValue;
            $scope.settings.lastfm.active = true;
            $scope.settings.lastfm.error = false;
            $scope.$apply()
            conf.set('settings', $scope.settings);
          }
        });
      });
    }

    $scope.resetAll = function() {
      console.log("Reseting all...");
      $scope.data = {};
      $scope.settings = {layout: 'list', backgroundNotify: true, repeat: true, shuffle: false, lastfm: {active: false}, spotify: {active: false}, soundcloud: {active: false}, googlepm : {user: '', passwd: '', active: false}, local: {paths:[], active: false}};
      conf.set('settings', $scope.settings);
      conf.set('data', $scope.data);
    }

    $scope.settings = conf.get("settings");
})