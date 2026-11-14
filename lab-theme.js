
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

  // ---- Liquid learning layer: DOM/CSS only; simulation engines stay untouched. ----
  function vshLabSlug() {
    return (window.location.pathname.split("/").pop() || "").replace(/\.html$/i, "").toLowerCase();
  }

  function vshRecordDailyVisit() {
    var key = "vsh-daily-streak-v1";
    var now = new Date();
    var today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
    var data = { lastVisit: "", streak: 0, totalDays: 0 };
    try {
      var saved = JSON.parse(localStorage.getItem(key) || "{}");
      if (saved && typeof saved === "object") data = Object.assign(data, saved);
    } catch (error) {}
    if (data.lastVisit !== today) {
      var yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      var yesterday = [yesterdayDate.getFullYear(), String(yesterdayDate.getMonth() + 1).padStart(2, "0"), String(yesterdayDate.getDate()).padStart(2, "0")].join("-");
      data.streak = data.lastVisit === yesterday ? Math.max(1, Number(data.streak) || 0) + 1 : 1;
      data.totalDays = Math.max(0, Number(data.totalDays) || 0) + 1;
      data.lastVisit = today;
      try { localStorage.setItem(key, JSON.stringify(data)); } catch (error) {}
    }
    return data;
  }

  function vshUpdateRangeFill(range) {
    if (!range || range.type !== "range") return;
    var min = Number(range.min || 0);
    var max = Number(range.max || 100);
    var value = Number(range.value || 0);
    var percent = max > min ? Math.max(0, Math.min(100, (value - min) / (max - min) * 100)) : 0;
    range.style.setProperty("--vsh-range-progress", percent.toFixed(2) + "%");
  }

  function ensureLiquidRangeInputs() {
    if (!window.__vshLiquidRangesBound) {
      window.__vshLiquidRangesBound = true;
      document.addEventListener("input", function (event) {
        if (event.target && event.target.type === "range") {
          vshUpdateRangeFill(event.target);
          if (window.__vshFormulaRefresh) window.__vshFormulaRefresh();
        }
      }, true);
      document.addEventListener("change", function (event) {
        if (event.target && event.target.type === "range") {
          vshUpdateRangeFill(event.target);
          if (window.__vshFormulaRefresh) window.__vshFormulaRefresh();
        }
      }, true);
    }
    Array.prototype.forEach.call(document.querySelectorAll('input[type="range"]'), vshUpdateRangeFill);
  }

  function ensureSoftInteractionFeedback() {
    if (window.__vshSoftFeedbackBound) return;
    window.__vshSoftFeedbackBound = true;
    var audioContext = null;
    var lastSoundAt = 0;

    function playSoftDrop(frequency) {
      var AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      var now = Date.now();
      if (now - lastSoundAt < 55) return;
      lastSoundAt = now;
      try {
        if (!audioContext) audioContext = new AudioContextClass();
        if (audioContext.state === "suspended" && audioContext.resume) audioContext.resume();
        var oscillator = audioContext.createOscillator();
        var gain = audioContext.createGain();
        var start = audioContext.currentTime;
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency || 620, start);
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(180, (frequency || 620) * 0.58), start + 0.075);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.018, start + 0.009);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.09);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.095);
        oscillator.onended = function () {
          try { oscillator.disconnect(); gain.disconnect(); } catch (error) {}
        };
      } catch (error) {}
    }

    function hapticAndSound(frequency) {
      try {
        if (navigator.vibrate) navigator.vibrate(10);
      } catch (error) {}
      playSoftDrop(frequency);
    }

    document.addEventListener("click", function (event) {
      if (event.isTrusted === false) return;
      var target = event.target;
      var button = target && target.closest ? target.closest("button,.btn,[role='button'],input[type='button'],input[type='submit']") : null;
      if (!button || button.disabled) return;
      hapticAndSound(button.classList && button.classList.contains("primary") ? 680 : 520);
    }, true);

    document.addEventListener("change", function (event) {
      var control = event.target;
      if (!control || control.type !== "range" || event.isTrusted === false) return;
      hapticAndSound(440);
    }, true);
  }

  function ensureFluidBackground() {
    if (!/^\/projects\/.+\.html$/i.test(window.location.pathname)) return;
    if (document.getElementById("vsh-fluid-background") || !document.body) return;

    var canvas = document.createElement("canvas");
    canvas.id = "vsh-fluid-background";
    canvas.className = "vsh-fluid-canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.setAttribute("role", "presentation");
    document.body.insertBefore(canvas, document.body.firstChild);
    document.body.classList.add("vsh-fluid-active");

    var cores = Number(navigator.hardwareConcurrency || 4);
    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var context = null;
    try { context = canvas.getContext("2d", { alpha: true }); } catch (error) {}
    if (!context || cores < 4 || reducedMotion) {
      canvas.classList.add("is-static");
      return;
    }

    var width = 0, height = 0, ratio = 1, frameId = 0;
    var pointer = { x: -1000, y: -1000, at: 0 };
    var startedAt = 0;
    function resize() {
      ratio = Math.min(window.devicePixelRatio || 1, 1.25);
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = "100vw";
      canvas.style.height = "100vh";
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    function blob(x, y, rx, ry, rgb, opacity) {
      var gradient = context.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
      gradient.addColorStop(0, "rgba(" + rgb + "," + opacity + ")");
      gradient.addColorStop(0.42, "rgba(" + rgb + "," + (opacity * 0.58) + ")");
      gradient.addColorStop(1, "rgba(" + rgb + ",0)");
      context.fillStyle = gradient;
      context.beginPath();
      context.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      context.fill();
    }
    function draw(now) {
      if (document.hidden) { frameId = 0; return; }
      if (!startedAt) startedAt = now;
      var t = (now - startedAt) / 1000;
      context.clearRect(0, 0, width, height);
      var px = pointer.x, py = pointer.y;
      var influence = Math.max(0, 1 - (now - pointer.at) / 1500);
      var dx = px * influence, dy = py * influence;
      var size = Math.min(width, height);
      blob(width * (0.18 + 0.055 * Math.sin(t * 0.17)) + dx * 0.035,
        height * (0.28 + 0.065 * Math.cos(t * 0.13)) + dy * 0.035,
        size * 0.42, size * 0.30, "98,231,255", 0.13);
      blob(width * (0.82 + 0.06 * Math.cos(t * 0.14)) - dx * 0.025,
        height * (0.66 + 0.07 * Math.sin(t * 0.16)) - dy * 0.025,
        size * 0.40, size * 0.34, "167,139,250", 0.12);
      blob(width * (0.52 + 0.045 * Math.sin(t * 0.11)),
        height * (0.12 + 0.05 * Math.cos(t * 0.19)),
        size * 0.24, size * 0.20, "98,231,255", 0.055);

      if (influence > 0.01) {
        var ripple = (1 - influence) * 88 + 14;
        context.beginPath();
        context.arc(px, py, ripple, 0, Math.PI * 2);
        context.strokeStyle = "rgba(98,231,255," + (0.10 * influence).toFixed(3) + ")";
        context.lineWidth = 1;
        context.stroke();
      }
      frameId = window.requestAnimationFrame(draw);
    }
    function onPointerMove(event) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.at = performance.now();
    }
    function onVisibilityChange() {
      if (document.hidden) {
        if (frameId) window.cancelAnimationFrame(frameId);
        frameId = 0;
      } else if (!frameId) {
        frameId = window.requestAnimationFrame(draw);
      }
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    frameId = window.requestAnimationFrame(draw);
  }

  function ensureDidYouKnow() {
    if (!/^\/projects\/.+\.html$/i.test(window.location.pathname)) return;
    if (document.getElementById("vsh-fact-trigger")) return;

    var slug = vshLabSlug();
    var facts = {
      "projectile": "On level ground with no air resistance, 45° maximizes range because sin(2θ) reaches its maximum.",
      "projectile-air": "Air resistance breaks the complementary-angle symmetry, so the best launch angle is usually below 45°.",
      "projectile-3d": "In ideal projectile motion, horizontal velocity stays constant while vertical velocity changes linearly with time.",
      "min-speed-target": "The minimum-speed target problem can have two launch angles for one target point; the limiting case has one.",
      "atwood": "For an ideal Atwood machine, the acceleration depends on the mass difference divided by the total mass.",
      "kinematics-1d": "The slope of an x–t graph is velocity; the slope of a v–t graph is acceleration.",
      "free-fall": "In vacuum, objects with different masses have the same gravitational acceleration at the same location.",
      "shm": "For an ideal spring–mass oscillator, the period does not depend on amplitude.",
      "damped-shm": "Damping removes mechanical energy from an oscillator, reducing its amplitude over time.",
      "pendulum": "For small oscillations, a simple pendulum's period depends on length and gravity, not bob mass.",
      "ohm": "An ohmic resistor has a linear V–I relationship when its physical conditions, especially temperature, stay constant.",
      "momentum": "Total momentum is conserved in an isolated system, even when kinetic energy is not.",
      "momentum-2d": "Momentum conservation applies independently to the horizontal and vertical components.",
      "vectors-2d": "A vector's components depend on the chosen axes, but its magnitude does not.",
      "work-energy": "The net work done on an object equals its change in kinetic energy.",
      "circular-motion": "An object moving in a circle can have constant speed while its velocity continually changes direction.",
      "spring-force": "Hooke's law is a linear approximation that works while a spring stays within its elastic range.",
      "coulomb": "For point charges in a uniform medium, Coulomb force falls with the square of the separation.",
      "capacitor": "For a linear capacitor, stored charge is proportional to potential difference: Q = CV.",
      "wave-on-string": "For a wave on a stretched string, wave speed depends on tension and linear mass density.",
      "doppler": "The Doppler effect changes observed frequency through relative motion, not because the source changes its emitted frequency."
    };
    var fact = facts[slug];
    if (!fact) {
      var heading = document.querySelector("main h1") || document.querySelector("h1");
      var title = heading ? heading.textContent.replace(/\s+/g, " ").trim() : "this model";
      var lower = (slug + " " + title).toLowerCase();
      if (/lens|mirror|optic|refraction|snell/.test(lower)) fact = "In geometrical optics, ray diagrams work because light travels in straight lines through a uniform medium.";
      else if (/electric|magnetic|circuit|current|ohm|capacitor|charge/.test(lower)) fact = "In a circuit, charge is conserved: current entering a junction equals current leaving it.";
      else if (/fluid|bernoulli|buoy|pressure|viscosity/.test(lower)) fact = "Fluid pressure at a point in a static fluid increases with depth.";
      else if (/wave|sound|resonance|beats|interference/.test(lower)) fact = "Superposition means overlapping waves add their instantaneous displacements.";
      else fact = "Change one control at a time and compare the readouts; this makes the model's cause-and-effect relationships easier to identify.";
    }

    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.id = "vsh-fact-trigger";
    trigger.className = "vsh-fact-trigger";
    trigger.textContent = "?";
    trigger.setAttribute("aria-label", "Open a physics fact");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", "vsh-fact-popover");

    var popover = document.createElement("section");
    popover.id = "vsh-fact-popover";
    popover.className = "vsh-fact-popover";
    popover.hidden = true;
    popover.setAttribute("role", "dialog");
    popover.setAttribute("aria-modal", "false");
    popover.setAttribute("aria-labelledby", "vsh-fact-title");

    var top = document.createElement("div");
    top.className = "vsh-fact-popover__top";
    var titleEl = document.createElement("strong");
    titleEl.id = "vsh-fact-title";
    titleEl.textContent = "DID YOU KNOW?";
    var close = document.createElement("button");
    close.type = "button";
    close.className = "vsh-fact-popover__close";
    close.textContent = "×";
    close.setAttribute("aria-label", "Close physics fact");
    var content = document.createElement("p");
    content.textContent = fact;
    top.appendChild(titleEl);
    top.appendChild(close);
    popover.appendChild(top);
    popover.appendChild(content);
    document.body.appendChild(trigger);
    document.body.appendChild(popover);

    function setOpen(open) {
      popover.hidden = !open;
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) close.focus();
      else trigger.focus();
    }
    trigger.addEventListener("click", function () {
      setOpen(popover.hidden);
    });
    close.addEventListener("click", function () { setOpen(false); });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !popover.hidden) setOpen(false);
    });
  }

  function ensureLiveFormulaAndPresets() {
    if (!/^\/projects\/.+\.html$/i.test(window.location.pathname)) return;
    if (document.getElementById("vsh-live-formula")) return;

    var slug = vshLabSlug();
    var controlCandidates = Array.prototype.slice.call(document.querySelectorAll(".panel,aside,fieldset,.control-panel,.controls"));
    var controlPanel = controlCandidates.find(function (candidate) {
      var inputs = candidate.querySelectorAll('input[type="range"],input[type="number"],select');
      var heading = candidate.querySelector(".ph,.panel-head,h2,h3,legend");
      return inputs.length > 0 && (!heading || /control|parameter|setting|adjust/i.test(heading.textContent));
    });
    if (!controlPanel) {
      controlPanel = controlCandidates.find(function (candidate) {
        return candidate.querySelector('input[type="range"],input[type="number"],select');
      });
    }
    if (!controlPanel) return;

    var controlBody = controlPanel.querySelector(".pb,.panel-body") || controlPanel;
    var formulas = {
      "projectile": "R = u² · sin(2θ) / g",
      "projectile-air": "x(t), y(t) with drag force",
      "projectile-3d": "R = u² · sin(2θ) / g",
      "min-speed-target": "y = x tanθ − gx² / (2u² cos²θ)",
      "atwood": "a = (m₂ − m₁)g / (m₁ + m₂)",
      "kinematics-1d": "x = x₀ + ut + ½at²",
      "uniform-accel": "v = u + at",
      "free-fall": "v² = u² + 2as",
      "shm": "T = 2π√(m/k)",
      "damped-shm": "m x¨ + c x˙ + kx = 0",
      "pendulum": "T ≈ 2π√(L/g)  (small angle)",
      "ohm": "I = V / R",
      "current-electricity": "V = IR",
      "momentum": "p = mv  ·  Σp_before = Σp_after",
      "momentum-2d": "Σpₓ,before = Σpₓ,after;  Σpᵧ,before = Σpᵧ,after",
      "work-energy": "W_net = ΔK",
      "vectors-2d": "R = √(Rₓ² + Rᵧ²)",
      "circular-motion": "a_c = v²/r = ω²r",
      "circular-motion-intro": "a_c = v²/r = ω²r",
      "spring-force": "F = −kx",
      "coulomb": "F = k|q₁q₂| / r²",
      "capacitor": "Q = CV",
      "capacitors": "C_eq(series)⁻¹ = Σ(1/Cᵢ)",
      "lens-formula": "1/f = 1/v − 1/u",
      "mirror-formula": "1/f = 1/v + 1/u",
      "wave-on-string": "v = fλ = √(T/μ)",
      "sound-waves": "v = fλ"
    };
    var formula = formulas[slug] || "";
    if (!formula) {
      var code = document.querySelector("main .formulas code,main .explain code,main .explain,main code,.explain code");
      if (code) formula = (code.textContent || "").replace(/\s+/g, " ").trim().slice(0, 110);
    }
    if (!formula) formula = "Adjust one variable and observe the live model.";

    var presetRow = null;
    var gravity = slug.indexOf("projectile") === 0 ? controlPanel.querySelector("#g") : null;
    if (gravity && gravity.type === "range") {
      if (Number(gravity.max) < 24.8) gravity.max = "24.8";
      vshUpdateRangeFill(gravity);
      presetRow = document.createElement("div");
      presetRow.className = "vsh-preset-row";
      var presetTitle = document.createElement("span");
      presetTitle.className = "vsh-learning-eyebrow";
      presetTitle.textContent = "GRAVITY PRESETS";
      var presetButtons = document.createElement("div");
      presetButtons.className = "vsh-preset-buttons";
      [
        { label: "Earth · 9.8", value: 9.8 },
        { label: "Moon · 1.6", value: 1.6 },
        { label: "Jupiter · 24.8", value: 24.8 }
      ].forEach(function (preset) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "vsh-preset-button";
        button.textContent = preset.label;
        button.addEventListener("click", function () {
          var startValue = Number(gravity.value);
          var targetValue = preset.value;
          var started = 0;
          var duration = 260;
          var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          if (reduce) duration = 0;
          function animate(timestamp) {
            if (!started) started = timestamp;
            var progress = duration ? Math.min(1, (timestamp - started) / duration) : 1;
            var eased = 1 - Math.pow(1 - progress, 3);
            gravity.value = (startValue + (targetValue - startValue) * eased).toFixed(1);
            vshUpdateRangeFill(gravity);
            if (window.__vshFormulaRefresh) window.__vshFormulaRefresh();
            if (progress < 1) {
              window.requestAnimationFrame(animate);
            } else {
              gravity.value = String(targetValue);
              vshUpdateRangeFill(gravity);
              // One native event lets the page's existing control handler refresh its own model.
              gravity.dispatchEvent(new Event("input", { bubbles: true }));
            }
          }
          window.requestAnimationFrame(animate);
        });
        presetButtons.appendChild(button);
      });
      presetRow.appendChild(presetTitle);
      presetRow.appendChild(presetButtons);
      controlBody.appendChild(presetRow);
    }

    var formulaPanel = document.createElement("section");
    formulaPanel.id = "vsh-live-formula";
    formulaPanel.className = "vsh-learning-panel vsh-formula-panel";
    formulaPanel.setAttribute("aria-label", "Live formula and simulation progress");

    var eyebrow = document.createElement("div");
    eyebrow.className = "vsh-learning-eyebrow";
    eyebrow.textContent = "LIVE FORMULA";
    var formulaText = document.createElement("div");
    formulaText.className = "vsh-formula-text";
    formulaText.textContent = formula;
    var values = document.createElement("div");
    values.className = "vsh-formula-values";
    var completion = document.createElement("button");
    completion.type = "button";
    completion.className = "vsh-complete-button";

    var completedKey = "vsh-mastery-completed-v1";
    var pagePath = window.location.pathname.replace(/\/+$/, "") || "/";
    function readCompleted() {
      try {
        var data = JSON.parse(localStorage.getItem(completedKey) || "[]");
        return Array.isArray(data) ? data : [];
      } catch (error) { return []; }
    }
    function paintCompletion() {
      var done = readCompleted().indexOf(pagePath) >= 0;
      completion.textContent = done ? "✓ Lab completed" : "Mark this lab complete";
      completion.setAttribute("aria-pressed", done ? "true" : "false");
      completion.classList.toggle("is-complete", done);
    }
    completion.addEventListener("click", function () {
      var done = readCompleted();
      if (done.indexOf(pagePath) < 0) {
        done.push(pagePath);
        try { localStorage.setItem(completedKey, JSON.stringify(done)); } catch (error) {}
      }
      paintCompletion();
    });

    function labelFor(control) {
      if (control.getAttribute("aria-label")) return control.getAttribute("aria-label").replace(/\s+/g, " ").trim();
      if (control.labels && control.labels.length) return (control.labels[0].textContent || "").replace(/\s+/g, " ").trim();
      var previous = control.previousElementSibling;
      if (previous) {
        var clone = previous.cloneNode(true);
        Array.prototype.forEach.call(clone.querySelectorAll("b,strong,output"), function (node) { node.remove(); });
        var text = (clone.textContent || "").replace(/\s+/g, " ").trim();
        if (text) return text.slice(0, 24);
      }
      return (control.id || control.name || "Value").replace(/[-_]/g, " ");
    }
    function valueFor(control) {
      var value = String(control.value == null ? "" : control.value);
      var id = (control.id || "").toLowerCase();
      if (id === "u" || id === "u0") return value + " m/s";
      if (id === "th" || id === "theta" || id === "angle") return value + "°";
      if (id === "g" || id === "gravity") return value + " m/s²";
      if (id === "m" || id.indexOf("mass") >= 0) return value + " kg";
      if (id === "v" || id === "voltage") return value + " V";
      if (id === "r" || id === "resistance") return value + " Ω";
      return value;
    }

    var liveControls = Array.prototype.slice.call(controlBody.querySelectorAll('input[type="range"],input[type="number"],select')).slice(0, 4);
    function refreshValues() {
      values.textContent = "";
      liveControls.forEach(function (control) {
        var chip = document.createElement("span");
        chip.className = "vsh-formula-chip";
        var label = labelFor(control);
        chip.textContent = label + ": " + valueFor(control);
        values.appendChild(chip);
      });
    }
    window.__vshFormulaRefresh = refreshValues;
    formulaPanel.appendChild(eyebrow);
    formulaPanel.appendChild(formulaText);
    formulaPanel.appendChild(values);
    formulaPanel.appendChild(completion);
    controlBody.appendChild(formulaPanel);
    refreshValues();
    paintCompletion();

    document.addEventListener("storage", function () {
      paintCompletion();
    });
  }

  function initializeLabTools() {
    ensureFavButton();
    ensureFeedbackButton();
    ensureShareButton();
    ensureLearningUI();
    vshRecordDailyVisit();
    ensureLiquidRangeInputs();
    ensureSoftInteractionFeedback();
    ensureFluidBackground();
    ensureDidYouKnow();
    ensureLiveFormulaAndPresets();
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
    link.href = "/sim-ui.css?v=2";
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

    // Place the insight directly below the page header in normal document
    // flow. It stays top-aligned without covering the hero, canvas or controls.
    var header = document.querySelector("body > header, header");
    var main = document.querySelector("main");
    if (header && header.parentNode) header.parentNode.insertBefore(panel, header.nextSibling);
    else if (main && main.parentNode) main.parentNode.insertBefore(panel, main);
    else document.body.insertBefore(panel, document.body.firstChild);

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
