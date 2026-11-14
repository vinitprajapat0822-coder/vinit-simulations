
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

  // Treat each canvas as a visual presentation. Controls and measurements stay
  // in the DOM and preserve their natural left-to-right keyboard order.
  function enhanceCanvasAccessibility() {
    var canvases = document.querySelectorAll("canvas");
    if (!canvases.length || document.getElementById("vsh-canvas-a11y")) return;

    Array.prototype.forEach.call(canvases, function (canvas) {
      canvas.setAttribute("aria-hidden", "true");
      canvas.setAttribute("focusable", "false");
    });

    var heading = document.querySelector("main h1") || document.querySelector("h1");
    var source = document.querySelector(".lead") || document.querySelector(".hero p");
    var summary = source && source.textContent ? source.textContent.replace(/\s+/g, " ").trim() : "";
    if (!summary && heading) summary = heading.textContent.trim() + " interactive simulation.";
    if (!summary) summary = "Interactive simulation with adjustable controls and a live visual model.";

    var region = document.createElement("div");
    region.id = "vsh-canvas-a11y";
    region.setAttribute("role", "region");
    region.setAttribute("aria-label", "Simulation description");
    region.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";

    var description = document.createElement("p");
    description.textContent = summary.slice(0, 500);

    var status = document.createElement("div");
    status.id = "vsh-simulation-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.setAttribute("aria-atomic", "true");
    status.textContent = "Ready. Change a simulation control to hear updated measurements.";

    region.appendChild(description);
    region.appendChild(status);
    (document.querySelector("main") || document.body).appendChild(region);

    // Native controls remain in the natural document Tab sequence. Add names
    // to range sliders that use a visual label row instead of a linked <label>.
    var controls = document.querySelectorAll('input[type="range"], select, textarea, input:not([type="hidden"]), button');
    Array.prototype.forEach.call(controls, function (control) {
      if (control.disabled) return;
      if (control.tabIndex < 0) control.tabIndex = 0;

      if (control.tagName === "INPUT" && control.type === "range" &&
          !control.hasAttribute("aria-label") && !control.hasAttribute("aria-labelledby")) {
        var label = "";
        if (control.labels && control.labels.length) label = control.labels[0].textContent || "";
        if (!label && control.previousElementSibling) label = control.previousElementSibling.textContent || "";
        if (!label) label = control.title || control.id.replace(/[-_]/g, " ");
        if (label) control.setAttribute("aria-label", label.replace(/\s+/g, " ").trim());
      }
    });

    var timer = 0;
    function announceUpdate(action) {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        var resultArea = document.querySelector(".results") || document.getElementById("res");
        var values = resultArea ? (resultArea.innerText || resultArea.textContent || "") : "";
        values = values.replace(/\s+/g, " ").trim().slice(0, 260);
        status.textContent = values ? action + ". " + values : action + ".";
      }, 250);
    }

    // Announce after user interaction, rather than every animation frame.
    document.addEventListener("input", function (event) {
      var target = event.target;
      if (target && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) {
        announceUpdate("Simulation values updated");
      }
    }, true);
    document.addEventListener("change", function (event) {
      var target = event.target;
      if (target && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) {
        announceUpdate("Simulation values updated");
      }
    }, true);
    document.addEventListener("click", function (event) {
      var target = event.target;
      var button = target && target.closest ? target.closest("button") : null;
      if (button && !button.disabled) {
        var action = (button.textContent || button.getAttribute("aria-label") || "Simulation control").replace(/\s+/g, " ").trim();
        announceUpdate(action + " activated");
      }
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhanceCanvasAccessibility);
  } else {
    enhanceCanvasAccessibility();
  }

})();
