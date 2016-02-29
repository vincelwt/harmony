angular.module('harmony').controller('MainController', function($filter, $rootScope, $scope, hotkeys) {
    hotkeys.add({
      combo: 'down',
      callback : function(event, hotkey) {
        if ($scope.selected != null) {
          var nextTrack = getNextTrack($scope[$scope.activeTab], $scope.selected);
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
          var prevTrack = getPrevTrack($scope[$scope.activeTab], $scope.selected);
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
          $scope.playTrack(getTrackObject($scope[$scope.activeTab], $scope.selected));
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
      if (conf.get("settings") == undefined) {
        $scope.settings = {lastfm: {active: false}, spotify: {active: false}, soundcloud: {active: false}, GooglePm : {user: '', passwd: '', active: false}, local: {paths:[], active: false}};
        conf.set('settings', $scope.settings);
        $scope.activeTab = 'settings'
        return;
      } else {
        $scope.settings = conf.get("settings");
      }
      
      if ($scope.settings.soundcloud.active) {
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

      $scope.loading.state = true;
      console.log("Getting data");

      testInternet.then(function() {
        $scope.errorConnection = false;

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
                conf.set('settings', $scope.settings);
                soundcloud_access_token = data.access_token;
                $scope.settings.soundcloud.error = false;

                 api.get('soundcloud', '/me/activities', soundcloud_access_token, {limit : 200}, function(err, result) {
                  console.log("Activity");
                  if (err) console.error("Error fetching the feed : "+err);

                  $scope.soundcloudStream = [];
                  for (i of result.collection) {
                    if (i.origin !== null && typeof i.origin.stream_url != "undefined" && i.origin !== null && (i.type == "track" || i.type == "track-sharing" || i.type == "track-repost")) {
                      $scope.soundcloudStream.push({'service': 'soundcloud', 'source': 'soundcloudStream', 'title': removeFreeDL(i.origin.title), 'artist': i.origin.user.username, 'id': i.origin.id, 'stream_url': i.origin.stream_url, 'duration': i.origin.duration, 'artwork': i.origin.artwork_url});
                    }
                  }

                  api.get('soundcloud', '/me/favorites', soundcloud_access_token, {limit : 200}, function(err, result) {

                    console.log("Favorites");

                    if (err) console.error("Error fetching the favorites : "+err); 
               
                    $scope.soundcloudFavs = [];
                    for (i of result) {
                      if (typeof i.stream_url != "undefined") {
                        $scope.soundcloudFavs.push({'service': 'soundcloud', 'source': 'soundcloudFavs','title': removeFreeDL(i.title), 'artist': i.user.username, 'id': i.id, 'stream_url': i.stream_url, 'duration': i.duration, 'artwork': i.artwork_url});
                      }
                    }

                    $scope.soundcloudAll = $scope.soundcloudStream.concat($scope.soundcloudFavs); //useful for search

                    api.get('soundcloud', '/me/playlists', soundcloud_access_token, {limit : 200}, function(err, result) {
                      console.log("Playlists");
                      $scope.soundcloudPlaylists = [];
                      if (err) console.error("Error fetching the playlists: "+err); 

                      for (i of result) {
                        $scope.soundcloudPlaylists.push({'title': i.title, 'id': i.id});
                        $scope['soundcloudPlaylist'+i.id] = [];
                        for (t of i.tracks) {
                          if (typeof t.stream_url != "undefined") {
                            $scope['soundcloudPlaylist'+i.id].push({'service': 'soundcloud', 'source': 'soundcloudPlaylist'+i.id,'title': removeFreeDL(t.title), 'artist': t.user.username, 'id': t.id, 'stream_url': t.stream_url, 'duration': t.duration, 'artwork': t.artwork_url})
                          }
                        }

                        $scope.soundcloudAll = $scope.soundcloudAll.concat($scope['soundcloudPlaylist'+i.id]);

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
          $scope.loading.spotify = true;
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
                conf.set('settings', $scope.settings);
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
          $scope.loading.GooglePm = true; 
          pm.init({email: $scope.settings.GooglePm.user, password: $scope.settings.GooglePm.passwd}, function(err, res) {
            if (err) { 
              console.error("Error with Google Play Music : "+err);
              $scope.$apply(function(){  $scope.loading.state = false });  
              $scope.activeTab = "settings";
              $scope.settings.GooglePm.error = true;
            } else { $scope.settings.GooglePm.error = false }

            pm.getAllTracks(function(err, library) {
              if(err) console.error("Error with Google Play Music : "+err);

              $scope.GooglePmAll = [];
              $scope.GooglePmFavs = [];

              for (i of library.data.items) { 
                if (i.albumArtRef === undefined) { i.albumArtRef = [{'url': ""}] };
                $scope.GooglePmAll.push({'service': 'GooglePm', 'source': 'GooglePmAll','title': i.title, 'artist': i.artist, 'album':i.album, 'id': i.id, 'duration': i.durationMillis, 'artwork': i.albumArtRef[0].url});
                if (i.rating == 5) {
                  $scope.GooglePmFavs.push({'service': 'GooglePm', 'source': 'GooglePmFavs','title': i.title, 'artist': i.artist, 'album':i.album, 'id': i.id, 'duration': i.durationMillis, 'artwork': i.albumArtRef[0].url});
                }
              }

              pm.getPlayLists(function(err, playlists_data) {
                  $scope.GooglePmPlaylists = [];
                  pm.getPlayListEntries(function(err, playlists_entries_data) {
                      for (i of playlists_data.data.items) {
                        $scope.GooglePmPlaylists.push({'title': i.name, 'id': i.id});
                        $scope['GooglePmPlaylist'+i.id] = [];
                      }

                      for (t of playlists_entries_data.data.items) {
                        var track_object = getTrackObject($scope["GooglePmAll"], t.trackId);
                        if (track_object) {
                          track_object.source = 'GooglePmPlaylist'+t.playlistId;
                          $scope['GooglePmPlaylist'+t.playlistId].push(track_object);
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
        $scope.errorConnection = true;
        $scope.loading.state = false;
        return;
      });


      if ($scope.settings.local.active) {
        $scope.loading.local = true; 
        console.log("From local...");
        if (conf.get("localFavs") == undefined) {
          $scope.localFavs = [];
          conf.set("localFavs", $scope.localFavs);
        } else {
          $scope.localFavs = conf.get("localFavs");
        } 

        $scope.localAll = [];

        for (i of $scope.settings.local.paths) {
          recursive(i, function (err, files) {
            for (h of files) {
              if (h.substr(h.length - 3) == "mp3") {
                !function outer(h){
                    mm(fs.createReadStream(h),{ duration: true }, function (err, metadata) {
                      if (err) throw err;
                      var id = new Buffer(h).toString('base64');
                      $scope.$apply(function(){$scope.localAll.push({'service': 'local', 'source': 'localAll','title': metadata.title, 'artist': metadata.artist[0], 'album': metadata.album, 'id': id, 'duration': metadata.duration*1000, 'artwork': null, 'stream_url': 'file://'+h})});
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
        console.log("Finished loading");
        $scope.loading.state = false;
        $scope.sidebar = true; // We place it here so we animate it once (the first time it lags) 
      }, true);
      
    }

    $scope.trackList = function() { return $scope[$scope.activeTab] }

    $scope.setSearchActiveTab = function() {
      if ($scope.search.length > 1) {
        $scope.loading.state = true;
        $scope.searchResult = [];
        $scope.oldActiveTab = $scope.activeTab;
        $scope.activeTab = 'searchResult';
        if ($scope.settings.soundcloud.active) $scope.searchResult = $scope.searchResult.concat($filter('filter')($scope.soundcloudAll, $scope.search));
        if ($scope.settings.GooglePm.active) $scope.searchResult = $scope.searchResult.concat($filter('filter')($scope.GooglePmAll, $scope.search));
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

    /////////////////////////////////////////////
    // When we start
    /////////////////////////////////////////////

    $scope.selected = null;
    $scope.sidebar = false;
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