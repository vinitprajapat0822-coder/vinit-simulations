(function () {
  "use strict";
  if (typeof CATALOG === "undefined") return;

  var FAV_KEY = "vsh-favorites-v1";
  var RECENT_KEY = "vsh-recent-v1";
  var VISIT_KEY = "vsh-visited-v1";

  function loadJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }
  function saveJSON(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  var favorites = loadJSON(FAV_KEY, []);
  var recent = loadJSON(RECENT_KEY, []);
  var visited = loadJSON(VISIT_KEY, []);

  function isFav(id) {
    return favorites.indexOf(id) >= 0;
  }
  function toggleFav(id) {
    var i = favorites.indexOf(id);
    if (i >= 0) favorites.splice(i, 1);
    else favorites.push(id);
    saveJSON(FAV_KEY, favorites);
    refreshChrome();
    document.dispatchEvent(new CustomEvent("vsh-fav-change"));
  }
  function markVisited(id, title, url) {
    if (visited.indexOf(id) < 0) {
      visited.push(id);
      saveJSON(VISIT_KEY, visited);
    }
    recent = recent.filter(function (r) {
      return r.id !== id;
    });
    recent.unshift({ id: id, title: title, url: url, t: Date.now() });
    recent = recent.slice(0, 8);
    saveJSON(RECENT_KEY, recent);
    refreshChrome();
  }

  function subjectOf(item) {
    var c = (item && item.category) || "";
    if (c === "chemistry" || c === "organic") return "chemistry";
    if (c === "math" || c === "mathematics") return "math";
    return "physics";
  }
  function currentSubject() {
    try { return window.VSH_SUBJECT || localStorage.getItem("vsh-subject") || "physics"; }
    catch (e) { return "physics"; }
  }
  function liveLabs() {
    var sub = currentSubject();
    return CATALOG.filter(function (x) {
      return x.status === "live" && x.url && subjectOf(x) === sub;
    });
  }

  function ensureToolbar() {
    if (document.getElementById("hub-features-bar")) return;
    var host =
      document.getElementById("bento-live") ||
      document.getElementById("project-grid");
    if (!host || !host.parentNode) return;
    var bar = document.createElement("div");
    bar.id = "hub-features-bar";
    bar.className = "hub-features-bar";
    bar.innerHTML =
      '<div class="hf-left">' +
      '<button type="button" id="hf-random" class="hf-btn primary">Random live lab</button>' +
      '<button type="button" id="hf-favs" class="hf-btn">Favorites</button>' +
      '<button type="button" id="hf-recent" class="hf-btn">Recent</button>' +
      "</div>" +
      '<div class="hf-right">' +
      '<span class="hf-pill" id="hf-progress">Progress —</span>' +
      '<span class="hf-pill" id="hf-fav-count">★ 0</span>' +
      "</div>" +
      '<div id="hf-panel" class="hf-panel" hidden></div>';
    host.parentNode.insertBefore(bar, host);
    document.getElementById("hf-random").addEventListener("click", function () {
      var labs = liveLabs();
      if (!labs.length) return;
      var pick = labs[Math.floor(Math.random() * labs.length)];
      markVisited(pick.id, pick.title, pick.url);
      location.href = pick.url;
    });
    document.getElementById("hf-favs").addEventListener("click", function () {
      showList(
        "Favorites",
        favorites
          .map(function (id) {
            return CATALOG.find(function (x) {
              return x.id === id;
            });
          })
          .filter(Boolean)
      );
    });
    document.getElementById("hf-recent").addEventListener("click", function () {
      showList(
        "Recently opened",
        recent
          .map(function (r) {
            return (
              CATALOG.find(function (x) {
                return x.id === r.id;
              }) || r
            );
          })
          .filter(function (x) {
            return x && (x.url || x.title);
          })
      );
    });
  }

  function showList(title, items) {
    var panel = document.getElementById("hf-panel");
    if (!panel) return;
    if (!items.length) {
      panel.hidden = false;
      panel.innerHTML =
        "<strong>" +
        title +
        "</strong><p class='hf-empty'>Nothing here yet. Open labs or star them.</p>";
      return;
    }
    panel.hidden = false;
    panel.innerHTML =
      "<div class='hf-panel-top'><strong>" +
      title +
      '</strong><button type="button" id="hf-close">Close</button></div><div class="hf-list">' +
      items
        .map(function (x) {
          var url = x.url || "#";
          var t = x.title || x.id;
          return (
            '<a class="hf-item" href="' +
            url +
            '" data-lab-id="' +
            (x.id || "") +
            '">' +
            (x.icon ? x.icon + " " : "") +
            t +
            "</a>"
          );
        })
        .join("") +
      "</div>";
    var c = document.getElementById("hf-close");
    if (c)
      c.onclick = function () {
        panel.hidden = true;
      };
  }

  function refreshChrome() {
    var live = liveLabs().length;
    var prog = document.getElementById("hf-progress");
    var fc = document.getElementById("hf-fav-count");
    if (prog)
      prog.textContent =
        "Progress " + visited.length + " / " + live + " live";
    if (fc) fc.textContent = "★ " + favorites.length;
    var statLive = document.getElementById("stat-live");
    if (statLive) statLive.textContent = String(live);
  }

  function enhanceCards() {
    var grid = document.getElementById("project-grid");
    if (!grid) return;
    grid.querySelectorAll(".card").forEach(function (card) {
      if (card.querySelector(".fav-btn")) return;
      var link = card.querySelector("a.card-link[href]");
      if (!link) return;
      var href = link.getAttribute("href") || "";
      var item = CATALOG.find(function (x) {
        return x.url === href || (x.url && href.indexOf(x.url) >= 0);
      });
      if (!item) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fav-btn" + (isFav(item.id) ? " on" : "");
      btn.setAttribute("aria-label", "Toggle favorite");
      btn.textContent = isFav(item.id) ? "★" : "☆";
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleFav(item.id);
        btn.textContent = isFav(item.id) ? "★" : "☆";
        btn.classList.toggle("on", isFav(item.id));
      });
      var top = card.querySelector(".card-top");
      if (top) top.appendChild(btn);
      else card.insertBefore(btn, card.firstChild);
      link.addEventListener("click", function () {
        markVisited(item.id, item.title, item.url);
      });
    });
  }

  // Track visits from bento too
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (href.indexOf("projects/") < 0) return;
    var item = CATALOG.find(function (x) {
      return x.url && href.indexOf(x.url) >= 0;
    });
    if (item) markVisited(item.id, item.title, item.url);
  });

  function boot() {
    ensureToolbar();
    refreshChrome();
    enhanceCards();
  }

  // Observe catalog re-renders
  var grid = document.getElementById("project-grid");
  if (grid && window.MutationObserver) {
    new MutationObserver(function () {
      enhanceCards();
    }).observe(grid, { childList: true });
  }
  document.addEventListener("vsh-fav-change", refreshChrome);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  // late catalog paint
  setTimeout(boot, 300);
  setTimeout(boot, 1000);
})();
