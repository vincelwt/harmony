//--------------------------------------------
var https = require('https'),
  md5 = require('md5'),
  request = require('request'),
  qs = require('querystring'),
  YouTube = require('youtube-node'),
  ytdl = require('ytdl-core'),
  api = exports;

var host_api = [], 
    host_auth = [],
    host_connect = [], 
    client_id = [], 
    client_secret = [], 
    token_path = [];

//----------------SoundCloud-------------------

host_api['soundcloud'] = "api.soundcloud.com";
host_auth['soundcloud'] = "api.soundcloud.com";
host_connect['soundcloud'] = "https://soundcloud.com/connect";
token_path['soundcloud'] = "/oauth2/token";
client_id['soundcloud'] = "";
client_secret['soundcloud'] = "";

//----------------Spotify------------------

host_auth['spotify'] = "accounts.spotify.com";
host_api['spotify'] = "api.spotify.com";
host_connect['spotify'] = "https://accounts.spotify.com/authorize";
token_path['spotify'] = "/api/token";
client_id['spotify'] = "";
client_secret['spotify'] = "";

//----------------Last.fm------------------

host_auth['lastfm'] = "ws.audioscrobbler.com";
host_api['lastfm'] = "ws.audioscrobbler.com";
host_connect['lastfm'] = "http://www.last.fm/api/auth";
token_path['lastfm'] = "/2.0/?method=auth.getsession";
client_id['lastfm'] = "";
client_secret['lastfm'] = "";

/* Initialize with client id, client secret and redirect url.
 *
 * @param {String} client_id
 * @param {String} client_secret
 */

api.init = function (service, _client_id, _client_secret) {
  client_id[service] = _client_id;
  client_secret[service] = _client_secret;
}

//--------------------------------------------

/* Get the url to SoundCloud's authorization/connection page.
 *
 * @param {Object} options
 * @return {String}
 */


api.getConnectUrl = function (service, options) {
  return host_connect[service] + '?' + options;
}

api.oauthLogin = function(service, callback) {
  if (client_ids == null) {
    testInternet.then(function() {
      // Success!
    }, function(error) {
      console.log(error); // Error!
      alert("Error connecting to internet !")
      return
    });
  }
  
  var authWindow = new BrowserWindow({ title: 'login to '+service, width: 400, height: 500, show: false, 'node-integration': false });
  
  switch(service) {
    case 'lastfm':
      var options = 'api_key=' + client_ids.lastfm.client_id;
      break;
    case 'soundcloud':
      var options = 'client_id=' + client_ids.soundcloud.client_id + '&redirect_uri=http://localhost&response_type=code&display=popup';
      break;
    case 'spotify':
      var options = 'client_id=' + client_ids.spotify.client_id + '&redirect_uri=http://localhost&response_type=code&scope=user-library-read%20user-library-modify';
      break;
  }
  
  var authUrl = api.getConnectUrl(service, options);
  var done = false;
  console.log(authUrl);
  authWindow.setMenu(null);
  authWindow.loadUrl(authUrl);
  authWindow.show();

  function handleCallback (url) {
    if (service == "lastfm") {
      var code = getParameterByName('token', url);
    } else {
      var code = getParameterByName('code', url);
    }
    var error = getParameterByName('error', url);

    if (code || error) authWindow.destroy();

    if (code) {
      callback(code);
    } else if (error) {
      alert("Error, please try again later !");
      alert(error);
    }
  }

  authWindow.webContents.on('did-get-redirect-request', function (event, oldUrl, newUrl) { 
    console.log(newUrl);
    if (getHostname(newUrl) == 'localhost' && done == false) {
      done = true;
      handleCallback(newUrl);
    }
  });

  authWindow.webContents.on('will-navigate', function (event, url) {
    console.log(url);
    if (getHostname(url) == 'localhost' && done == false) {
      done = true;
      handleCallback(url);
    }
  });

  authWindow.on('close', function() { authWindow = null }, false);
}

//--------------------------------------------

/* Perform authorization with SoundCLoud/Spotify/LastFm and obtain OAuth token needed 
 * for subsequent requests. See http://developers.soundcloud.com/docs/api/guide#authentication
 *
 * @param {String} code sent by the browser based SoundCloud Login that redirects to the redirect_uri

 * @param {Function} callback(error, access_token) No token returned if error != null
 */

api.auth = function (service, code, callback) {
  var options = {
    uri: host_auth[service],
    path: token_path[service],
    method: 'POST',
    qs: {
      'client_id': client_id[service],
      'client_secret': client_secret[service],
      'grant_type': 'authorization_code',
      'redirect_uri': 'http://localhost',
      'code': code
    }
  };

  oauthRequest(options, function (error, data) {
    if (error) {
      callback(error);
    } else {
      callback(null, data);
    }
  });
}

