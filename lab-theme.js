
(function(){
  "use strict";
  // Theme inheritance from hub (if any)
  try {
    var t = localStorage.getItem("vsh-theme");
    if (t) document.documentElement.setAttribute("data-theme", t);
  } catch (e) {}

  // ---- Favorites (same store as hub-features.js) ----
  var FAV_KEY = "vsh-favorites-v1";
  function loadFavs() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch (e) { return []; }
  }
  function saveFavs(arr) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(arr)); } catch (e) {}
  }
  function currentLabId() {
    var path = (location.pathname || "").split("/").pop() || "";
    if (!path) return "";
    // map projects/foo.html -> prefer catalog id when possible
    var base = path.replace(/\.html$/i, "");
    return base;
  }
  function ensureFavButton() {
    if (document.getElementById("vsh-lab-fav")) return;
    var id = currentLabId();
    if (!id) return;
    var style = document.createElement("style");
    style.textContent = "#vsh-lab-fav{position:fixed;right:14px;bottom:14px;z-index:9999;border:0;border-radius:999px;padding:12px 16px;font-weight:800;font-size:14px;cursor:pointer;box-shadow:0 8px 28px rgba(0,0,0,.35);background:linear-gradient(135deg,#67e8f9,#a78bfa);color:#07111b}#vsh-lab-fav[data-on='1']{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#1a1000}#vsh-lab-fav:active{transform:scale(.97)}";
    document.head.appendChild(style);
    var btn = document.createElement("button");
    btn.id = "vsh-lab-fav";
    btn.type = "button";
    function paint() {
      var favs = loadFavs();
      var on = favs.indexOf(id) >= 0;
      btn.setAttribute("data-on", on ? "1" : "0");
      btn.textContent = on ? "★ Favorited" : "☆ Favorite";
      btn.title = on ? "Remove from favorites" : "Add to favorites (Hub → Favorites)";
    }
    btn.addEventListener("click", function () {
      var favs = loadFavs();
      var i = favs.indexOf(id);
      if (i >= 0) favs.splice(i, 1); else favs.push(id);
      saveFavs(favs);
      paint();
    });
    document.body.appendChild(btn);
    paint();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ensureFavButton);
  else ensureFavButton();
})();
