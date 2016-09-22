var resizeHandle = document.getElementsByClassName("vertical-resize")[0];
var navbar = document.getElementsByClassName("sidebar")[0];

if (settings && settings.navbarWidth) navbar.style.width = settings.navbarWidth;

function resizeNavbar(e) {
  navbar.style.width = (e.pageX+5)+"px";
  if (e.pageX+5 < 150) {
  	addClass("sidebar", "small-nav");
  } else {
  	removeClass("sidebar", "small-nav");
  }

  settings.navbarWidth = (e.pageX+5)+"px";
}

function removeEvents() {
  document.removeEventListener('mousemove', resizeNavbar);
  document.removeEventListener('mouseup', resizeNavbar);

  conf.set('settings', settings);
}

resizeHandle.addEventListener('mousedown', function() {
  document.addEventListener('mousemove', resizeNavbar);
  document.addEventListener('mouseup', removeEvents);
});
