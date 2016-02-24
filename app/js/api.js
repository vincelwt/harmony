//--------------------------------------------
var https = require('https'),
  md5 = require('md5'),
  request = require('request'),
  qs = require('querystring'),
  sc = exports;

var host_api = [], 
    host_auth = [],
    host_connect = [], 
    client_id = [], 
    client_secret = [], 
    token_path = [];

//----------------SoundCloud-------------------

host_api['sc'] = "api.soundcloud.com";
host_auth['sc'] = "api.soundcloud.com";
host_connect['sc'] = "https://soundcloud.com/connect";
token_path['sc'] = "/oauth2/token";
client_id['sc'] = "";
client_secret['sc'] = "";

//----------------Spotify------------------

host_auth['sf'] = "accounts.spotify.com";
host_api['sf'] = "api.spotify.com";
host_connect['sf'] = "https://accounts.spotify.com/authorize";
token_path['sf'] = "/api/token";
client_id['sf'] = "";
client_secret['sf'] = "";

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

sc.init = function (service, _client_id, _client_secret) {
  client_id[service] = _client_id;
  client_secret[service] = _client_secret;
}

//--------------------------------------------

/* Get the url to SoundCloud's authorization/connection page.
 *
 * @param {Object} options
 * @return {String}
 */

sc.getConnectUrl = function (service, options) {
  return host_connect[service] + '?' + (options ? qs.stringify(options) : '');
}

//--------------------------------------------

/* Perform authorization with SoundCLoud/Spotify/LastFm and obtain OAuth token needed 
 * for subsequent requests. See http://developers.soundcloud.com/docs/api/guide#authentication
 *
 * @param {String} code sent by the browser based SoundCloud Login that redirects to the redirect_uri

 * @param {Function} callback(error, access_token) No token returned if error != null
 */

sc.auth = function (service, code, callback) {
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

sc.refreshToken = function (service, refresh_token, callback) {
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

sc.lastfmGetSession = function (code, callback) {
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


sc.get = function (service, path, access_token, params, callback) {
  call('GET', service, path, access_token, params, callback);
}

sc.post = function (service, path, access_token, params, callback) {
  call('POST', service, path, access_token, params, callback);
}

sc.put = function (service, path, access_token, params, callback) {
  call('PUT', service, path, access_token, params, callback);
}

sc.delete = function (service, path, access_token, params, callback) {
  call('DELETE', service, path, access_token, params, callback);
}

//--------------------------------------------

function call(method, service, path, access_token, params, callback) {

  if (path && path.indexOf('/') == 0) {
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
      params.method = 'track.scrobble';
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
  } else if (service == "sf") { //Specific to spotify
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
        var d = JSON.parse(body);
        // See http://developers.soundcloud.com/docs/api/guide#errors for full list of error codes
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