/* Vinit Simulation Hub — mastery ring, daily streak and explicit lab completion. */
(function () {
  "use strict";

  var COMPLETED_KEY = "vsh-mastery-completed-v1";
  var STREAK_KEY = "vsh-daily-streak-v1";
  var grid = document.getElementById("project-grid");
  var progressStat = document.getElementById("stat-progress");

  function normalizePath(value) {
    try {
      var url = new URL(value, window.location.href);
      if (url.origin !== window.location.origin) return "";
      return url.pathname.replace(/\/+$/, "") || "/";
    } catch (error) { return ""; }
  }

  function readArray(key) {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) { return []; }
  }

  function todayKey(date) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  }

  function updateDailyStreak() {
    var now = new Date();
    var today = todayKey(now);
    var saved = { lastVisit: "", streak: 0, totalDays: 0 };
    try {
      var parsed = JSON.parse(window.localStorage.getItem(STREAK_KEY) || "{}");
      if (parsed && typeof parsed === "object") saved = Object.assign(saved, parsed);
    } catch (error) {}
    if (saved.lastVisit !== today) {
      var yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      saved.streak = saved.lastVisit === todayKey(yesterday) ? Math.max(1, Number(saved.streak) || 0) + 1 : 1;
      saved.totalDays = Math.max(0, Number(saved.totalDays) || 0) + 1;
      saved.lastVisit = today;
      try { window.localStorage.setItem(STREAK_KEY, JSON.stringify(saved)); } catch (error) {}
    }
    return saved;
  }

  var catalogItems = typeof CATALOG !== "undefined" && Array.isArray(CATALOG) ? CATALOG : [];
  var livePaths = new Set();
  catalogItems.forEach(function (item) {
    if (item && item.status === "live" && item.url) {
      var path = normalizePath(item.url);
      if (path) livePaths.add(path);
    }
  });

  function getCompleted() {
    var completed = new Set();
    readArray(COMPLETED_KEY).forEach(function (value) {
      var path = normalizePath(value);
      if (path && livePaths.has(path)) completed.add(path);
    });
    return completed;
  }

  function ensureMasteryCard() {
    var hero = document.querySelector(".hero");
    if (!hero || document.getElementById("vsh-mastery-card")) return null;

    var card = document.createElement("section");
    card.id = "vsh-mastery-card";
    card.className = "vsh-mastery-card";
    card.setAttribute("aria-label", "Learning mastery progress");

    var ring = document.createElement("div");
    ring.className = "vsh-mastery-ring";
    ring.setAttribute("role", "img");
    ring.setAttribute("aria-label", "Simulation completion progress");
    var ringInner = document.createElement("div");
    ringInner.className = "vsh-mastery-ring__inner";
    var percent = document.createElement("strong");
    percent.className = "vsh-mastery-ring__value";
    var ringLabel = document.createElement("span");
    ringLabel.className = "vsh-mastery-ring__label";
    ringLabel.textContent = "MASTERY";
    ringInner.appendChild(percent);
    ringInner.appendChild(ringLabel);
    ring.appendChild(ringInner);

    var meta = document.createElement("div");
    meta.className = "vsh-mastery-meta";
    var heading = document.createElement("strong");
    heading.textContent = "Your mastery";
    var detail = document.createElement("p");
    var badges = document.createElement("div");
    badges.className = "vsh-mastery-badges";
    meta.appendChild(heading);
    meta.appendChild(detail);
    meta.appendChild(badges);
    card.appendChild(ring);
    card.appendChild(meta);

    var stats = hero.querySelector(".stats");
    if (stats && stats.parentNode) stats.parentNode.insertBefore(card, stats.nextSibling);
    else hero.appendChild(card);

    card._vshElements = { ring: ring, percent: percent, detail: detail, badges: badges };
    return card;
  }

  function applyProgress() {
    var completed = getCompleted();
    var total = livePaths.size;
    var count = completed.size;
    var ratio = total ? Math.round(count / total * 100) : 0;
    if (progressStat) progressStat.textContent = count + " / " + total;

    if (grid) {
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
          badge.setAttribute("aria-label", "Simulation marked complete");
          heading.appendChild(badge);
        } else if (!completed.has(path) && badge) {
          badge.remove();
        }
      });
    }

    var card = ensureMasteryCard();
    if (!card) return;
    var elements = card._vshElements;
    elements.ring.style.setProperty("--mastery-angle", (ratio * 3.6).toFixed(1) + "deg");
    elements.ring.setAttribute("aria-label", ratio + " percent complete");
    elements.percent.textContent = ratio + "%";

    var streak = updateDailyStreak();
    elements.detail.textContent = count + " of " + total + " labs completed · " + (streak.streak || 0) + " day streak";
    elements.badges.textContent = "";

    var milestones = [
      { at: 1, label: "First Lab" },
      { at: 5, label: "Explorer" },
      { at: 10, label: "Focused Learner" },
      { at: 25, label: "Lab Specialist" },
      { at: 50, label: "Physics Master" },
      { at: 100, label: "Hub Legend" }
    ];
    var earned = milestones.filter(function (milestone) { return count >= milestone.at; }).slice(-3);
    if (!earned.length) earned = [{ at: 1, label: "First Lab" }];
    earned.forEach(function (milestone) {
      var badge = document.createElement("span");
      badge.className = "vsh-mastery-badge" + (count >= milestone.at ? "" : " is-locked");
      badge.textContent = (count >= milestone.at ? "✦ " : "◇ ") + milestone.label;
      elements.badges.appendChild(badge);
    });
  }

  var style = document.createElement("style");
  style.textContent = ".vsh-completed-badge{display:inline-flex;align-items:center;vertical-align:middle;margin:6px 0 0 8px;padding:3px 8px;border:1px solid rgba(124,240,189,.42);border-radius:999px;background:rgba(124,240,189,.10);color:#7cf0bd;font-size:10px;font-weight:800;letter-spacing:.02em;white-space:nowrap}";
  document.head.appendChild(style);

  window.addEventListener("storage", function (event) {
    if (!event.key || event.key === COMPLETED_KEY || event.key === STREAK_KEY) applyProgress();
  });

  if (grid && typeof MutationObserver === "function") {
    var observer = new MutationObserver(applyProgress);
    observer.observe(grid, { childList: true, subtree: true });
  }

  applyProgress();
})();
