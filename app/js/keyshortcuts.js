/*** General controls ***/

Mousetrap.bind('down', function(e) {
  if (g.selected != null && g.selected+1 < trackList.length) {

    var el = document.querySelectorAll("[index='"+g.selected+"']")[0];
    var distance_bottom = window.innerHeight - el.getBoundingClientRect().bottom

    el.classList.remove("selected");
    g.selected++;
    document.querySelectorAll("[index='"+g.selected+"']")[0].classList.add("selected");

    if (distance_bottom > 50) e.preventDefault();

  }
});

Mousetrap.bind('up', function(e) {
  if (g.selected != null && g.selected > 0) {

    var el = document.querySelectorAll("[index='"+g.selected+"']")[0];
    var distance_top = el.getBoundingClientRect().top

    el.classList.remove("selected");
    g.selected--;
    document.querySelectorAll("[index='"+g.selected+"']")[0].classList.add("selected");

    if (distance_top > 50) e.preventDefault();
    
  }
});

Mousetrap.bind('left', function(e) {
  if (settings.layout = "coverflow")
    try { coverflow('coverflow').left() } catch (e) {};
});

Mousetrap.bind('right', function(e) {
  if (settings.layout = "coverflow")
    try { coverflow('coverflow').right() } catch (e) {};
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