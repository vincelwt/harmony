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
  for (i = 0; i < source.length; i++)
    if (source[i].id == id) return source[i];

  return null;
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

function setClassActive(id, value) {
  if (value) {
    document.getElementById(id).classList.add('active');
  } else {
    document.getElementById(id).classList.remove('active');
  }
}

function updatePlayingIcon() {
  if (g.playing) {
    var icon_playing = document.getElementById("playing_icon");
    if (icon_playing) icon_playing.parentNode.removeChild(icon_playing);

    var playing_song = document.getElementById(g.playing.id);

    if (playing_song) {
      var icon_playing_c = playing_song.firstChild;
      icon_playing_c.innerHTML = " <span class='icon icon-play' id='playing_icon'></span> "+icon_playing_c.innerHTML
    }
    
    var source_icon = document.getElementById("source_icon");
    if (source_icon) source_icon.parentNode.removeChild(source_icon);
    document.getElementById(g.playing.source).innerHTML += " <span id='source_icon' class='icon icon-play playing'></span>"
  }
}

function addClass(id, className) {
  var el = document.getElementById(id);
  if (el) el.classList.add(className);
}

function removeClass(id, className) {
  var el = document.getElementById(id);
  if (el) el.classList.remove(className);
}