(function(){
  "use strict";
  // Ensure polish CSS
  if(!document.querySelector('link[href*="lab-polish.css"]')){
    var l=document.createElement("link");
    l.rel="stylesheet";
    l.href="../lab-polish.css?v=2";
    document.head.appendChild(l);
  }
  // Hi-DPI canvas helper: re-bind common getContext draw if needed
  document.querySelectorAll("canvas").forEach(function(c){
    c.style.imageRendering="auto";
  });
  // Soft entrance
  document.documentElement.style.opacity="0";
  document.documentElement.style.transition="opacity .35s ease";
  requestAnimationFrame(function(){
    document.documentElement.style.opacity="1";
  });
  // Keyboard: Space toggles play if button exists
  document.addEventListener("keydown",function(e){
    if(e.code==="Space" && e.target.tagName!=="INPUT" && e.target.tagName!=="TEXTAREA"){
      var btn=document.getElementById("playBtn")||document.getElementById("play");
      if(btn){e.preventDefault();btn.click();}
    }
  });
})();
