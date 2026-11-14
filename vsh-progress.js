(function () {
  "use strict";
  var STORAGE_KEY = "vsh-completed-sims";
  var grid = document.getElementById("project-grid");
  var progressStat = document.getElementById("stat-progress");
  if (!grid || !progressStat) return;

  function normalizePath(value) {
    try {
      var url = new URL(value, window.location.href);
      if (url.origin !== window.location.origin) return "";
      return url.pathname.replace(/\/+$/, "") || "/";
    } catch (error) { return ""; }
  }

  var catalogItems = typeof CATALOG !== "undefined" && Array.isArray(CATALOG) ? CATALOG : [];
  var livePaths = new Set();
  catalogItems.forEach(function (item) {
    if (item && item.status === "live" && item.url) {
      var path = normalizePath(item.url);
      if (path) livePaths.add(path);
    }
  });

  function readStore(storeName) {
    try {
      var store = window[storeName];
      var parsed = JSON.parse(store.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) { return []; }
  }

  function getCompleted() {
    var values = readStore("localStorage").concat(readStore("sessionStorage"));
    var completed = new Set();
    values.forEach(function (value) {
      var path = normalizePath(value);
      if (path && livePaths.has(path)) completed.add(path);
    });
    return completed;
  }

  function saveCompleted(path) {
    var completed = getCompleted();
    completed.add(path);
    var serialized = JSON.stringify(Array.from(completed));
    try { window.localStorage.setItem(STORAGE_KEY, serialized); } catch (error) {}
    try { window.sessionStorage.setItem(STORAGE_KEY, serialized); } catch (error) {}
  }

  function applyProgress() {
    var completed = getCompleted();
    progressStat.textContent = completed.size + " / " + livePaths.size;
    grid.querySelectorAll(".card").forEach(function (card) {
      var link = card.querySelector(".card-link[href]");
      var heading = card.querySelector("h3");
      if (!link || !heading) return;
      var path = normalizePath(link.href);
      var badge = heading.querySelector(".vsh-completed-badge");
      if (completed.has(path) && !badge) {
        badge = document.createElement("span");
        badge.className = "vsh-completed-badge";
        badge.textContent = "✓ Completed";
        badge.setAttribute("aria-label", "Simulation completed");
        heading.appendChild(badge);
      } else if (!completed.has(path) && badge) {
        badge.remove();
      }
    });
  }

  var style = document.createElement("style");
  style.textContent = ".vsh-completed-badge{display:inline-flex;align-items:center;vertical-align:middle;margin-left:8px;padding:3px 8px;border:1px solid rgba(124,240,189,.42);border-radius:999px;background:rgba(124,240,189,.10);color:#7cf0bd;font-size:10px;font-weight:800;letter-spacing:.02em;white-space:nowrap}";
  document.head.appendChild(style);

  document.addEventListener("click", function (event) {
    var anchor = event.target && event.target.closest ? event.target.closest("a[href]") : null;
    if (!anchor || (event.button !== 0 && event.button !== undefined)) return;
    var path = normalizePath(anchor.href);
    if (!path || !livePaths.has(path)) return;
    saveCompleted(path);
    applyProgress();
  }, true);

  if (typeof MutationObserver === "function") {
    var observer = new MutationObserver(applyProgress);
    observer.observe(grid, { childList: true, subtree: true });
  }
  applyProgress();
})();