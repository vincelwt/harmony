function testInternet() {
  console.log("Testing internet...");

  return new Promise(function(resolve, reject) {
    var api_creds_url = "https://dl.dropboxusercontent.com/u/39260904/harmony.json";

    var xhr = new XMLHttpRequest();

    xhr.open("GET", api_creds_url, true);

    xhr.onload = function (e) {
      if (xhr.readyState === 4)
        if (xhr.status === 200) {
          client_ids = JSON.parse(xhr.responseText);
          return resolve();
        } else {
          console.log(xhr.statusText);
          return reject([xhr.statusText]);
        }
    };

    xhr.onerror = function (e) {
      console.error(xhr.statusText);
      return reject([xhr.statusText]);
    };

    xhr.send(null);

  });

}

function removeFreeDL(string) { 
  return string.replace("[Free DL]", "")
              .replace("(Free DL)", "")
              .replace("[Free Download]", "")
              .replace("(Free Download)", "") 
}

function getById(id) {
  return document.getElementById(id);
}

function isSearched(track) {
  var search = getById("search").value.toLowerCase();
  if (search.length > 1)
    if (track.title.toLowerCase().indexOf(search) > -1 || track.artist.name.toLowerCase().indexOf(search) > -1 || track.album.name.toLowerCase().indexOf(search) > -1)
      return true;
    else
      return false;
  else
    return true;
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
  for (i = 0; i < source.length; i++)
    if (source[i].id == id) return source[i];

  return null;
}

function getListObject(locationString) {
  
  var location = locationString.split(",");

  for (o of data[location[0]][location[1]])
    if (o.id == location[2]) return o;

  return false;
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function coverPos(title, id) {
  for (x = 0; x < coverflowItemsTmp.length; x++)
    if ((!id && coverflowItemsTmp[x].title == title) || (id && coverflowItems[x].id == title)) return x;

  return false;
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  while (0 !== currentIndex) {

    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function Uint8ToBase64(u8Arr){
  var CHUNK_SIZE = 0x8000,
    index = 0,
    length = u8Arr.length,
    result = '',
    slice;
  while (index < length) {
    slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length)); 
    result += String.fromCharCode.apply(null, slice);
    index += CHUNK_SIZE;
  }
  return btoa(result);
}

function msToDuration(ms) {
  var seconds = Math.floor(ms / 1000),
      minutes = Math.floor(seconds / 60),
      seconds = seconds - (minutes * 60);
  if (seconds.toString().length == 1) seconds = '0'+seconds;
  return minutes + ':' + seconds;
}

function updatePlayingIcon() {
  if (g.playing) {
    var icon_playing = getById("playing_icon");
    if (icon_playing) icon_playing.parentNode.removeChild(icon_playing);

    var playing_song = getById(g.playing.id);

    if (playing_song) {
      var icon_playing_c = playing_song.firstChild;
      icon_playing_c.innerHTML = " <span class='icon icon-play' id='playing_icon'></span> "+icon_playing_c.innerHTML
    }
    
  }
}

function addClass(id, className) {
  if (getById(id)) // If it's an id
    getById(id).classList.add(className);

  else if (document.getElementsByName(id)) // If it's a name and not an id
    for (var i = 0; i < document.getElementsByName(id).length; i++) 
      document.getElementsByName(id)[i].classList.add(className);
}

function removeClass(id, className) {
  if (getById(id))
    getById(id).classList.remove(className);

  else if (document.getElementsByName(id))
    for (var i = 0; i < document.getElementsByName(id).length; i++) 
      document.getElementsByName(id)[i].classList.remove(className);
}

function ISO8601ToSeconds(input) {

    var reptms = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
    var hours = 0, minutes = 0, seconds = 0, totalseconds;

    if (reptms.test(input)) {
        var matches = reptms.exec(input);
        if (matches[1]) hours = Number(matches[1]);
        if (matches[2]) minutes = Number(matches[2]);
        if (matches[3]) seconds = Number(matches[3]);
        totalseconds = hours * 3600  + minutes * 60 + seconds;
    }

    return (totalseconds);
}