/*** General controls ***/

Mousetrap.bind('down', function(e) {
  if (g.selected != null && g.selected+1 < trackList.length) {
    document.querySelectorAll("[index='"+g.selected+"']")[0].classList.remove("selected");
    g.selected++;
    document.querySelectorAll("[index='"+g.selected+"']")[0].classList.add("selected");
    e.preventDefault();
  }
});

Mousetrap.bind('up', function(e) {
  if (g.selected != null && g.selected > 0) {
    document.querySelectorAll("[index='"+g.selected+"']")[0].classList.remove("selected");
    g.selected--;
    document.querySelectorAll("[index='"+g.selected+"']")[0].classList.add("selected");
    e.preventDefault();
  }
});

Mousetrap.bind('enter', function(e) {
  if (g.selected != null) {
    playByIndex(g.selected);
    e.preventDefault();
  }
});

Mousetrap.bind('mod+f', function(e) {
  document.getElementById("search").focus();
});

/*** Player controls ***/

Mousetrap.bind('space', function(e) {
  playPause();
  e.preventDefault();
});

Mousetrap.bind('l', function(e) {
    FavPlaying();
    e.preventDefault();
});

Mousetrap.bind(['mod+right','n'], function(e) {
  nextTrack();
  e.preventDefault();
});

Mousetrap.bind(['mod+left','p'], function(e) {
  prevTrack();
  e.preventDefault();
});