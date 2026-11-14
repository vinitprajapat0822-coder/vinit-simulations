
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
    ensureLearningUI();
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

  function ensureLearningUIStyles() {
    if (document.getElementById("vsh-sim-ui-styles")) return;
    var link = document.createElement("link");
    link.id = "vsh-sim-ui-styles";
    link.rel = "stylesheet";
    link.href = "/sim-ui.css?v=1";
    document.head.appendChild(link);
  }

  function ensureSmartInsight() {
    if (document.getElementById("vsh-smart-insight")) return;

    var panel = document.createElement("section");
    panel.id = "vsh-smart-insight";
    panel.className = "sim-smart-insight";
    panel.setAttribute("role", "status");
    panel.setAttribute("aria-live", "polite");
    panel.setAttribute("aria-atomic", "true");

    var eyebrow = document.createElement("div");
    eyebrow.className = "sim-smart-insight__eyebrow";
    eyebrow.textContent = "SMART INSIGHT";
    var message = document.createElement("p");
    message.id = "vsh-smart-insight-text";
    panel.appendChild(eyebrow);
    panel.appendChild(message);

    // Keep the insight in document flow below the page introduction. It
    // becomes sticky while scrolling, so it never covers the title or canvas.
    var hero = document.querySelector("main .hero, main .hero-section");
    var main = document.querySelector("main");
    if (hero && hero.parentNode) hero.parentNode.insertBefore(panel, hero.nextSibling);
    else if (main) main.insertBefore(panel, main.firstChild);
    else document.body.appendChild(panel);

    var previousValues = Object.create(null);

    function controlLabel(control) {
      if (!control) return "Parameter";
      var aria = control.getAttribute("aria-label");
      if (aria) return aria.trim();

      if (control.labels && control.labels.length) {
        var labels = Array.prototype.map.call(control.labels, function (label) {
          return (label.textContent || "").replace(/\s+/g, " ").trim();
        }).join(" ");
        if (labels) return labels;
      }

      var previous = control.previousElementSibling;
      if (previous && /^(LABEL|DIV|SPAN)$/.test(previous.tagName)) {
        var clone = previous.cloneNode(true);
        Array.prototype.forEach.call(clone.querySelectorAll("b,strong,output"), function (node) {
          if (node.parentNode) node.parentNode.removeChild(node);
        });
        var text = (clone.textContent || "").replace(/\s+/g, " ").trim();
        if (text) return text;
      }

      return (control.id || control.name || "Parameter").replace(/[-_]/g, " ").trim();
    }

    function insight(heading, detail, tone) {
      return { heading: heading, detail: detail, tone: tone || "cyan" };
    }

    function explainControl(control, previous, current, hasPrevious) {
      var label = controlLabel(control);
      var normalized = label.toLowerCase();
      var path = (window.location.pathname.split("/").pop() || "").replace(/\.html$/i, "").toLowerCase();
      var numeric = Number(current);
      var validNumber = current !== "" && Number.isFinite(numeric);
      var changedUp = hasPrevious && Number.isFinite(Number(previous)) && validNumber && numeric > Number(previous);
      var changedDown = hasPrevious && Number.isFinite(Number(previous)) && validNumber && numeric < Number(previous);

      if (path.indexOf("projectile") !== -1 && /(angle|theta|θ)/i.test(label) && validNumber) {
        if (numeric >= 89.5) return insight("Vertical Launch.", "At 90°, horizontal velocity is zero, so horizontal range is zero.", "cyan");
        if (Math.abs(numeric - 45) <= 0.5) return insight("Optimal Angle!", "45° gives maximum range on level ground when air resistance is ignored.", "cyan");
        if (numeric > 45) return insight("Higher Launch Angle.", "More velocity points upward, increasing height while reducing range from its 45° maximum.", "purple");
        return insight("Lower Launch Angle.", "On level ground, increasing the angle toward 45° increases the range.", "purple");
      }

      if (/(velocity|speed|launch speed)/i.test(label) && changedUp) {
        return insight("Velocity Increased.", "The object covers more distance in the same time; its path may reach higher too.", "purple");
      }
      if (/(velocity|speed|launch speed)/i.test(label) && changedDown) {
        return insight("Velocity Reduced.", "The object covers less distance in the same time when other conditions stay fixed.", "purple");
      }

      if (path.indexOf("projectile") !== -1 && /(gravity|(^|\s)g($|\s))/i.test(label)) {
        return insight("Gravity Changed.", "Stronger gravity shortens flight time, maximum height and range for the same launch.", "purple");
      }
      if ((path === "shm" || path.indexOf("damped-shm") !== -1) && /mass/i.test(label)) {
        return insight("Mass Changed.", "A heavier oscillator moves more slowly when spring stiffness stays constant.", "purple");
      }
      if ((path === "shm" || path.indexOf("damped-shm") !== -1) && /(spring|stiffness|(^|\s)k($|\s))/i.test(label)) {
        return insight("Spring Stiffness Changed.", "A stiffer spring increases angular frequency and reduces the period.", "purple");
      }
      if (path.indexOf("atwood") !== -1 && /mass/i.test(label)) {
        return insight("Mass Balance Changed.", "The difference between the two masses sets the system's acceleration and direction.", "purple");
      }
      if ((path.indexOf("ohm") !== -1 || path.indexOf("current-electricity") !== -1) && /voltage/i.test(label)) {
        return insight("Voltage Changed.", "With resistance fixed, current changes in direct proportion to voltage: I = V/R.", "purple");
      }
      if ((path.indexOf("ohm") !== -1 || path.indexOf("current-electricity") !== -1) && /resistance/i.test(label)) {
        return insight("Resistance Changed.", "With voltage fixed, greater resistance means lower current: I = V/R.", "purple");
      }

      if (/mass/i.test(normalized)) {
        return insight("Mass Updated.", "For the same net force, a larger mass produces a smaller acceleration.", "purple");
      }
      if (/angle|theta|θ/i.test(normalized)) {
        return insight("Angle Updated.", "The angle changes how the motion is split into horizontal and vertical components.", "purple");
      }
      if (/gravity/i.test(normalized)) {
        return insight("Gravity Updated.", "Gravity changes the rate of vertical acceleration and the system's motion.", "purple");
      }
      if (/resistance/i.test(normalized)) {
        return insight("Resistance Updated.", "Resistance opposes current; compare the current and power readouts.", "purple");
      }
      if (/voltage/i.test(normalized)) {
        return insight("Voltage Updated.", "Voltage is energy supplied per unit charge. Watch how current responds.", "purple");
      }
      if (/time/i.test(normalized)) {
        return insight("Time Updated.", "Follow the live position, velocity and energy readouts as the system evolves.", "purple");
      }
      if (/amplitude/i.test(normalized)) {
        return insight("Amplitude Updated.", "Amplitude changes the maximum displacement. In ideal SHM, it does not change the period.", "purple");
      }
      if (/energy/i.test(normalized)) {
        return insight("Energy Updated.", "Compare kinetic and potential energy to see how energy is transferred in the system.", "purple");
      }
      if (validNumber) {
        return insight("Parameter Updated.", label + " is now " + current + ". Compare the live readouts to see its effect.", "cyan");
      }
      return insight("Parameter Updated.", "Change another control and compare the new measurements with the model.", "cyan");
    }

    function render(result) {
      message.textContent = "";
      var heading = document.createElement("span");
      heading.className = "sim-smart-insight__label sim-smart-insight__label--" + result.tone;
      heading.textContent = result.heading + " ";
      message.appendChild(heading);
      message.appendChild(document.createTextNode(result.detail));
    }

    function update(control) {
      if (!control) return;
      var key = control.id || control.name || controlLabel(control);
      var current = String(control.value == null ? "" : control.value);
      var hasPrevious = Object.prototype.hasOwnProperty.call(previousValues, key);
      var previous = hasPrevious ? previousValues[key] : current;
      render(explainControl(control, previous, current, hasPrevious));
      previousValues[key] = current;
    }

    // Save every initial control value so increases/decreases are identified
    // from the first user gesture, not only after an earlier interaction.
    Array.prototype.forEach.call(
      document.querySelectorAll('input:not([type="hidden"]),select,textarea'),
      function (control) {
        var key = control.id || control.name || controlLabel(control);
        previousValues[key] = String(control.value == null ? "" : control.value);
      }
    );

    document.addEventListener("input", function (event) {
      var target = event.target;
      if (target && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) update(target);
    }, true);
    document.addEventListener("change", function (event) {
      var target = event.target;
      if (target && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) update(target);
    }, true);

    var initial = null;
    if (window.location.pathname.indexOf("projectile") !== -1) {
      initial = document.getElementById("th") || document.querySelector('input[type="range"]');
    } else {
      initial = document.querySelector('input[type="range"],select,input[type="number"]');
    }
    if (initial) render(explainControl(initial, initial.value, initial.value, false));
  }

  function ensureMobileControlDock() {
    var media = window.matchMedia ? window.matchMedia("(max-width: 768px)") : null;
    var mobile = media ? media.matches : window.innerWidth <= 768;
    var dock = document.getElementById("vsh-control-dock");
    var records = window.__vshDockRecords || (window.__vshDockRecords = {
      panels: [], actions: null, favorite: null, moved: false
    });

    if (!dock) {
      dock = document.createElement("section");
      dock.id = "vsh-control-dock";
      dock.className = "sim-control-dock";
      dock.setAttribute("aria-label", "Simulation controls");
      var header = document.createElement("div");
      header.className = "sim-control-dock__header";
      var toggle = document.createElement("button");
      toggle.id = "vsh-control-dock-toggle";
      toggle.type = "button";
      toggle.className = "sim-control-dock__toggle";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", "vsh-control-dock-content");
      toggle.textContent = "⌃ Controls";
      var tools = document.createElement("div");
      tools.className = "sim-control-dock__tools";
      header.appendChild(toggle);
      header.appendChild(tools);
      var content = document.createElement("div");
      content.id = "vsh-control-dock-content";
      content.className = "sim-control-dock__content";
      dock.appendChild(header);
      dock.appendChild(content);
      document.body.appendChild(dock);

      toggle.addEventListener("click", function () {
        var open = !dock.classList.contains("is-open");
        dock.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.textContent = open ? "⌄ Hide controls" : "⌃ Controls";
        document.body.classList.toggle("vsh-dock-open", open);
      });
    }

    var toolsHost = dock.querySelector(".sim-control-dock__tools");
    var contentHost = dock.querySelector(".sim-control-dock__content");

    function moveNode(node, host, panelPlaceholder) {
      if (!node || !node.parentNode) return null;
      var placeholder = document.createElement(panelPlaceholder ? "div" : "span");
      placeholder.className = panelPlaceholder ? "sim-dock-placeholder" : "sim-dock-anchor";
      if (panelPlaceholder) placeholder.textContent = "Controls are available in the bottom dock.";
      node.parentNode.insertBefore(placeholder, node);
      var savedStyle = node.getAttribute("style");
      host.appendChild(node);
      return {node:node,placeholder:placeholder,savedStyle:savedStyle};
    }
    function restoreNode(record) {
      if (!record || !record.node || !record.placeholder || !record.placeholder.parentNode) return;
      record.placeholder.parentNode.insertBefore(record.node, record.placeholder);
      record.placeholder.parentNode.removeChild(record.placeholder);
      if (record.savedStyle === null) record.node.removeAttribute("style");
      else record.node.setAttribute("style", record.savedStyle);
    }

    if (mobile && !records.moved) {
      var headingNodes = document.querySelectorAll(".ph,.panel-head,h2,h3,legend,[data-section-title]");
      var candidates = [];
      Array.prototype.forEach.call(headingNodes, function (heading) {
        var headingText = (heading.textContent || "").replace(/\s+/g, " ").trim();
        if (!/(^|\b)(controls?|parameters?|adjustments?|experiment settings|inputs?)(\b|$)/i.test(headingText)) return;
        var container = heading.closest(".panel,aside,fieldset,.card,section,[class*='control']");
        if (!container || container.id === "vsh-control-dock" || container.closest("#vsh-control-dock")) return;
        if (!container.querySelector('input:not([type="hidden"]),select,textarea,button')) return;
        if (candidates.indexOf(container) === -1) candidates.push(container);
      });
      if (!candidates.length) {
        var fallback = document.querySelectorAll("aside,.control-panel,.controls,fieldset,.panel,.card");
        var best = null, bestScore = 0;
        Array.prototype.forEach.call(fallback, function (container) {
          var count = container.querySelectorAll('input:not([type="hidden"]),select,textarea,button').length;
          if (count < 2) return;
          var score = count + (/control|parameter|setting/i.test(container.className || "") ? 8 : 0);
          if (score > bestScore) { best = container; bestScore = score; }
        });
        if (best) candidates.push(best);
      }
      // If a broad wrapper and a more specific control panel both match, keep the inner panel.
      candidates = candidates.filter(function (candidate) {
        return !candidates.some(function (other) {
          return other !== candidate && candidate.contains(other);
        });
      });

      candidates.forEach(function (panel) {
        var record = moveNode(panel, contentHost, true);
        if (record) records.panels.push(record);
      });

      var actions = document.getElementById("vsh-lab-actions");
      if (actions && !records.actions) {
        records.actions = moveNode(actions, toolsHost, false);
        if (records.actions) {
          actions.style.position = "static";
          actions.style.right = "auto";
          actions.style.bottom = "auto";
          actions.style.left = "auto";
          actions.style.maxWidth = "100%";
          actions.style.margin = "0";
          actions.style.zIndex = "auto";
        }
      }

      var favorite = document.getElementById("vsh-lab-fav");
      if (favorite && !records.favorite) {
        records.favorite = moveNode(favorite, contentHost, false);
        favorite.classList.add("sim-dock-favorite");
      }

      if (records.panels.length) {
        records.moved = true;
        document.body.classList.add("vsh-has-dock");
      }
    } else if (!mobile && records.moved) {
      records.panels.forEach(restoreNode);
      records.panels = [];
      restoreNode(records.actions);
      records.actions = null;
      restoreNode(records.favorite);
      if (records.favorite && records.favorite.node) records.favorite.node.classList.remove("sim-dock-favorite");
      records.favorite = null;
      records.moved = false;
      dock.classList.remove("is-open");
      var toggleButton = document.getElementById("vsh-control-dock-toggle");
      if (toggleButton) {
        toggleButton.setAttribute("aria-expanded", "false");
        toggleButton.textContent = "⌃ Controls";
      }
      document.body.classList.remove("vsh-has-dock","vsh-dock-open");
    }
    dock.hidden = !mobile || !records.moved;
  }

  function markTouchInteractiveCanvases() {
    var scriptText = "";
    Array.prototype.forEach.call(document.scripts || [], function (script) {
      if (!script.src) scriptText += "\n" + (script.textContent || "");
    });
    var hasCanvasGestures = /(?:pointerdown|touchstart|mousedown)/i.test(scriptText) &&
      /getContext\s*\(\s*["']2d["']\s*\)/i.test(scriptText);
    if (hasCanvasGestures) {
      Array.prototype.forEach.call(document.querySelectorAll("canvas"), function (canvas) {
        canvas.classList.add("sim-touch-interactive");
      });
    }
  }

  function ensureLearningUI() {
    ensureLearningUIStyles();
    ensureSmartInsight();
    ensureMobileControlDock();
    markTouchInteractiveCanvases();
    if (!window.__vshLearningUIResizeBound) {
      window.__vshLearningUIResizeBound = true;
      var resizeTimer = 0;
      window.addEventListener("resize", function () {
        if (resizeTimer) window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(ensureMobileControlDock, 120);
      }, {passive:true});
      if (window.matchMedia) {
        var query = window.matchMedia("(max-width: 768px)");
        if (query.addEventListener) query.addEventListener("change", ensureMobileControlDock);
        else if (query.addListener) query.addListener(ensureMobileControlDock);
      }
    }
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