api.refreshToken = function (service, refresh_token, callback) {
  var options = {
    uri: host_auth[service],
    path: token_path[service],
    method: 'POST',
    qs: {
      'client_id': client_id[service],
      'client_secret': client_secret[service],
      'grant_type': 'refresh_token',
      'redirect_uri': 'http://localhost',
      'refresh_token': refresh_token
    }
  };

  oauthRequest(options, function (error, data) {
    if (error) {
      callback(error);
    } else {
      callback(null, data);
    }
  });
}

api.lastfmGetSession = function (code, callback) {
  var api_sig = md5('api_key'+client_id['lastfm']+'methodauth.getsessiontoken'+code+client_secret['lastfm']);
  var r = request.get('http://'+host_auth['lastfm']+token_path['lastfm']+'&api_key='+client_id['lastfm']+'&token='+code+'&api_sig='+api_sig, function (error, res, body) {
    console.log(r.uri);
    if (error) {
      callback(error);
    } else {
      callback(null, body);
    }
  });
}

//--------------------------------------------


api.get = function (service, path, access_token, params, callback) {
  call('GET', service, path, access_token, params, callback);
}

api.post = function (service, path, access_token, params, callback) {
  call('POST', service, path, access_token, params, callback);
}

api.put = function (service, path, access_token, params, callback) {
  call('PUT', service, path, access_token, params, callback);
}

api.delete = function (service, path, access_token, params, callback) {
  call('DELETE', service, path, access_token, params, callback);
}

//--------------------------------------------

function call(method, service, path, access_token, params, callback) {

  if (path && path.indexOf('/') == 0 || path instanceof Array) {
    if (typeof (params) == 'function') {
      callback = params;
      params = {};
    }
    callback = callback || function () {};
    params = params || {};

    params.format = 'json';

    if (service == "lastfm") {
      params.sk = access_token;
      params.api_key = client_id["lastfm"];
      params.method = path[1];
      path = path[0];
      params.api_sig = createLastFmSignature(params, client_secret['lastfm']);
    } else if (access_token !== "") {
      params.oauth_token = access_token;
    } else {
      params.client_id = client_id[service];
    }

    return oauthRequest({
      method: method,
      uri: host_api[service],
      path: path,
      qs: params
    }, callback, service);
  } else {
    callback({
      message: 'Invalid path: ' + path
    });
    return false;
  }
}

//--------------------------------------------

function oauthRequest(data, callback, service) {
  var qsdata = (data.qs) ? qs.stringify(data.qs) : '';
  var paramChar = data.path.indexOf('?') >= 0 ? '&' : '?';
  var options = {
    hostname: data.uri,
    path: data.path + paramChar + qsdata,
    method: data.method
  };

  if (data.method == 'POST') {
    options.path = data.path;
    options.headers = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Content-Length': qsdata.length
    };
  } else if (service == "spotify") { //Specific to spotify
    options.headers = {
      "Accept": "application/json",
      "Authorization": 'Bearer '+data.qs.oauth_token, 
    }
  }

  var req = https.request(options, function (response) {

    var body = "";
    response.on('data', function (chunk) {
      body += chunk;
    });
    response.on('end', function () {
      try {
        try {
          var d = JSON.parse(body); // Unexpected end of input error, eg save/del tracks with spotify
        } catch(e) {
          var d = body;
        }
        if (Number(response.statusCode) >= 400) {
          callback(d.errors, d);
        } else {
          callback(undefined, d);
        }
      } catch (e) {
        callback(e);
      }
    });
  });

  req.on('error', function (e) {
    callback(e);
  });

  if (data.method == 'POST') {
    req.write(qsdata);
  }

  req.end();
}

function createLastFmSignature(params, secret) {
  var sig = "";
  Object.keys(params).sort().forEach(function(key) {
    if (key != "format") {
      var value = typeof params[key] !== "undefined" && params[key] !== null ? params[key] : "";
      sig += key + value;
    }
  });
  sig += secret;
  return md5(sig);
}

//**** For Spotify stream url parsing *****///

var youTube = new YouTube();
youTube.setKey('AIzaSyCeJaBRtF39HjAevohkl0als3Sb8kS867Y');

api.getStreamUrlFromName = function(name, callback) {
  youTube.search(name, 1, function(error, result) {
    if (error) {
      callback(error);
    } else {
      if (result.items[0]) {
        var videoId = result.items[0].id.videoId;
      } else {
        callback("no youtube for this music");
        return;
      }

      ytdl.getInfo('https://www.youtube.com/watch?v='+videoId, [], function(err, info){
        for (i of info.formats) {
          if (i.audioBitrate == 128 && i.audioEncoding == "vorbis") {
            callback(null, i.url);
            return
          }
        }
        callback("no stream for this url");
      });

    }
  });
}