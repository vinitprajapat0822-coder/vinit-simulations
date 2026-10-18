(function () {
  "use strict";
  var theme = "holographic";
  try {
    theme = localStorage.getItem("vsh-interface-theme-v2") || theme;
  } catch (e) {}
  var allowed = ["control-room", "constellation", "holographic", "terminal"];
  if (allowed.indexOf(theme) < 0) theme = "holographic";
  function ready(fn){
    if(document.body) fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }
  ready(function(){
    document.documentElement.classList.add("lab-themed");
    document.body.classList.add("lab-themed", "lab-theme-" + theme);
  });
  function addCss(href){
    if(document.querySelector('link[href*="'+href.split("?")[0]+'"]')) return;
    var link=document.createElement("link");
    link.rel="stylesheet";
    link.href=href;
    document.head.appendChild(link);
  }
  addCss("../lab-theme.css?v=3");
  addCss("../lab-polish.css?v=2");
  // polish js behaviors
  var s=document.createElement("script");
  s.src="../lab-polish.js?v=2";
  s.defer=true;
  document.head.appendChild(s);
})();
