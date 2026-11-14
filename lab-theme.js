
(function(){
  "use strict";
  // Theme inheritance from hub (if any)
  try {
    var t = localStorage.getItem("vsh-theme");
    if (t) document.documentElement.setAttribute("data-theme", t);
  } catch (e) {}

  // Add Google Analytics placeholder to every simulation page using this shared helper.
  function ensureAnalytics() {
    var measurementId = "G-J8SS9B47QV";
    if (!document.head) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    if (!document.getElementById("vsh-google-gtag")) {
      window.gtag("js", new Date());
      window.gtag("config", measurementId, { send_page_view: true });

      var loader = document.createElement("script");
      loader.id = "vsh-google-gtag";
      loader.async = true;
      loader.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
      document.head.appendChild(loader);
    }

    if (!document.getElementById("vsh-analytics-events")) {
      var eventsScript = document.createElement("script");
      eventsScript.id = "vsh-analytics-events";
      eventsScript.src = "/analytics-events.js";
      eventsScript.async = true;
      document.head.appendChild(eventsScript);
    }
  }

  // Inject page-specific Open Graph metadata for every simulation route.
  function ensureOpenGraph() {
    var path = window.location.pathname || "";
    if (!document.head || path.indexOf("/projects/") !== 0 || !/\.html$/i.test(path)) return;

    var titleElement = document.querySelector("title");
    var heading = document.querySelector("main h1") || document.querySelector("h1");
    var pageTitle = (titleElement && titleElement.textContent ? titleElement.textContent : (heading ? heading.textContent : "Interactive Simulation"))
      .replace(/\s+/g, " ").trim();
    var simulationName = pageTitle.replace(/\s*\|\s*Vinit Simulation Hub.*$/i, "").trim() || pageTitle;
    var ogTitle = simulationName + " | Vinit Simulation Hub";

    var descriptionMeta = document.querySelector('meta[name="description"]');
    var intro = document.querySelector("main .lead, main .intro, .lead, main p");
    var description = descriptionMeta && descriptionMeta.content ? descriptionMeta.content.trim() : "";
    if (!description && intro) description = (intro.textContent || "").replace(/\s+/g, " ").trim();
    if (!description) {
      description = simulationName + " interactive simulation in Vinit Simulation Hub. Adjust the controls and explore the live model.";
    }
    description = description.replace(/\s+/g, " ").trim().slice(0, 200);

    if (!descriptionMeta) {
      descriptionMeta = document.createElement("meta");
      descriptionMeta.name = "description";
      document.head.appendChild(descriptionMeta);
    }
    if (!descriptionMeta.content) descriptionMeta.content = description;

    function setProperty(property, content) {
      var selector = 'meta[property="' + property + '"]';
      var meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("property", property);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    }

    setProperty("og:title", ogTitle);
    setProperty("og:description", description);
    setProperty("og:url", window.location.origin + window.location.pathname);
    setProperty("og:image", window.location.origin + "/og-image.png");
    setProperty("og:type", "website");
  }

  ensureAnalytics();
  ensureOpenGraph();

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
  function initializeLabTools() {
    ensureFavButton();
    ensureFeedbackButton();
    ensureShareButton();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeLabTools);
  else initializeLabTools();


  function ensureFeedbackButton() {
    if (!/^\/projects\/.+\.html$/i.test(window.location.pathname)) return;
    if (document.getElementById("vsh-feedback-trigger")) return;

    var style = document.createElement("style");
    style.textContent =
      "#vsh-feedback-trigger{position:fixed;right:14px;bottom:72px;z-index:9998;border:1px solid rgba(255,255,255,.3);border-radius:999px;padding:11px 15px;background:linear-gradient(135deg,#67e8f9,#a78bfa);color:#07111b;font:800 13px/1.2 system-ui,sans-serif;box-shadow:0 8px 26px rgba(0,0,0,.35);cursor:pointer}" +
      "#vsh-feedback-trigger:active{transform:scale(.97)}" +
      ".vsh-feedback-modal{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:16px;background:rgba(2,6,18,.78);backdrop-filter:blur(12px)}" +
      ".vsh-feedback-modal[hidden]{display:none}" +
      ".vsh-feedback-panel{width:min(440px,100%);padding:20px;border:1px solid rgba(255,255,255,.18);border-radius:20px;background:#101a30;color:#f2f6ff;box-shadow:0 22px 70px rgba(0,0,0,.5)}" +
      ".vsh-feedback-panel h2{margin:0 0 8px;font:800 20px/1.25 system-ui,sans-serif}" +
      ".vsh-feedback-panel p{margin:0 0 12px;color:#aebbd3;font:13px/1.5 system-ui,sans-serif}" +
      ".vsh-feedback-panel textarea{width:100%;min-height:110px;resize:vertical;padding:10px;border:1px solid #344766;border-radius:12px;background:#080f20;color:#f2f6ff;font:14px/1.5 system-ui,sans-serif}" +
      ".vsh-feedback-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:14px}" +
      ".vsh-feedback-actions button,.vsh-feedback-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:9px 13px;border:1px solid #40506d;border-radius:11px;background:#17243c;color:#f2f6ff;text-decoration:none;font:750 13px system-ui,sans-serif;cursor:pointer}" +
      ".vsh-feedback-actions a{border:0;background:linear-gradient(135deg,#67e8f9,#a78bfa);color:#07111b}";
    document.head.appendChild(style);

    var trigger = document.createElement("button");
    trigger.id = "vsh-feedback-trigger";
    trigger.type = "button";
    trigger.textContent = "✉ Feedback";
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-controls", "vsh-feedback-modal");

    var modal = document.createElement("div");
    modal.id = "vsh-feedback-modal";
    modal.className = "vsh-feedback-modal";
    modal.hidden = true;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "vsh-feedback-title");

    var panel = document.createElement("div");
    panel.className = "vsh-feedback-panel";
    var title = document.createElement("h2");
    title.id = "vsh-feedback-title";
    title.textContent = "Report a bug or share feedback";
    var intro = document.createElement("p");
    intro.textContent = "Describe what happened. Your email app will open with the current page URL attached.";
    var textarea = document.createElement("textarea");
    textarea.setAttribute("aria-label", "Bug report or feedback details");
    textarea.placeholder = "What did you expect, and what happened?";
    var actions = document.createElement("div");
    actions.className = "vsh-feedback-actions";
    var close = document.createElement("button");
    close.type = "button";
    close.textContent = "Close";
    var email = document.createElement("a");
    email.textContent = "Open email app";
    email.href = "mailto:vinitprajapat0822@gmail.com";

    function updateMailto() {
      var subject = "Bug Report: " + window.location.href;
      var body = ["Page: " + window.location.href, "", "Feedback:", textarea.value || "(No additional details provided)"].join("\n");
      email.href = "mailto:vinitprajapat0822@gmail.com?subject=" +
        encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    }
    function closeModal() {
      modal.hidden = true;
      trigger.focus();
    }
    trigger.addEventListener("click", function () {
      modal.hidden = false;
      updateMailto();
      textarea.focus();
    });
    close.addEventListener("click", closeModal);
    email.addEventListener("click", updateMailto);
    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !modal.hidden) closeModal();
    });
    actions.appendChild(close);
    actions.appendChild(email);
    panel.appendChild(title);
    panel.appendChild(intro);
    panel.appendChild(textarea);
    panel.appendChild(actions);
    modal.appendChild(panel);
    document.body.appendChild(trigger);
    document.body.appendChild(modal);
  }

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

  // Add a Share button beside the existing bug-report action on every simulation page.
  function ensureShareButton() {
    var path = window.location.pathname || "";
    if (path.indexOf("/projects/") !== 0 || !/\.html$/i.test(path)) return;
    if (document.getElementById("vsh-share-trigger")) return;

    var reportButton = document.getElementById("vsh-feedback-trigger");
    if (!reportButton) return;

    reportButton.textContent = "🐞 Report Bug";
    reportButton.title = "Report a bug on this simulation";

    var group = document.createElement("div");
    group.id = "vsh-lab-actions";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", "Simulation page actions");
    group.style.cssText = "position:fixed;right:14px;bottom:calc(72px + env(safe-area-inset-bottom, 0px));z-index:9998;display:flex;align-items:center;gap:8px;max-width:calc(100vw - 28px);";

    reportButton.style.position = "static";
    reportButton.style.right = "auto";
    reportButton.style.bottom = "auto";
    reportButton.style.margin = "0";
    reportButton.style.maxWidth = "calc(50vw - 20px)";
    reportButton.style.whiteSpace = "nowrap";
    group.appendChild(reportButton);

    var shareButton = document.createElement("button");
    shareButton.id = "vsh-share-trigger";
    shareButton.type = "button";
    shareButton.textContent = "↗ Share";
    shareButton.title = "Share this simulation";
    shareButton.setAttribute("aria-label", "Share this simulation");
    shareButton.style.cssText = "position:static;display:inline-flex;align-items:center;justify-content:center;min-height:40px;max-width:calc(50vw - 20px);margin:0;padding:11px 15px;border:1px solid rgba(255,255,255,.3);border-radius:999px;background:linear-gradient(135deg,#67e8f9,#a78bfa);color:#07111b;font:800 13px/1.2 system-ui,sans-serif;white-space:nowrap;box-shadow:0 8px 26px rgba(0,0,0,.35);cursor:pointer;";

    var style = document.createElement("style");
    style.textContent = "@media(max-width:380px){#vsh-feedback-trigger,#vsh-share-trigger{min-height:38px;padding:9px 10px;font-size:11px}}#vsh-feedback-trigger:focus-visible,#vsh-share-trigger:focus-visible{outline:3px solid #fff;outline-offset:3px}";
    document.head.appendChild(style);

    var status = document.createElement("span");
    status.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.setAttribute("aria-atomic", "true");

    function announce(message) {
      status.textContent = message;
    }

    function legacyCopy(url) {
      var field = document.createElement("textarea");
      field.value = url;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.left = "-9999px";
      field.style.top = "0";
      document.body.appendChild(field);
      field.select();
      field.setSelectionRange(0, field.value.length);
      var copied = false;
      try { copied = document.execCommand("copy"); } catch (error) {}
      if (field.parentNode) field.parentNode.removeChild(field);
      if (copied) {
        announce("Simulation link copied to clipboard.");
      } else {
        announce("Clipboard copy was unavailable. A copy prompt has been opened.");
        if (typeof window.prompt === "function") window.prompt("Copy this simulation link:", url);
      }
    }

    function copyLink(url) {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard.writeText(url).then(function () {
          announce("Simulation link copied to clipboard.");
        }, function () {
          legacyCopy(url);
        });
      } else {
        legacyCopy(url);
      }
    }

    shareButton.addEventListener("click", function () {
      var shareData = {
        title: document.title || "Vinit Simulation Hub",
        url: window.location.href
      };
      if (typeof navigator.share === "function") {
        try {
          var result = navigator.share(shareData);
          if (result && typeof result.then === "function") {
            result.then(function () {}, function (error) {
              if (error && error.name === "AbortError") return;
              copyLink(shareData.url);
            });
          }
          return;
        } catch (error) {
          if (error && error.name === "AbortError") return;
        }
      }
      copyLink(shareData.url);
    });

    group.appendChild(shareButton);
    group.appendChild(status);
    document.body.appendChild(group);
  }


})();
