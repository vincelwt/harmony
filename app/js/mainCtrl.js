angular.module('harmony').controller('MainController', function($filter, $rootScope, $scope, hotkeys) {
    hotkeys.add({
      combo: 'down',
      callback : function(event, hotkey) {
        if ($scope.selected != null) {
          $scope.selected++;
          event.preventDefault();
        }
      }
    });

    hotkeys.add({
      combo: 'up',
      callback : function(event, hotkey) {
        if ($scope.selected != null && $scope.selected > 0) {
          $scope.selected--;
          event.preventDefault();
        }
      }
    });

    hotkeys.add({
      combo: 'enter',
      callback : function(event, hotkey) {
        if ($scope.selected != null) {
          $scope.playByIndex($scope.selected);
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

    $rootScope.playByIndex = function(index) {
        $rootScope.playingTrackList = $filter('filter')($scope.trackList, $scope.search);

        for (i = 0; i < $rootScope.playingTrackList.length; i++) { 
          $rootScope.playingTrackList[i].indexPlaying = i;
        }

        $scope.playTrack($rootScope.playingTrackList[index]);
    }

    $rootScope.getData = function() {
      if (conf.get("settings") == undefined || conf.get("data") == undefined) {
        console.log("First time");
        $rootScope.resetAll();
        $scope.loading.discret = false;
        return;
      } else {
        $scope.settings = conf.get("settings");
        $scope.data = conf.get("data");

        $scope.settings.googlepm.active = $scope.settings.googlepm.user;

        if ($scope.settings.activeTab) {
          $scope.changeActiveTab($scope.settings.activeTab);
        } else if ($scope.settings.soundcloud.active) {
          $scope.changeActiveTab('soundcloudStream');
        } else if ($scope.settings.googlepm.active) {
          $scope.changeActiveTab('googlepmAll');
        } else if ($scope.settings.spotify.active) {
          $scope.changeActiveTab('spotifyFavs');
        } else if ($scope.settings.local.active) {
          $scope.changeActiveTab('localAll');
        } else {
          $scope.changeActiveTab('settings');
          return;
        }

        $scope.loading.discret = true;
      }

      $scope.loading.googlepm = true;
      $scope.loading.soundcloud = true;
      $scope.loading.spotify = true;
      $scope.loading.local = true;

      $scope.loading.state = true;

      console.log("Getting data");

      testInternet.then(function() {

        if ($scope.settings.lastfm.active) {
          api.init('lastfm', client_ids.lastfm.client_id, client_ids.lastfm.client_secret);
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
                spotify_access_token = data.access_token;
                $scope.settings.spotify.error = false;

                 api.get('spotify', '/v1/me/tracks', spotify_access_token, {limit: 50}, function(err, result) {
                  if (err) console.error("Error fetching the my spotify tracks : "+err);

                  $scope.data.spotifyFavs = [];

                  for (i of result.items) {
                    $scope.data.spotifyFavs.push({'service': 'spotify', 'source': 'spotifyFavs','title': i.track.name, 'artist': i.track.artists[0].name, 'id': i.track.id, 'duration': i.track.duration_ms, 'artwork': i.track.album.images[0].url});
                  }

                  api.get('spotify', '/v1/me/playlists', spotify_access_token, {limit: 50}, function(err, result) {

                    $scope.data.spotifyPlaylists = [];
                      if (err) console.error("Error fetching the playlists: "+err); 

                      for (i of result.items) {
                        $scope.data.spotifyPlaylists.push({'title': i.name, 'id': i.id});
                        $scope.data['spotifyPlaylist'+i.id] = [];

                        !function outer(i){
                          var linkTracks = i.tracks.href.split('/v1/')[1];
                        
                          api.get('spotify', '/v1/'+linkTracks, spotify_access_token, {limit: 100}, function(err, result) {
                            for (t of result.items) {
                              $scope.data['spotifyPlaylist'+i.id].push({'service': 'spotify', 'source': 'spotifyPlaylist'+i.id,'title': t.track.name, 'artist': t.track.artists[0].name, 'id': t.track.id, 'duration': t.track.duration_ms, 'artwork': t.track.album.images[0].url})
                            }
                          });
                        }(i);
                        

                      }

                    $scope.$apply(function(){$scope.loading.spotify = false}); 
                   });


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

        if ($scope.settings.googlepm.active) {
          console.log("From googlepm...");
          pm.init({email: $scope.settings.googlepm.user, password: $scope.settings.googlepm.passwd}, function(err, res) {
            if (err) { 
              console.error("Error with Google Play Music : "+err);
              $scope.$apply(function(){  $scope.loading.state = false });  
              $scope.activeTab = "settings";
              $scope.settings.googlepm.error = true;
            } else { $scope.settings.googlepm.error = false }

            pm.getAllTracks(function(err, library) {
              if(err) console.error("Error with Google Play Music : "+err);

              $scope.data.googlepmAll = [];
              $scope.data.googlepmFavs = [];

              for (i of library.data.items) { 
                if (i.albumArtRef === undefined) { i.albumArtRef = [{'url': ""}] };
                $scope.data.googlepmAll.push({'service': 'googlepm', 'source': 'googlepmAll','title': i.title, 'artist': i.artist, 'album':i.album, 'id': i.id, 'duration': i.durationMillis, 'artwork': i.albumArtRef[0].url});
                if (i.rating == 5) {
                  $scope.data.googlepmFavs.push({'service': 'googlepm', 'source': 'googlepmFavs','title': i.title, 'artist': i.artist, 'album':i.album, 'id': i.id, 'duration': i.durationMillis, 'artwork': i.albumArtRef[0].url});
                }
              }

              pm.getPlayLists(function(err, playlists_data) {
                  $scope.data.googlepmPlaylists = [];
                  pm.getPlayListEntries(function(err, playlists_entries_data) {
                      for (i of playlists_data.data.items) {
                        $scope.data.googlepmPlaylists.push({'title': i.name, 'id': i.id});
                        $scope.data['googlepmPlaylist'+i.id] = [];
                      }

                      for (t of playlists_entries_data.data.items) {
                        var track_object = getTrackObject($scope.data.googlepmAll, t.trackId);
                        if (track_object) {
                          track_object.source = 'googlepmPlaylist'+t.playlistId;
                          $scope.data['googlepmPlaylist'+t.playlistId].push(track_object);
                    	  }
                      }
                      
                    $scope.$apply(function(){$scope.loading.googlepm = false}); 
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
        if (($scope.settings.spotify.active && t.spotify ) || ($scope.settings.soundcloud.active && t.soundcloud )|| ($scope.settings.googlepm.active && t.googlepm) || ($scope.settings.local.active && t.local)) {
          return;
        }

        conf.set('data', $scope.data);

        $scope.loading.state = false;
      }, true);
      
    }

    $scope.changeActiveTab = function(activeTab) {
      if ($scope.activeTab != activeTab) {
        $scope.search = ""; // Reset search
        $scope.activeTab = activeTab;
        $scope.selected = null; //Reset selected
        setTimeout(function(){ // Async so it doesn't block the activetab changing process on loading large lists
          document.getElementById("trackList").scrollTop = 0; //If the user scrolled, let's go back to top
          $scope.$apply(function(){ $scope.trackList = $scope.data[activeTab] });
        }, 0);

        if (activeTab != "settings") {
          $scope.settings.activeTab = activeTab;
          conf.set('settings', $scope.settings);
        }
      }
      
    }

    /////////////////////////////////////////////
    // When we start
    /////////////////////////////////////////////

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