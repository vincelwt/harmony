const resizeHandle = document.getElementsByClassName("vertical-resize")[0];
const navbar = document.getElementsByClassName("sidebar")[0];

if (settings && settings.navbarWidth) {
    navbar.style.width = settings.navbarWidth;
}

function resizeNavbar(e) {
  const pixelAmount = (e.pageX+5);

  navbar.style.width = pixelAmount + "px";

  if (pixelAmount < 120) {
  	addClass("sidebar", "small-nav");
  } else {
  	removeClass("sidebar", "small-nav");
  }

  settings.navbarWidth = pixelAmount + "px";
}

function removeEvents() {
  document.removeEventListener('mousemove', resizeNavbar);
  document.removeEventListener('mouseup', resizeNavbar);

  conf.set('settings', settings);
}

resizeHandle.addEventListener('mousedown', () => {
  document.addEventListener('mousemove', resizeNavbar);
  document.addEventListener('mouseup', removeEvents);
});
