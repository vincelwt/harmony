angular.module('harmony').controller('MainController', function($filter, $rootScope, $scope, hotkeys) {
    hotkeys.add({
      combo: 'down',
      callback : function(event, hotkey) {
        if ($scope.selected != null) {
          var nextTrack = getNextTrack($scope.data[$scope.activeTab], $scope.selected);
          if (nextTrack !== null ) {
              $scope.selected = nextTrack.id;
          }
          event.preventDefault();
        }
      }
    });

    hotkeys.add({
      combo: 'up',
      callback : function(event, hotkey) {
        if ($scope.selected != null) {
          var prevTrack = getPrevTrack($scope.data[$scope.activeTab], $scope.selected);
          if (prevTrack !== null ) {
              $scope.selected = prevTrack.id;
          }
          event.preventDefault();
        }
      }
    });

    hotkeys.add({
      combo: 'enter',
      callback : function(event, hotkey) {
        if ($scope.selected != null) {
          $scope.playTrack(getTrackObject($scope.data[$scope.activeTab], $scope.selected));
          event.preventDefault();
        }
      }
    });

    hotkeys.add({
      combo: 'mod+f',
      description: 'Search',
      callback : function(event, hotkey) {
        document.getElementById("search").focus();
      }
    });

    $rootScope.getData = function() {
      if (conf.get("settings") == undefined || conf.get("data") == undefined) {
        console.log("First time");
        $scope.data = {};
        $scope.settings = {lastfm: {active: false}, spotify: {active: false}, soundcloud: {active: false}, GooglePm : {user: '', passwd: '', active: false}, local: {paths:[], active: false}};
        conf.set('settings', $scope.settings);
        conf.set('data', $scope.data);
        $scope.activeTab = 'settings'
        $scope.loading.discret = false;
        return;
      } else {
        $scope.settings = conf.get("settings");
        $scope.data = conf.get("data");

        $scope.settings.GooglePm.active = $scope.settings.GooglePm.user;

        if ($scope.settings.activeTab) {
          $scope.activeTab = $scope.settings.activeTab;
        } else if ($scope.settings.soundcloud.active) {
          $scope.activeTab = 'soundcloud';
          $scope.activeTab = 'soundcloudStream';
        } else if ($scope.settings.GooglePm.active) {
          $scope.activeTab = 'GooglePm';
          $scope.activeTab = 'GooglePmAll';
        } else if ($scope.settings.local.active) {
          $scope.activeTab = 'local';
          $scope.activeTab = 'localAll';
        } else {
          $scope.activeTab = 'settings'
          return;
        }

        $scope.loading.discret = true;
      }

      $scope.loading.GooglePm = true;
      $scope.loading.soundcloud = true;
      $scope.loading.spotify = true;
      $scope.loading.local = true;

      $scope.loading.state = true;

      console.log("Getting data");

      testInternet.then(function() {

        if ($scope.settings.lastfm.active) {
          api.init('lastfm', client_ids.lastfm.client_id, client_ids.lastfm.client_secret);
        }

        if ($scope.settings.soundcloud.active) {
          console.log("From soundcloud...");
          if ($scope.settings.soundcloud.refresh_token) {
            api.init('soundcloud', client_ids.soundcloud.client_id, client_ids.soundcloud.client_secret);
            api.refreshToken('soundcloud', $scope.settings.soundcloud.refresh_token, function(error, data){
              if (error) {
                console.log("Error logging with soundcloud");
                $scope.$apply(function(){  $scope.loading.state = false });  
                $scope.activeTab = "settings";
                $scope.settings.soundcloud.error = true;
                return
              } else {
                $scope.settings.soundcloud.refresh_token = data.refresh_token;
                $rootScope.saveSettings();
                soundcloud_access_token = data.access_token;
                $scope.settings.soundcloud.error = false;

                 api.get('soundcloud', '/me/activities', soundcloud_access_token, {limit : 200}, function(err, result) {
                  console.log("Activity");
                  if (err) console.error("Error fetching the feed : "+err);

                  $scope.data.soundcloudStream = [];
                  for (i of result.collection) {
                    if (i.origin !== null && typeof i.origin.stream_url != "undefined" && i.origin !== null && (i.type == "track" || i.type == "track-sharing" || i.type == "track-repost")) {
                      $scope.data.soundcloudStream.push({'service': 'soundcloud', 'source': 'soundcloudStream', 'title': removeFreeDL(i.origin.title), 'artist': i.origin.user.username, 'id': i.origin.id, 'stream_url': i.origin.stream_url, 'duration': i.origin.duration, 'artwork': i.origin.artwork_url});
                    }
                  }

                  api.get('soundcloud', '/me/favorites', soundcloud_access_token, {limit : 200}, function(err, result) {

                    console.log("Favorites");

                    if (err) console.error("Error fetching the favorites : "+err); 
               
                    $scope.data.soundcloudFavs = [];
                    for (i of result) {
                      if (typeof i.stream_url != "undefined") {
                        $scope.data.soundcloudFavs.push({'service': 'soundcloud', 'source': 'soundcloudFavs','title': removeFreeDL(i.title), 'artist': i.user.username, 'id': i.id, 'stream_url': i.stream_url, 'duration': i.duration, 'artwork': i.artwork_url});
                      }
                    }

                    $scope.data.soundcloudAll = $scope.data.soundcloudStream.concat($scope.data.soundcloudFavs); //useful for search

                    api.get('soundcloud', '/me/playlists', soundcloud_access_token, {limit : 200}, function(err, result) {
                      console.log("Playlists");
                      $scope.data.soundcloudPlaylists = [];
                      if (err) console.error("Error fetching the playlists: "+err); 

                      for (i of result) {
                        $scope.data.soundcloudPlaylists.push({'title': i.title, 'id': i.id});
                        $scope.data['soundcloudPlaylist'+i.id] = [];
                        for (t of i.tracks) {
                          if (typeof t.stream_url != "undefined") {
                            $scope.data['soundcloudPlaylist'+i.id].push({'service': 'soundcloud', 'source': 'soundcloudPlaylist'+i.id,'title': removeFreeDL(t.title), 'artist': t.user.username, 'id': t.id, 'stream_url': t.stream_url, 'duration': t.duration, 'artwork': t.artwork_url})
                          }
                        }

                        $scope.data.soundcloudAll = $scope.data.soundcloudAll.concat($scope.data['soundcloudPlaylist'+i.id]);

                      }

                      $scope.$apply(function(){$scope.loading.soundcloud = false}); 

                    }); 

                  });
                });

              }
            })
          } else {
            $scope.loading.state = false;
            $scope.activeTab = "settings";
            $scope.settings.soundcloud.error = true;
            return
          }
        }


        if ($scope.settings.spotify.active) {
          console.log("From spotify...");
          if ($scope.settings.spotify.refresh_token) {

            api.init('spotify', client_ids.spotify.client_id, client_ids.spotify.client_secret);
            api.refreshToken('spotify', $scope.settings.spotify.refresh_token, function(error, data){
              if (error) {
                console.log("Error logging with spotify");
                $scope.$apply(function(){  $scope.loading.state = false });  
                $scope.activeTab = "settings";
                $scope.settings.spotify.error = true;
                return
              } else {
                $scope.settings.spotify.refresh_token = data.refresh_token;
                $rootScope.saveSettings();
                spotify_access_token = data.access_token;
                $scope.settings.spotify.error = false;

                 api.get('spotify', '/v1/me/tracks', spotify_access_token, {}, function(err, result) {
                  console.log(error);
                  console.log(result);
                  $scope.$apply(function(){$scope.loading.spotify = false}); 
                 });

              }
            })
          } else {
            $scope.loading.state = false;
            $scope.activeTab = "settings";
            $scope.settings.spotify.error = true;
            return
          }
        }

        if ($scope.settings.GooglePm.active) {
          console.log("From GooglePm...");
          pm.init({email: $scope.settings.GooglePm.user, password: $scope.settings.GooglePm.passwd}, function(err, res) {
            if (err) { 
              console.error("Error with Google Play Music : "+err);
              $scope.$apply(function(){  $scope.loading.state = false });  
              $scope.activeTab = "settings";
              $scope.settings.GooglePm.error = true;
            } else { $scope.settings.GooglePm.error = false }

            pm.getAllTracks(function(err, library) {
              if(err) console.error("Error with Google Play Music : "+err);

              $scope.data.GooglePmAll = [];
              $scope.data.GooglePmFavs = [];

              for (i of library.data.items) { 
                if (i.albumArtRef === undefined) { i.albumArtRef = [{'url': ""}] };
                $scope.data.GooglePmAll.push({'service': 'GooglePm', 'source': 'GooglePmAll','title': i.title, 'artist': i.artist, 'album':i.album, 'id': i.id, 'duration': i.durationMillis, 'artwork': i.albumArtRef[0].url});
                if (i.rating == 5) {
                  $scope.data.GooglePmFavs.push({'service': 'GooglePm', 'source': 'GooglePmFavs','title': i.title, 'artist': i.artist, 'album':i.album, 'id': i.id, 'duration': i.durationMillis, 'artwork': i.albumArtRef[0].url});
                }
              }

              pm.getPlayLists(function(err, playlists_data) {
                  $scope.data.GooglePmPlaylists = [];
                  pm.getPlayListEntries(function(err, playlists_entries_data) {
                      for (i of playlists_data.data.items) {
                        $scope.data.GooglePmPlaylists.push({'title': i.name, 'id': i.id});
                        $scope.data['GooglePmPlaylist'+i.id] = [];
                      }

                      for (t of playlists_entries_data.data.items) {
                        var track_object = getTrackObject($scope.data.GooglePmAll, t.trackId);
                        if (track_object) {
                          track_object.source = 'GooglePmPlaylist'+t.playlistId;
                          $scope.data['GooglePmPlaylist'+t.playlistId].push(track_object);
                    	  }
                      }
                      
                    $scope.$apply(function(){$scope.loading.GooglePm = false}); 
                  });
              });
            });
          });
        
        }

      }, function(reason) {
        console.log("Error with internet.")
        $scope.offline = true;
        $scope.activeTab = "localAll";
        $scope.loading.state = false;
        return;
      });


      if ($scope.settings.local.active) {
        $scope.loading.local = true; 
        console.log("From local...");
        if (conf.get("localFavs") == undefined) {
          $scope.data.localFavs = [];
          conf.set("localFavs", $scope.data.localFavs);
        } else {
          $scope.data.localFavs = conf.get("localFavs");
        } 

        $scope.data.localAll = [];

        for (i of $scope.settings.local.paths) {
          recursive(i, function (err, files) {
            for (h of files) {
              if (h.substr(h.length - 3) == "mp3") {
                !function outer(h){
                    mm(fs.createReadStream(h),{ duration: true }, function (err, metadata) {
                      if (err) throw err;
                      var id = new Buffer(h).toString('base64');
                      $scope.$apply(function(){$scope.data.localAll.push({'service': 'local', 'source': 'localAll','title': metadata.title, 'artist': metadata.artist[0], 'album': metadata.album, 'id': id, 'duration': metadata.duration*1000, 'artwork': null, 'stream_url': 'file://'+h})});
                    });
                }(h);
              }
            }

            $scope.$apply(function(){$scope.loading.local = false}); 
            
          });
        }
      }

      $scope.$watch('loading', function(){
        var t = $scope.loading;
        if (($scope.settings.spotify.active && t.spotify ) || ($scope.settings.soundcloud.active && t.soundcloud )|| ($scope.settings.GooglePm.active && t.GooglePm) || ($scope.settings.local.active && t.local)) {
          return;
        }

        conf.set('data', $scope.data);

        $scope.loading.state = false;
      }, true);
      
    }

    $scope.trackList = function() { return $scope.data[$scope.activeTab] }

    $scope.setSearchActiveTab = function() {
      if ($scope.search.length > 1) {
        $scope.loading.state = true;
        $scope.searchResult = [];
        $scope.oldActiveTab = $scope.activeTab;
        $scope.activeTab = 'searchResult';
        if ($scope.settings.soundcloud.active) $scope.searchResult = $scope.searchResult.concat($filter('filter')($scope.data.soundcloudAll, $scope.search));
        if ($scope.settings.GooglePm.active) $scope.searchResult = $scope.searchResult.concat($filter('filter')($scope.data.GooglePmAll, $scope.search));
        if ($scope.settings.local.active) $scope.searchResult = $scope.searchResult.concat($filter('filter')($scope.localAll, $scope.search));
        for (i = 0; i < $scope.searchResult.length; i++) { 
          $scope.searchResult[i].source = 'searchResult';
          for (t = 0; t < $scope.searchResult.length; t++) { //Remove duplicates
            if (i !== t && $scope.searchResult[i].id === $scope.searchResult[t].id) $scope.searchResult.splice(t, 1);
          }
        }
        $scope.loading = false;

      } else if ($scope.search.length < 1) {
        $scope.activeTab = $scope.oldActiveTab;
      }
    }

    $scope.$watch('activeTab', function() {
      if ($scope.activeTab != "settings") {
        $scope.settings.activeTab = $scope.activeTab;
        conf.set('settings', $scope.settings);
      }
    });

    /////////////////////////////////////////////
    // When we start
    /////////////////////////////////////////////

    $scope.selected = null;
    $scope.sidebar = false;
    $scope.sidebar = true; // We place it here so we animate it once (the first time it lags) 
    
    $scope.loading = {state: false};
    $rootScope.getData();
})


/**
 *  Helpers
 */

.filter('millSecToDuration', function() {
  return function(ms) {
    var seconds = Math.floor(ms / 1000);
    var minutes = Math.floor(seconds / 60);
    var seconds = seconds - (minutes * 60);
    if (seconds.toString().length == 1) seconds = '0'+seconds;
    var format = minutes + ':' + seconds
    return format;
  }
});