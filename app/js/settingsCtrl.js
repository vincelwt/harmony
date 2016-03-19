angular.module('harmony').controller('SettingsController', function($rootScope, $scope) {
    $scope.selectFolder = function() {
      $scope.settings.local.paths = dialog.showOpenDialog({ properties: ['openDirectory']});
      $scope.settings.lastfm.active = true;
      conf.set('settings', $scope.settings);
    }

    $scope.loginSoundcloud = function() {
      api.oauthLogin('soundcloud', function (code) {
        api.init('soundcloud', client_ids.soundcloud.client_id, client_ids.soundcloud.client_secret);
        api.auth('soundcloud', code, function (error, data) {
          if (error || data.error) {
            console.error(error +" + "+data.error);
          } else {
            console.log(data);
            $scope.settings.soundcloud.refresh_token = data.refresh_token;
            $scope.settings.soundcloud.active = true;
            conf.set('settings', $scope.settings);
          }
        });
      });
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

            conf.set('settings', $scope.settings);
          }
        });
      });
    }

    $scope.loginSpotify = function() {
      api.oauthLogin('spotify', function (code) {
        api.init('spotify', client_ids.spotify.client_id, client_ids.spotify.client_secret);
        api.auth('spotify', code, function (error, data) {
          if(error) {
            console.error(error);
          } else  {
            console.log(data); 
            $scope.settings.spotify.refresh_token = data.refresh_token;
            $scope.settings.spotify.active = true;

            conf.set('settings', $scope.settings);
          }
        });
      });
    }

    $rootScope.saveSettings = function() {
      conf.set('settings', $scope.settings);
    }
})