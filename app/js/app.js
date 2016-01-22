var SC = require('soundcloud-nodejs-api-wrapper');
var notifier = require('node-notifier');
var sc;
var firsttrack = true;

const Configstore = require('configstore');
const conf = new Configstore("Nem");
 
angular.module('nem',['ngAudio', 'cfp.hotkeys'])

.controller('ListController', ['$scope', 'ngAudio', 'hotkeys', function($scope, ngAudio, hotkeys) {
    hotkeys.add({
      combo: 'space',
      description: 'Play / pause',
      callback : function(event, hotkey) {
        $scope.playPause();
        event.preventDefault();
      }
    });

    hotkeys.add({
      combo: 'n',
      description: 'Next track',
      callback : function(event, hotkey) {
        $scope.playTrack($scope.getNext($scope.playing.source, $scope.playing.id));
        event.preventDefault();
      }
    });

    hotkeys.add({
      combo: 'p',
      description: 'Previous track',
      callback : function(event, hotkey) {
        $scope.playTrack($scope.getPrev($scope.playing.source, $scope.playing.id));
        event.preventDefault();
      }
    });

    hotkeys.add({
      combo: 'down',
      callback : function(event, hotkey) {
        if ($scope.selected != null) {
          $scope.selected = $scope.getNext($scope.activeTab, $scope.selected).id;
          event.preventDefault();
        }
        
      }
    });

    hotkeys.add({
      combo: 'up',
      callback : function(event, hotkey) {
        if ($scope.selected != null) {
          $scope.selected = $scope.getPrev($scope.activeTab, $scope.selected).id;
          event.preventDefault();
        }
      }
    });

    hotkeys.add({
      combo: 'enter',
      callback : function(event, hotkey) {
        if ($scope.selected != null) {
          $scope.playTrack($scope.getTrack($scope.activeTab, $scope.selected));
          event.preventDefault();
        }
      }
    });

    $scope.getData = function() {
      if (conf.get("soundcloudUser") == undefined || conf.get("soundcloudPasswd") == undefined) {
        $scope.missingData = true;
        $scope.errorConnection = false;
      } else {
        console.log("Getting data");
        $scope.missingData = false;
        $scope.soundcloudUser = conf.get("soundcloudUser");
        $scope.soundcloudPasswd = conf.get("soundcloudPasswd");

        sc = new SC({
          client_id : '<enterSCclientIDhere',
          client_secret : '<enterSCclientSecretHere>',
          username : $scope.soundcloudUser,
          password : $scope.soundcloudPasswd
        });

        var client = sc.client();

        client.exchange_token(function(err, result) {
          if (arguments[3] == undefined) {
            $scope.errorConnection = true;
          } else {
            $scope.errorConnection = false;

            var access_token = arguments[3].access_token;
            //console.log('Full API auth response was:' + arguments);
            clientnew = sc.client({access_token : access_token}); // we need to create a new client object which will use the access token now 
           
            clientnew.get('/me/activities', {limit : 200}, function(err, result) {
              if (err) console.error("Error fetching the feed : "+err);
              $scope.$apply(function () {
                $scope.soundcloudStream = [];
                for (i of result.collection) {
                  if (i.type == "track" || i.type == "track-sharing" || i.type == "track-repost") {
                    $scope.soundcloudStream.push({'source': 'soundcloudStream', 'title': i.origin.title, 'artist': i.origin.user.username, 'id': i.origin.id, 'stream_url': i.origin.stream_url, 'duration': i.origin.duration});
                  }
                }
              });
            });

            clientnew.get('/me/favorites', {limit : 200}, function(err, result) {
              if (err) console.error("Error fetching the favorites : "+err); 
              $scope.$apply(function () {
                $scope.soundcloudFavs = [];
                for (i of result) {
                  $scope.soundcloudFavs.push({'source': 'soundcloudFavs','title': i.title, 'artist': i.user.username, 'id': i.id, 'stream_url': i.stream_url, 'duration': i.duration});
                }

              });
            });

            $scope.loading = false;
            
         }
        });
      }
      
    }

    $scope.trackList = function() {
      return eval('$scope.'+$scope.activeTab);
    }

    $scope.playTrack = function(track) {
      document.title = track.title;
      notifier.notify({
        'title': track.title,
        'message': 'By '+track.artist
      });
      $scope.playing = track;

      // Hack because for an unknow reason, the progress of the first track to be played can't be changed
      if (firsttrack == true) {$scope.track = ngAudio.load(""); firsttrack = false}

      try {
        $scope.track.restart();
      } catch(e){}

      $scope.track = ngAudio.load(track.stream_url+"?client_id="+sc.oauth._clientId);

      console.log("loaded");
      $scope.track.play();
      $scope.track.complete(function(){
        $scope.playTrack($scope.getNext($scope.playing.source, $scope.playing.id));
      });
      console.log($scope.track);
    }

    $scope.getNext = function(source, id) {
      var currentPlaylist = eval("$scope."+source);
      for (i = 0; i < currentPlaylist.length; i++) { 
        if (currentPlaylist[i].id == id) {
          return currentPlaylist[i+1];
        }
      }
    }

    $scope.getPrev = function(source, id) {
      var currentPlaylist = eval("$scope."+source);
      for (i = 0; i < currentPlaylist.length; i++) { 
        if (currentPlaylist[i].id == id) {
          return currentPlaylist[i-1];
        }
      }
    }

    $scope.getTrack = function(source, id) {
      var currentPlaylist = eval("$scope."+source);
      for (i = 0; i < currentPlaylist.length; i++) { 
        if (currentPlaylist[i].id == id) {
          return currentPlaylist[i];
        }
      }
    }


    $scope.playPause = function() {
      if ($scope.track.paused) {
        $scope.track.play()
      } else {
        $scope.track.pause()
      }
    }

    $scope.saveSettings = function() {
      console.log("Saving settings");
      conf.set('soundcloudPasswd', $scope.soundcloudPasswd);
      conf.set('soundcloudUser', $scope.soundcloudUser);
      $scope.getData();
    }


    //// STUF WHEN YOU DRAG THE BAR
    function moveBar(evt, el, dir) {
      var value;
      if(dir === 'horizontal') {
        value = Math.round((evt.clientX - el.offset().left) * 100 / el.parentNode.offsetWidth);
        el.style.width = value + '%';
        return value;
      }
    }

    function handlerBar(evt) {
      rightClick = (evt.which === 3) ? true : false;
      seeking = true;
      seek(evt);
    }

    function seek(evt) {
      if(seeking && rightClick === false && $scope.track.canPlay == true) {
        var value = moveBar(evt, progressBar, 'horizontal');
        console.log("seeking to "+value); 
        $scope.track.progress = value/100;
      }
    }

    function seekingFalse() {
      seeking = false;
    }

    var player = document.getElementById('ap');
    console.log(player);
    progressBar = player.querySelector('.ap-bar');

    progressBar.parentNode.parentNode.addEventListener('mousedown', handlerBar, false);
    progressBar.parentNode.parentNode.addEventListener('mousemove', seek, false);
    document.documentElement.addEventListener('mouseup', seekingFalse, false);
    //////////////////////////

    $scope.setSelected = function(t) { //We use an external function because this is located at the same level as ng-repeat
      console.log(t);
      $scope.selected = t;
    }

    // When we start
    $scope.getData();
    $scope.track = false;
    $scope.selected = null;
    $scope.loading = true;

}])

.filter('millSecToDuration', function() {
  return function(ms) {
    var seconds = Math.floor(ms / 1000);
    var minutes = Math.floor(seconds / 60);
    var seconds = seconds - (minutes * 60);
    if (seconds.toString().length == 1) { seconds = '0'+seconds }
    var format = minutes + ':' + seconds
    return format;
  }
});


/**
 *  Helpers
 */

Element.prototype.offset = function() {
  var el = this.getBoundingClientRect(),
  scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
  scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  return {
    top: el.top + scrollTop,
    left: el.left + scrollLeft
  };
};