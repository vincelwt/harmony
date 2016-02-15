//--------------------------------------------
var https = require('https'),
  qs = require('querystring'),
  sc = exports;

//--------------------------------------------

var host_api = [], 
    host_auth = [],
    host_connect = [], 
    client_id = [], 
    client_secret = [], 
    redirect_uri = [];

host_api['sc'] = "api.soundcloud.com";
host_auth['sc'] = "api.soundcloud.com";
host_connect['sc'] = "https://soundcloud.com/connect";
client_id['sc'] = "";
client_secret['sc'] = "";
redirect_uri['sc'] = "";

//--------------------------------------------

host_auth['sf'] = "accounts.spotify.com";
host_api['sf'] = "api.spotify.com";
host_connect['sf'] = "https://accounts.spotify.com/authorize";
client_id['sf'] = "";
client_secret['sf'] = "";
redirect_uri['sf'] = "";

//--------------------------------------------

/* Initialize with client id, client secret and redirect url.
 *
 * @param {String} client_id
 * @param {String} client_secret
 * @param {String} redirect_uri
 */

sc.init = function (service, _client_id, _client_secret, _redirect_uri) {
  client_id[service] = _client_id;
  client_secret[service] = _client_secret;
  redirect_uri[service] = _redirect_uri;
}

//--------------------------------------------

/* get the client id, client secret and redirect url.
 *
 */

sc.getConfig = function () {
  var o = {
    'client_id': client_id,
    'client_secret': client_secret,
    'redirect_uri': redirect_uri
  }
  return o;
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

/* Perform authorization with SoundCLoud and obtain OAuth token needed 
 * for subsequent requests. See http://developers.soundcloud.com/docs/api/guide#authentication
 *
 * @param {String} code sent by the browser based SoundCloud Login that redirects to the redirect_uri

 * @param {Function} callback(error, access_token) No token returned if error != null
 */

sc.auth = function (service, code, callback) {
  var options = {
    uri: host_auth[service],
    method: 'POST',
    qs: {
      'client_id': client_id[service],
      'client_secret': client_secret[service],
      'grant_type': 'authorization_code',
      'redirect_uri': redirect_uri[service],
      'code': code
    }
  };

  options['path'] = service == "sf" ? '/api/token' : '/oauth2/token';

  request(options, function (error, data) {
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
    method: 'POST',
    qs: {
      'client_id': client_id[service],
      'client_secret': client_secret[service],
      'grant_type': 'refresh_token',
      'redirect_uri': redirect_uri[service],
      'refresh_token': refresh_token
    }
  };
  options['path'] = service == "sf" ? '/api/token' : '/oauth2/token';
  request(options, function (error, data) {
    if (error) {
      callback(error);
    } else {
      callback(null, data);
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

  var sf_bearer = (service == "sf") ? true : false;

  if (path && path.indexOf('/') == 0) {
    if (typeof (params) == 'function') {
      callback = params;
      params = {};
    }
    callback = callback || function () {};
    params = params || {};
    if (access_token !== "") {
      params.oauth_token = access_token;
    } else {
      params.client_id = client_id[service];
    }
    params.format = 'json';
    return request({
      method: method,
      uri: host_api[service],
      path: path,
      qs: params
    }, callback, sf_bearer);
  } else {
    callback({
      message: 'Invalid path: ' + path
    });
    return false;
  }
}

//--------------------------------------------

function request(data, callback, sf_bearer) {
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
  } else if (sf_bearer) {
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
