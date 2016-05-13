
var resizeHandle = document.getElementsByClassName("vertical-resize")[0];
var navbar = document.getElementsByClassName("sidebar")[0];

function resizeNavbar(e) {
  navbar.style.width = e.pageX+"px";
}

function removeEvents() {
  document.removeEventListener('mousemove', resizeNavbar);
  document.removeEventListener('mouseup', resizeNavbar);
}

resizeHandle.addEventListener('mousedown', function() {
  document.addEventListener('mousemove', resizeNavbar);
  document.addEventListener('mouseup', removeEvents);
});
