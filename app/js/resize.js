
var resizeHandle = document.getElementsByClassName("vertical-resize")[0];
var navbar = document.getElementsByClassName("sidebar")[0];

function resizeNavbar(e) {
  navbar.style.width = (e.pageX+10)+"px";
  if (e.pageX+10 < 150) {
  	addClass("sidebar", "small-nav");
  } else {
  	removeClass("sidebar", "small-nav");
  }
}

function removeEvents() {
  document.removeEventListener('mousemove', resizeNavbar);
  document.removeEventListener('mouseup', resizeNavbar);
}

resizeHandle.addEventListener('mousedown', function() {
  document.addEventListener('mousemove', resizeNavbar);
  document.addEventListener('mouseup', removeEvents);
});
