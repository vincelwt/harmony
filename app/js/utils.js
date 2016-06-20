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
    
    if (document.getElementById(g.playing.source))
      document.getElementById(g.playing.source).innerHTML += " <span id='source_icon' class='icon icon-play playing'></span>"
  }
}

function addClass(id, className) {
  if (document.getElementById(id))
    document.getElementById(id).classList.add(className);

  else if (document.getElementsByName(id))
    for (var i = 0; i < document.getElementsByName(id).length; i++) 
      document.getElementsByName(id)[i].classList.add(className);
}

function removeClass(id, className) {
  if (document.getElementById(id))
    document.getElementById(id).classList.remove(className);

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