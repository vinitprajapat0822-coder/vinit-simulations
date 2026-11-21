/* Vinit Simulation Hub — Chemical Kinetics Lab */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const els = {
    reaction: $("reaction-select"),
    amountA: $("amount-a"), amountAValue: $("amount-a-value"),
    amountB: $("amount-b"), amountBValue: $("amount-b-value"),
    controlB: $("control-b"), legendB: $("legend-b"),
    temperature: $("temperature"), temperatureValue: $("temperature-value"),
    collisionToggle: $("collision-toggle"),
    start: $("start-button"), pause: $("pause-button"), reset: $("reset-button"),
    status: $("app-status"), rate: $("rate-value"), k: $("k-value"),
    kUnit: $("k-unit"), halfLife: $("half-life-value"), time: $("time-value"),
    rateLaw: $("rate-law"), rateLawNote: $("rate-law-note"), modelNote: $("model-note"),
    canvas: $("molecule-canvas"), chartCanvas: $("concentration-chart"),
    collisionState: $("collision-state"), collisionExplanation: $("collision-explanation"),
    collisionCounts: $("collision-counts")
  };

  const R = 8.314462618;
  const T_REF = 298.15;
  const EA = 42000;
  const ACTIVATION_THRESHOLD = 3.8;
  const PLAYBACK_RATE = 1;
  const MAX_CHART_POINTS = 240;
  const MODELS = {
    "first-order": {
      order: 1, kRef: 0.18, ea: 42000, kUnit: "s⁻¹",
      law: "\\( -\\dfrac{d[A]}{dt}=k[A] \\)",
      note: "First-order: rate is directly proportional to [A].",
      description: "Ideal first-order decay. A is converted to product P."
    },
    "second-order": {
      order: 2, kRef: 0.08, ea: 38000, kUnit: "L mol⁻¹ s⁻¹",
      law: "\\( -\\dfrac{d[A]}{dt}=k[A][B] \\)",
      note: "Second-order overall: first order in A and first order in B.",
      description: "Ideal 1:1 second-order reaction. A and B are consumed in equal molar amounts."
    }
  };

  let model = MODELS[els.reaction.value] || MODELS["first-order"];
  let state = { A: 1, B: 1, P: 0 };
  let initialA = 1;
  let initialB = 1;
  let temperature = Number(els.temperature.value);
  let rateConstant = 0;
  let elapsed = 0;
  let running = false;
  let rafId = 0;
  let previousFrame = 0;
  let frameCount = 0;
  let chart = null;
  let ctx = null;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let particles = [];
  let successfulCollisions = 0;
  let failedCollisions = 0;
  let lastParticleSync = 0;
  let lastTemperatureScale = 1;
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setStatus(message, kind) {
    els.status.textContent = message;
    els.status.dataset.state = kind || "info";
  }
  function arrheniusK(temp) {
    return model.kRef * Math.exp((-model.ea / R) * ((1 / temp) - (1 / T_REF)));
  }
  function currentRate() {
    return model.order === 1
      ? rateConstant * state.A
      : rateConstant * state.A * state.B;
  }
  function halfLife() {
    if (model.order === 1) return Math.log(2) / rateConstant;
    const delta = initialB - initialA;
    if (Math.abs(delta) < 1e-7) return 1 / (rateConstant * initialA);
    const bAtHalfA = initialB - initialA / 2;
    if (bAtHalfA <= 0) return Infinity;
    const value = Math.log((initialA * bAtHalfA) / ((initialA / 2) * initialB)) / (rateConstant * delta);
    return value > 0 && Number.isFinite(value) ? value : Infinity;
  }
  function fmt(value, digits) {
    if (!Number.isFinite(value)) return "Not reached";
    return value.toFixed(digits == null ? 3 : digits);
  }
  function updateFormula() {
    els.rateLaw.textContent = model.law;
    els.rateLawNote.textContent = model.note;
    els.kUnit.textContent = model.kUnit;
    els.modelNote.textContent = "Kinetic model: " + model.description + " Temperature-dependent k uses Ea = " + (model.ea / 1000).toFixed(1) + " kJ mol⁻¹.";
    if (window.MathJax && window.MathJax.typesetPromise) {
      if (window.MathJax.typesetClear) window.MathJax.typesetClear([els.rateLaw]);
      window.MathJax.typesetPromise([els.rateLaw]).catch(function () {});
    }
  }
  function updateReadouts() {
    rateConstant = arrheniusK(temperature);
    els.rate.textContent = currentRate().toExponential(3);
    els.k.textContent = rateConstant.toExponential(3);
    els.halfLife.textContent = fmt(halfLife(), 3);
    els.time.textContent = elapsed.toFixed(2);
    els.amountAValue.textContent = initialA.toFixed(2) + " M";
    els.amountBValue.textContent = initialB.toFixed(2) + " M";
    els.temperatureValue.textContent = temperature.toFixed(0) + " K";
  }
  function configureModel() {
    model = MODELS[els.reaction.value] || MODELS["first-order"];
    const secondOrder = model.order === 2;
    els.controlB.classList.toggle("is-hidden", !secondOrder);
    els.legendB.hidden = !secondOrder;
    els.amountB.disabled = !secondOrder;
    updateFormula();
    resetSimulation();
  }
  function createChart() {
    if (!window.Chart) {
      chart = null;
      setStatus("Chart.js could not load. Reconnect and reload to enable the concentration graph.", "error");
      return;
    }
    if (chart) chart.destroy();
    const datasets = [{
      label: "[A]",
      data: [],
      borderColor: "#62e7ff",
      backgroundColor: "rgba(98,231,255,.12)",
      borderWidth: 2.4,
      pointRadius: 0,
      pointHoverRadius: 3,
      tension: .28,
      fill: false
    }];
    if (model.order === 2) {
      datasets.push({
        label: "[B]",
        data: [],
        borderColor: "#a78bfa",
        backgroundColor: "rgba(167,139,250,.12)",
        borderWidth: 2.2,
        pointRadius: 0,
        pointHoverRadius: 3,
        tension: .28,
        fill: false
      });
    }
    chart = new Chart(els.chartCanvas.getContext("2d"), {
      type: "line",
      data: { datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        normalized: true,
        interaction: { intersect: false, mode: "index" },
        plugins: {
          legend: { position: "bottom", labels: { color: "#c2b8d6", boxWidth: 9, boxHeight: 9, usePointStyle: true, padding: 14, font: { size: 10, weight: "600" } } },
          tooltip: {
            backgroundColor: "rgba(10,5,20,.95)",
            borderColor: "rgba(167,139,250,.28)",
            borderWidth: 1,
            titleColor: "#f5f1ff",
            bodyColor: "#d8d0e8",
            callbacks: { title: (items) => items.length ? "Time: " + Number(items[0].parsed.x).toFixed(2) + " s" : "" }
          }
        },
        scales: {
          x: {
            type: "linear",
            title: { display: true, text: "Time (s)", color: "#a99fba", font: { size: 10, weight: "700" } },
            ticks: { color: "#9389a8", maxTicksLimit: 6, font: { size: 9 }, callback: (v) => Number(v).toFixed(1) },
            grid: { color: "rgba(190,175,220,.08)" },
            border: { color: "rgba(190,175,220,.15)" }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: "Concentration (mol L⁻¹)", color: "#a99fba", font: { size: 10, weight: "700" } },
            ticks: { color: "#9389a8", font: { size: 9 } },
            grid: { color: "rgba(190,175,220,.08)" },
            border: { color: "rgba(190,175,220,.15)" }
          }
        }
      }
    });
    sampleChart(true);
  }
  function sampleChart(force) {
    if (!chart) return;
    const pointA = { x: elapsed, y: state.A };
    chart.data.datasets[0].data.push(pointA);
    if (model.order === 2 && chart.data.datasets[1]) chart.data.datasets[1].data.push({ x: elapsed, y: state.B });
    chart.data.datasets.forEach((dataset) => {
      if (dataset.data.length > MAX_CHART_POINTS) dataset.data.shift();
    });
    if (force) chart.update("none");
  }
  function integrate(dt) {
    if (model.order === 1) {
      state.A *= Math.exp(-rateConstant * dt);
    } else {
      const difference = initialB - initialA;
      const derivative = (a) => -rateConstant * Math.max(0, a) * Math.max(0, a + difference);
      const a = state.A;
      const k1 = derivative(a);
      const k2 = derivative(a + k1 * dt / 2);
      const k3 = derivative(a + k2 * dt / 2);
      const k4 = derivative(a + k3 * dt);
      state.A = Math.max(0, a + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4));
      state.B = Math.max(0, initialB - (initialA - state.A));
    }
    state.P = Math.max(0, initialA - state.A);
    elapsed += dt;
  }
  function makeParticle(type) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (32 + Math.random() * 55) * Math.sqrt(temperature / T_REF);
    return {
      type: type,
      x: 22 + Math.random() * Math.max(1, width - 44),
      y: 28 + Math.random() * Math.max(1, height - 56),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: type === "P" ? 5.5 : 6.5,
      cooldown: .25 + Math.random() * .25,
      flash: 0
    };
  }
  function syncParticles() {
    const wanted = [];
    const countA = Math.min(22, Math.max(3, Math.round(state.A * 12)));
    const countB = model.order === 2 ? Math.min(22, Math.max(2, Math.round(state.B * 12))) : 12;
    const countP = Math.min(14, Math.round(state.P * 7));
    for (let i = 0; i < countA; i++) wanted.push("A");
    for (let i = 0; i < countB; i++) wanted.push(model.order === 2 ? "B" : "X");
    for (let i = 0; i < countP; i++) wanted.push("P");
    particles = wanted.map(makeParticle);
    lastParticleSync = elapsed;
  }
  function resizeCanvas() {
    const rect = els.canvas.getBoundingClientRect();
    if (!rect.width) return;
    pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    width = rect.width;
    height = rect.height;
    els.canvas.width = Math.round(width * pixelRatio);
    els.canvas.height = Math.round(height * pixelRatio);
    ctx = els.canvas.getContext("2d");
    drawCanvas(0);
    syncParticles();
  }
  function collide(a, b, dx, dy, distance) {
    const nx = dx / distance;
    const ny = dy / distance;
    const relative = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
    if (relative < 0) {
      a.vx -= relative * nx;
      a.vy -= relative * ny;
      b.vx += relative * nx;
      b.vy += relative * ny;
    }
  }
  function handleCollisions(dt) {
    const collisionOn = els.collisionToggle.checked;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minDistance = a.radius + b.radius;
        const distance = Math.hypot(dx, dy);
        if (distance >= minDistance || distance < .001) continue;
        const eligible = model.order === 2
          ? ((a.type === "A" && b.type === "B") || (a.type === "B" && b.type === "A"))
          : ((a.type === "A" && b.type === "X") || (a.type === "X" && b.type === "A"));
        if (collisionOn && eligible && a.cooldown <= 0 && b.cooldown <= 0) {
          const relativeSpeed = Math.hypot(a.vx - b.vx, a.vy - b.vy);
          const collisionEnergy = (relativeSpeed * relativeSpeed) / 3600;
          if (collisionEnergy >= ACTIVATION_THRESHOLD) {
            a.flash = 1; b.flash = 1;
            a.type = "P";
            if (model.order === 2) b.type = "P";
            successfulCollisions++;
          } else {
            a.flash = .75; b.flash = .75;
            failedCollisions++;
          }
          a.cooldown = .34; b.cooldown = .34;
        }
        collide(a, b, dx, dy, distance);
      }
    }
    if (collisionOn) {
      els.collisionCounts.textContent = "Successful " + successfulCollisions + " · Failed " + failedCollisions;
    }
  }
  function drawCanvas(dt) {
    if (!ctx || !width || !height) return;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "#11152d");
    bg.addColorStop(.52, "#0b1024");
    bg.addColorStop(1, "#17112a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(width * .5, height * .5, 3, width * .5, height * .5, width * .68);
    glow.addColorStop(0, "rgba(98,231,255,.10)");
    glow.addColorStop(1, "rgba(98,231,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    if (els.collisionToggle.checked) {
      ctx.strokeStyle = "rgba(167,139,250,.23)";
      ctx.setLineDash([5, 7]);
      ctx.beginPath();
      ctx.moveTo(14, 24);
      ctx.lineTo(width - 14, 24);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(211,202,236,.72)";
      ctx.font = "800 9px system-ui,sans-serif";
      ctx.fillText("ACTIVATION ENERGY GATE · " + ACTIVATION_THRESHOLD.toFixed(1) + " RELATIVE UNITS", 17, 17);
    } else {
      ctx.fillStyle = "rgba(190,180,214,.68)";
      ctx.font = "700 10px system-ui,sans-serif";
      ctx.fillText("ENABLE COLLISION THEORY TO VISUALISE ACTIVATION EVENTS", 17, 19);
    }

    for (const p of particles) {
      if (!reducedMotion) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < p.radius + 8 || p.x > width - p.radius - 8) p.vx *= -1;
        if (p.y < p.radius + 30 || p.y > height - p.radius - 8) p.vy *= -1;
        p.x = Math.max(p.radius + 8, Math.min(width - p.radius - 8, p.x));
        p.y = Math.max(p.radius + 30, Math.min(height - p.radius - 8, p.y));
        p.cooldown = Math.max(0, p.cooldown - dt);
        p.flash = Math.max(0, p.flash - dt * 2.5);
      }
      const palette = { A: "#62e7ff", B: "#a78bfa", X: "#7e7890", P: "#7df0bd" };
      const color = palette[p.type] || "#62e7ff";
      ctx.save();
      ctx.fillStyle = color;
      ctx.shadowColor = p.flash > .4 ? (p.type === "P" ? "#7df0bd" : "#f6b86a") : color;
      ctx.shadowBlur = 8 + p.flash * 13;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,.72)";
      ctx.beginPath();
      ctx.arc(p.x - 2, p.y - 2, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  function updateCollisionLabels() {
    const enabled = els.collisionToggle.checked;
    els.collisionState.textContent = enabled ? "● COLLISION THEORY ON" : "● PREVIEW";
    els.collisionExplanation.textContent = enabled
      ? "A + B (or A + bath particle) react only when collision energy reaches the activation threshold."
      : "Enable collision theory to compare collision energy with activation energy.";
    els.collisionCounts.textContent = enabled
      ? "Successful " + successfulCollisions + " · Failed " + failedCollisions
      : "Successful 0 · Failed 0";
  }
  function resetSimulation() {
    initialA = Number(els.amountA.value);
    initialB = Number(els.amountB.value);
    temperature = Number(els.temperature.value);
    state = { A: initialA, B: initialB, P: 0 };
    elapsed = 0;
    running = false;
    previousFrame = 0;
    frameCount = 0;
    successfulCollisions = 0;
    failedCollisions = 0;
    els.start.textContent = "▶ Start Reaction";
    els.pause.disabled = true;
    rateConstant = arrheniusK(temperature);
    updateReadouts();
    createChart();
    syncParticles();
    updateCollisionLabels();
    drawCanvas(0);
    setStatus("Reset complete. Press Start Reaction to begin the concentration-time simulation.", "info");
  }
  function startReaction() {
    if (running) return;
    running = true;
    previousFrame = 0;
    els.start.textContent = "Ⅱ Pause Reaction";
    els.pause.disabled = false;
    setStatus("Reaction running. Temperature is " + temperature.toFixed(0) + " K; k = " + rateConstant.toExponential(3) + ".", "success");
  }
  function pauseReaction() {
    if (!running) return;
    running = false;
    previousFrame = 0;
    els.start.textContent = "▶ Resume Reaction";
    els.pause.disabled = true;
    setStatus("Paused at t = " + elapsed.toFixed(2) + " s. Press Resume to continue.", "info");
  }
  function onTemperatureInput() {
    const oldScale = Math.sqrt(temperature / T_REF);
    temperature = Number(els.temperature.value);
    const newScale = Math.sqrt(temperature / T_REF);
    const ratio = newScale / oldScale;
    particles.forEach((p) => { p.vx *= ratio; p.vy *= ratio; });
    rateConstant = arrheniusK(temperature);
    updateReadouts();
    if (running) setStatus("Temperature updated to " + temperature.toFixed(0) + " K. Arrhenius k and rate have increased or decreased accordingly.", "success");
  }
  function onConcentrationInput() {
    resetSimulation();
    els.amountAValue.textContent = Number(els.amountA.value).toFixed(2) + " M";
    els.amountBValue.textContent = Number(els.amountB.value).toFixed(2) + " M";
  }
  function frame(now) {
    if (!previousFrame) previousFrame = now;
    const dt = Math.min(.05, Math.max(0, (now - previousFrame) / 1000)) * PLAYBACK_RATE;
    previousFrame = now;
    if (running && dt > 0) {
      integrate(dt);
      frameCount++;
      if (frameCount % 6 === 0) {
        sampleChart(false);
        updateReadouts();
      }
      if (elapsed - lastParticleSync > 2.2) syncParticles();
    }
    const visualDt = reducedMotion ? 0 : Math.min(.04, dt || .016);
    if (particles.length) handleCollisions(visualDt);
    drawCanvas(visualDt);
    rafId = window.requestAnimationFrame(frame);
  }

  els.reaction.addEventListener("change", configureModel);
  els.amountA.addEventListener("input", onConcentrationInput);
  els.amountB.addEventListener("input", onConcentrationInput);
  els.temperature.addEventListener("input", onTemperatureInput);
  els.collisionToggle.addEventListener("change", updateCollisionLabels);
  els.start.addEventListener("click", function () { if (running) pauseReaction(); else startReaction(); });
  els.pause.addEventListener("click", pauseReaction);
  els.reset.addEventListener("click", resetSimulation);

  function initialize() {
    ctx = els.canvas.getContext("2d");
    configureModel();
    updateReadouts();
    const rect = els.canvas.getBoundingClientRect();
    if (rect.width) resizeCanvas();
    if (!rafId) rafId = window.requestAnimationFrame(frame);
    window.addEventListener("resize", resizeCanvas, { passive: true });
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(resizeCanvas);
      observer.observe(els.canvas.parentElement);
    }
    if (!window.Chart) setStatus("Chart.js could not load. Reconnect and reload to enable the concentration graph.", "error");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();