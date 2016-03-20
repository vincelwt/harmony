function removeFreeDL(string) { 
  return string.replace("[Free DL]", "")
              .replace("(Free DL)", "")
              .replace("[Free Download]", "")
              .replace("(Free Download)", "") 
}

function getParameterByName(name, url) {
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function getHostname(url) {
    var l = document.createElement("a");
    l.href = url;
    return l.hostname;
};

function getTrackObject(source, id) {
  for (i = 0; i < source.length; i++) { 
  if (source[i].id == id) return source[i];
  }
  return null;
}

function getNextTrack(source, id) {
  for (i = 0; i < source.length; i++) { 
    if (source[i].id == id && source[i+1]) return source[i+1];
  }
  return null;
}

function getPrevTrack(source, id) {
  for (i = 0; i < source.length; i++) { 
    if (source[i].id == id && source[i-1]) return source[i-1];
  }
  return null;
}

function shuffle(array) {
  // And swap it with the current element.
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

var testInternet = new Promise(function(resolve, reject) {
  var api_creds_url = "https://dl.dropboxusercontent.com/u/39260904/harmony.json";
  
  var xhr = new XMLHttpRequest();

  xhr.open("GET", api_creds_url, true);

  xhr.onload = function (e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        client_ids = JSON.parse(xhr.responseText);
        resolve();
      } else {
        console.log(xhr.statusText);
        reject(xhr.statusText);
      }
    }
  };

  xhr.onerror = function (e) {
    console.log(xhr.statusText);
    reject(xhr.statusText);
  };

  xhr.send(null);

});