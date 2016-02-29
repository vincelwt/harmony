angular.module('harmony').controller('SettingsController', function($rootScope, $scope) {
    $scope.selectFolder = function() {
      $scope.settings.local.paths = dialog.showOpenDialog({ properties: ['openDirectory', 'multiSelections']});
    }

    $scope.loginSoundcloud = function() {
      if (client_ids == null) {
        testInternet.then(function() {
          // Success!
        }, function(reason) {
          console.log(reason); // Error!
          alert("Error connecting to internet !")
          return
        });
      }
      
      var authWindow = new BrowserWindow({ width: 400, height: 500, show: false, 'node-integration': false });
      var authUrl = 'https://soundcloud.com/connect?' + 'client_id=' + client_ids.soundcloud.client_id + '&redirect_uri=http://localhost&response_type=code&display=popup';
      authWindow.setMenu(null);
      authWindow.loadUrl(authUrl);
      authWindow.show();

      function handleCallback (url) {
        var code = getParameterByName('code', url);
        var error = getParameterByName('error', url);

        if (code || error) authWindow.destroy();

        if (code) {
          console.log(code);
          
          api.init('soundcloud', client_ids.soundcloud.client_id, client_ids.soundcloud.client_secret);
          api.auth('soundcloud', code, function (error, data) {
            if(error || data.error) {
              console.error(error +" + "+data.error);
            } else {
              console.log(data);
              $scope.settings.soundcloud.refresh_token = data.refresh_token;
              conf.set('settings', $scope.settings);
            }
          });
        } else if (error) {
          console.log(error);
          alert('Oops! Something went wrong and we couldn\'t' +
            'log you in using Soundcloud. Please try again.');
        }
      }

      authWindow.webContents.on('will-navigate', function (event, url) {
        console.log(url);
        if (getHostname(url) == 'localhost') handleCallback(url);
      });

      authWindow.webContents.on('did-get-redirect-request', function (event, oldUrl, newUrl) { 
        console.log(newUrl);
        if (getHostname(newUrl) == 'localhost') handleCallback(newUrl);
      });
      authWindow.on('close', function() { authWindow = null }, false);
    }

    $scope.loginLastfm = function() {
      if (client_ids == null) {
        testInternet.then(function() {
          // Success!
        }, function(reason) {
          console.log(reason); // Error!
          alert("Error connecting to internet !")
          return
        });
      }
      
      var authWindow = new BrowserWindow({ width: 400, height: 500, show: false, 'node-integration': false });
      var authUrl = 'http://www.last.fm/api/auth/?api_key=' + client_ids.lastfm.client_id;
      authWindow.setMenu(null);
      authWindow.loadUrl(authUrl);
      authWindow.show();

      function handleCallback (url) {
        var code = getParameterByName('token', url);
        var error = getParameterByName('error', url);

        if (code || error) authWindow.destroy();

        if (code) {
          console.log(code);
          
          api.init('lastfm', client_ids.lastfm.client_id, client_ids.lastfm.client_secret);
          api.lastfmGetSession(code, function (error, data) {
            if (error) {
              $scope.settings.lastfm.error = true;
              console.error(error);
            } else {
              parser = new DOMParser();
              xmlDoc = parser.parseFromString(data,"text/xml");

              $scope.settings.lastfm.session_key = xmlDoc.getElementsByTagName("key")[0].childNodes[0].nodeValue;
              conf.set('settings', $scope.settings);
            }
          });
        } else if (error) {
          console.log(error);
          alert('Oops! Something went wrong and we couldn\'t' +
            'log you in using Last.fm. Please try again.');
        }
      }

      authWindow.webContents.on('will-navigate', function (event, url) {
        console.log(url);
        if (getHostname(url) == 'localhost') handleCallback(url);
      });

      authWindow.webContents.on('did-get-redirect-request', function (event, oldUrl, newUrl) { 
        console.log(newUrl);
        if (getHostname(newUrl) == 'localhost') handleCallback(newUrl);
      });
      authWindow.on('close', function() { authWindow = null }, false);
    }

    $scope.loginSpotify = function() {
      if (client_ids == null) {
        testInternet.then(function() {
          // Success!
        }, function(reason) {
          console.log(reason); // Error!
          alert("Error connecting to internet !")
          return
        });
      }

      var authWindow = new BrowserWindow({ width: 400, height: 500, show: false, 'node-integration': false });
      var authUrl = 'https://accounts.spotify.com/authorize?' + 'client_id=' + client_ids.spotify.client_id + '&redirect_uri=http://localhost&response_type=code&scope=user-library-read';
      authWindow.setMenu(null);
      authWindow.loadUrl(authUrl);
      authWindow.show();

      function handleCallback (url) {
        var code = getParameterByName('code', url);
        var error = getParameterByName('error', url);

        if (code || error) authWindow.destroy();

        if (code) {
          console.log(code);

          api.init('spotify', client_ids.spotify.client_id, client_ids.spotify.client_secret);
          api.auth('spotify', code, function (error, data) {
            if(error) {
              console.error(error);
            } else  {
              console.log(data); 
              $scope.settings.spotify.refresh_token = data.refresh_token;
              conf.set('settings', $scope.settings);
            }
          });

        }
      }

      authWindow.webContents.on('will-navigate', function (event, url) {
        if (getHostname(url) == 'localhost') handleCallback(url);
      });
      authWindow.webContents.on('did-get-redirect-request', function (event, oldUrl, newUrl) { 
        console.log(newUrl);
        if (getHostname(newUrl) == 'localhost') handleCallback(newUrl);
      });
      authWindow.on('close', function() { authWindow = null }, false);
    }

    $rootScope.saveSettings = function() {
      conf.set('settings', $scope.settings);
    }
})