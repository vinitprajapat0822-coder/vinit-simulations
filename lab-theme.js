(function () {
  "use strict";
  var theme = "holographic";
  try {
    theme = localStorage.getItem("vsh-interface-theme-v2") || theme;
  } catch (e) {}
  var allowed = ["control-room", "constellation", "holographic", "terminal"];
  if (allowed.indexOf(theme) < 0) theme = "holographic";
  document.documentElement.classList.add("lab-themed");
  document.body.classList.add("lab-themed", "lab-theme-" + theme);
  // load css
  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "../lab-theme.css?v=1";
  document.head.appendChild(link);
})();
