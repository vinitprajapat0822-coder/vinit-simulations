/* Vinit Simulation Hub — Chemical Equilibrium Lab */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const els = {
    reaction: $("reaction-select"),
    ranges: { r1: $("amount-r1"), r2: $("amount-r2"), p1: $("amount-p1"), p2: $("amount-p2") },
    controls: { r1: $("control-r1"), r2: $("control-r2"), p1: $("control-p1"), p2: $("control-p2") },
    labels: { r1: $("label-r1"), r2: $("label-r2"), p1: $("label-p1"), p2: $("label-p2") },
    values: { r1: $("value-r1"), r2: $("value-r2"), p1: $("value-p1"), p2: $("value-p2") },
    leChatelier: $("le-chatelier-toggle"),
    injectPanel: $("inject-panel"),
    injectSpecies: $("inject-species"),
    injectAmount: $("inject-amount"),
    injectValue: $("inject-value"),
    injectButton: $("inject-button"),
    predictionPrompt: $("prediction-prompt"),
    predictionForward: $("predict-forward"),
    predictionReverse: $("predict-reverse"),
    predictionFeedback: $("prediction-feedback"),
    start: $("start-button"),
    pause: $("pause-button"),
    reset: $("reset-button"),
    status: $("app-status"),
    equation: $("reaction-equation"),
    qc: $("qc-value"),
    kc: $("kc-value"),
    equilibriumStatus: $("equilibrium-status"),
    forwardRate: $("forward-rate"),
    reverseRate: $("reverse-rate"),
    kcFormula: $("kc-formula"),
    qcRelation: $("qc-relation"),
    particles: $("particle-canvas"),
    chart: $("concentration-chart"),
    particleState: $("particle-state")
  };

  const VOLUME_L = 1.0;
  const MAX_CHART_POINTS = 240;
  const PARTICLES_PER_MOLAR = 18;
  const MAX_PARTICLES_PER_SPECIES = 72;
  const EQUILIBRIUM_RELATIVE_TOLERANCE = 0.002;
  const COLORS = { r1: "#62e7ff", r2: "#a78bfa", p1: "#7df0bd", p2: "#f472d0" };

  const REACTIONS = {
    "h2-i2": {
      title: "Hydrogen + Iodine ⇌ Hydrogen Iodide",
      reactants: [
        { key: "r1", formula: "H2", label: "H₂", coefficient: 1 },
        { key: "r2", formula: "I2", label: "I₂", coefficient: 1 }
      ],
      products: [{ key: "p1", formula: "HI", label: "HI", coefficient: 2 }],
      initial: { r1: 1.2, r2: 1, p1: 0, p2: 0 },
      kf: 0.60, kr: 0.20, forwardUnits: "M⁻¹ s⁻¹", reverseUnits: "M⁻¹ s⁻¹"
    },
    "n2o4": {
      title: "Dinitrogen Tetroxide ⇌ Nitrogen Dioxide",
      reactants: [{ key: "r1", formula: "N2O4", label: "N₂O₄", coefficient: 1 }],
      products: [{ key: "p1", formula: "NO2", label: "NO₂", coefficient: 2 }],
      initial: { r1: 1.2, r2: 0, p1: 0.1, p2: 0 },
      kf: 0.70, kr: 0.35, forwardUnits: "s⁻¹", reverseUnits: "M⁻¹ s⁻¹"
    },
    "co-water": {
      title: "Carbon Monoxide + Water ⇌ Carbon Dioxide + Hydrogen",
      reactants: [
        { key: "r1", formula: "CO", label: "CO", coefficient: 1 },
        { key: "r2", formula: "H2O", label: "H₂O", coefficient: 1 }
      ],
      products: [
        { key: "p1", formula: "CO2", label: "CO₂", coefficient: 1 },
        { key: "p2", formula: "H2", label: "H₂", coefficient: 1 }
      ],
      initial: { r1: 1, r2: 1, p1: 0.1, p2: 0.1 },
      kf: 0.42, kr: 0.24, forwardUnits: "M⁻¹ s⁻¹", reverseUnits: "M⁻¹ s⁻¹"
    }
  };

  let reaction = REACTIONS[els.reaction.value] || REACTIONS["h2-i2"];
  let concentrations = {};
  let initialAmounts = {};
  let chart = null;
  let particles = [];
  let rafId = 0;
  let running = false;
  let simulationTime = 0;
  let lastFrameTime = 0;
  let frameCounter = 0;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let pixelRatio = 1;
  let ctx = null;
  let previousInjectionKey = null;
  let predictionChoice = null;
  let pendingPrediction = null;
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function speciesList(model) { return model.reactants.concat(model.products); }
  function allKeys(model) {
    return ["r1", "r2", "p1", "p2"].filter((key) => speciesList(model).some((species) => species.key === key));
  }
  function speciesForKey(key) { return speciesList(reaction).find((species) => species.key === key) || null; }
  function setStatus(message, state) {
    els.status.textContent = message;
    els.status.dataset.state = state || "info";
  }
  function formulaTex(formula) {
    return String(formula)
      .replace(/([A-Z][a-z]?)(\d+)/g, "$1_{$2}")
      .replace(/([)\]])(\d+)/g, "$1_{$2}");
  }
  function speciesTerm(species, bracketed) {
    const base = "\\mathrm{" + formulaTex(species.formula) + "}";
    const value = bracketed ? "\\left[" + base + "\\right]" : base;
    return value + (species.coefficient === 1 ? "" : "^{" + species.coefficient + "}");
  }
  function buildEquation(model) {
    const side = (list) => list.map((species) =>
      (species.coefficient === 1 ? "" : species.coefficient + "\\,") +
      "\\mathrm{" + formulaTex(species.formula) + "}"
    ).join(" + ");
    return "\\(" + side(model.reactants) + " \\rightleftharpoons " + side(model.products) + "\\)";
  }
  function buildKcExpression(model) {
    const numerator = model.products.map((species) => speciesTerm(species, true)).join("");
    const denominator = model.reactants.map((species) => speciesTerm(species, true)).join("");
    return "\\(K_c = \\frac{" + numerator + "}{" + denominator + "} = \\frac{k_f}{k_r}\\)";
  }
  function typeset(nodes) {
    if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
      if (typeof window.MathJax.typesetClear === "function") window.MathJax.typesetClear(nodes);
      window.MathJax.typesetPromise(nodes).catch(function () {});
    }
  }
  function renderEquations() {
    els.equation.textContent = buildEquation(reaction);
    els.kcFormula.textContent = buildKcExpression(reaction);
    updateQuotientRelation();
    typeset([els.equation, els.kcFormula, els.qcRelation]);
  }
  function massActionProduct(list, values) {
    return list.reduce((product, species) =>
      product * Math.pow(Math.max(0, values[species.key] || 0), species.coefficient), 1);
  }
  function calculateRates(values) {
    return {
      forward: reaction.kf * massActionProduct(reaction.reactants, values),
      reverse: reaction.kr * massActionProduct(reaction.products, values)
    };
  }
  function calculateKc() { return reaction.kf / reaction.kr; }
  function calculateQc(values) {
    const numerator = massActionProduct(reaction.products, values);
    const denominator = massActionProduct(reaction.reactants, values);
    if (denominator <= 1e-14) return numerator <= 1e-14 ? NaN : Infinity;
    return numerator / denominator;
  }
  function formatValue(value, digits) {
    if (Number.isNaN(value)) return "Undefined";
    if (!Number.isFinite(value)) return "∞";
    return value.toFixed(digits == null ? 3 : digits);
  }
  let lastQuotientRelation = "";
  function updateQuotientRelation() {
    const q = calculateQc(concentrations);
    const k = calculateKc();
    let relation = "Q_c = K_c\\;\\Rightarrow\\;\\text{at equilibrium}";
    if (Number.isNaN(q)) relation = "Q_c\\text{ is undefined for the current zero-concentration state}";
    else if (q < k * (1 - 1e-5)) relation = "Q_c < K_c\\;\\Rightarrow\\;\\text{forward shift}";
    else if (q > k * (1 + 1e-5)) relation = "Q_c > K_c\\;\\Rightarrow\\;\\text{reverse shift}";
    if (relation === lastQuotientRelation) return;
    lastQuotientRelation = relation;
    els.qcRelation.textContent = "\\(" + relation + "\\)";
    typeset([els.qcRelation]);
  }
  function updateMonitor() {
    const rates = calculateRates(concentrations);
    const q = calculateQc(concentrations);
    const k = calculateKc();
    els.qc.textContent = formatValue(q);
    els.kc.textContent = formatValue(k);
    els.forwardRate.textContent = rates.forward.toExponential(3);
    els.reverseRate.textContent = rates.reverse.toExponential(3);
    const scale = Math.max(rates.forward, rates.reverse);
    const noMeasurableRate = scale <= 1e-9;
    const atEquilibrium = !noMeasurableRate &&
      Math.abs(rates.forward - rates.reverse) <= Math.max(1e-8, scale * EQUILIBRIUM_RELATIVE_TOLERANCE);
    els.equilibriumStatus.dataset.state = atEquilibrium ? "equilibrium" : "reaching";
    els.equilibriumStatus.textContent = noMeasurableRate ? "No Measurable Reaction" :
      atEquilibrium ? "At Equilibrium" : "Reaching Equilibrium";
    els.particleState.textContent = running ? "● RUNNING" : atEquilibrium ? "● EQUILIBRIUM" : "● PAUSED";
    updateQuotientRelation();
  }
  function setControl(key, species) {
    const range = els.ranges[key];
    const wrap = els.controls[key];
    const label = els.labels[key];
    range.disabled = !species;
    wrap.classList.toggle("is-disabled", !species);
    if (species) {
      label.textContent = (key[0] === "r" ? "Reactant " : "Product ") + key.slice(1) + " · " + species.label;
      range.value = String(reaction.initial[key] || 0);
      els.values[key].textContent = Number(range.value).toFixed(2) + " mol";
    } else {
      label.textContent = (key[0] === "r" ? "Reactant " : "Product ") + key.slice(1) + " · —";
      range.value = "0";
      els.values[key].textContent = "—";
    }
  }
  function configureInjectionOptions() {
    const previous = els.injectSpecies.value;
    els.injectSpecies.replaceChildren();
    speciesList(reaction).forEach((species) => {
      const option = document.createElement("option");
      option.value = species.key;
      option.textContent = species.label + (species.key[0] === "r" ? " · Reactant" : " · Product");
      els.injectSpecies.appendChild(option);
    });
    if (speciesList(reaction).some((species) => species.key === previous)) els.injectSpecies.value = previous;
    else els.injectSpecies.selectedIndex = 0;
  }
  function clearPrediction(message) {
    predictionChoice = null;
    pendingPrediction = null;
    els.predictionForward.setAttribute("aria-pressed", "false");
    els.predictionReverse.setAttribute("aria-pressed", "false");
    els.injectButton.disabled = true;
    els.predictionFeedback.dataset.state = "info";
    els.predictionFeedback.textContent = message || "Choose a direction first. Then enable Le Chatelier Effect and inject the selected species.";
    typeset([els.predictionFeedback]);
  }
  function updatePredictionPrompt() {
    const species = speciesForKey(els.injectSpecies.value);
    if (!species) {
      els.predictionPrompt.textContent = "Choose a species to inject, then predict the equilibrium shift.";
      return;
    }
    const side = species.key[0] === "r" ? "reactant" : "product";
    els.predictionPrompt.textContent = "If we add more " + species.label + " (" + side + "), which way will the equilibrium shift?";
  }
  function choosePrediction(direction) {
    if (pendingPrediction) return;
    predictionChoice = direction;
    els.predictionForward.setAttribute("aria-pressed", String(direction === "forward"));
    els.predictionReverse.setAttribute("aria-pressed", String(direction === "reverse"));
    els.injectButton.disabled = false;
    els.predictionFeedback.dataset.state = "info";
    els.predictionFeedback.textContent = "Prediction saved: " + (direction === "forward" ? "forward" : "reverse") + ". Now enable Le Chatelier Effect and inject the selected species.";
  }
  function assessPrediction() {
    if (!pendingPrediction || pendingPrediction.complete) return;
    const elapsed = simulationTime - pendingPrediction.startedAt;
    const rates = calculateRates(concentrations);
    const scale = Math.max(rates.forward, rates.reverse);
    const atEquilibrium = scale > 1e-9 &&
      Math.abs(rates.forward - rates.reverse) <= Math.max(1e-8, scale * EQUILIBRIUM_RELATIVE_TOLERANCE);
    if (elapsed < 2.5 || (!atEquilibrium && elapsed < 5)) return;

    const result = pendingPrediction;
    result.complete = true;
    const correct = result.choice === result.actual;
    const directionLabel = result.actual === "forward" ? "forward" : "reverse";
    const quotientRule = result.side === "reactant"
      ? "Adding a reactant increases the denominator of the reaction quotient, so \\(Q_c\\) decreases."
      : "Adding a product increases the numerator of the reaction quotient, so \\(Q_c\\) increases.";
    const comparison = result.qAfter < result.kc
      ? "\\(Q_c < K_c\\), so the forward reaction proceeds to form products."
      : result.qAfter > result.kc
        ? "\\(Q_c > K_c\\), so the reverse reaction proceeds to form reactants."
        : "\\(Q_c = K_c\\), so the system is already at equilibrium.";
    const progress = atEquilibrium ? "The rates have returned to equilibrium." : "The simulation is moving the quotient back toward \\(K_c\\).";
    els.predictionFeedback.dataset.state = correct ? "success" : "error";
    els.predictionFeedback.innerHTML =
      "<strong>Your prediction was " + (correct ? "Correct" : "Incorrect") + ".</strong> The reaction shifted " +
      directionLabel + " to move the system toward equilibrium after the " + result.side + " addition. " + quotientRule + " " +
      comparison + " " + progress;
    typeset([els.predictionFeedback]);
    pendingPrediction = null;
    predictionChoice = null;
    els.predictionForward.disabled = false;
    els.predictionReverse.disabled = false;
    els.predictionForward.setAttribute("aria-pressed", "false");
    els.predictionReverse.setAttribute("aria-pressed", "false");
    els.injectButton.disabled = true;
  }
  function configureControls() {
    const available = Object.fromEntries(speciesList(reaction).map((species) => [species.key, species]));
    ["r1", "r2", "p1", "p2"].forEach((key) => setControl(key, available[key]));
    updateInitialAmountsFromControls();
    configureInjectionOptions();
  }
  function updateInitialAmountsFromControls() {
    initialAmounts = {};
    allKeys(reaction).forEach((key) => {
      initialAmounts[key] = Number(els.ranges[key].value) / VOLUME_L;
      els.values[key].textContent = Number(els.ranges[key].value).toFixed(2) + " mol";
    });
  }
  function sampleChart(force) {
    if (!chart) return;
    const x = simulationTime;
    speciesList(reaction).forEach((species, index) => {
      const data = chart.data.datasets[index].data;
      data.push({ x: x, y: Math.max(0, concentrations[species.key] || 0) });
      if (data.length > MAX_CHART_POINTS) data.shift();
    });
    if (force) chart.update("none");
  }
  function rebuildChart() {
    if (!window.Chart) {
      chart = null;
      setStatus("Chart.js did not load. Reconnect and reload to enable the graph.", "error");
      return;
    }
    if (chart) chart.destroy();
    const datasets = speciesList(reaction).map((species) => ({
      label: species.label + (species.key[0] === "r" ? " · Reactant" : " · Product"),
      data: [],
      borderColor: COLORS[species.key],
      backgroundColor: COLORS[species.key] + "22",
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 3,
      tension: .28,
      fill: false
    }));
    chart = new Chart(els.chart.getContext("2d"), {
      type: "line",
      data: { datasets: datasets },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false, normalized: true,
        interaction: { intersect: false, mode: "index" },
        plugins: {
          legend: { position: "bottom", labels: { color: "#b8bfdc", boxWidth: 9, boxHeight: 9, usePointStyle: true, padding: 13, font: { size: 10, weight: "600" } } },
          tooltip: {
            backgroundColor: "rgba(8,10,25,.94)", borderColor: "rgba(160,185,255,.25)", borderWidth: 1,
            titleColor: "#f2f4ff", bodyColor: "#cbd2ef",
            callbacks: { title: (items) => items.length ? "Time: " + Number(items[0].parsed.x).toFixed(2) + " s" : "" }
          }
        },
        scales: {
          x: { type: "linear", title: { display: true, text: "Time (s)", color: "#8d95b5", font: { size: 10, weight: "700" } }, ticks: { color: "#858eae", maxTicksLimit: 6, font: { size: 9 }, callback: (v) => Number(v).toFixed(1) }, grid: { color: "rgba(173,190,240,.08)" }, border: { color: "rgba(173,190,240,.14)" } },
          y: { beginAtZero: true, title: { display: true, text: "Concentration (mol L⁻¹)", color: "#8d95b5", font: { size: 10, weight: "700" } }, ticks: { color: "#858eae", font: { size: 9 } }, grid: { color: "rgba(173,190,240,.08)" }, border: { color: "rgba(173,190,240,.14)" } }
        }
      }
    });
    sampleChart(false);
    chart.update("none");
  }
  function updateKinetics(dt) {
    const rates = calculateRates(concentrations);
    const net = rates.forward - rates.reverse;
    if (Math.abs(net) < 1e-12) return;
    const limitingSide = net >= 0 ? reaction.reactants : reaction.products;
    let maxExtent = Infinity;
    limitingSide.forEach((species) => {
      maxExtent = Math.min(maxExtent, Math.max(0, concentrations[species.key] || 0) / species.coefficient);
    });
    if (!Number.isFinite(maxExtent) || maxExtent <= 0) return;
    const requested = net * dt;
    const cap = maxExtent * .85;
    const extent = net >= 0 ? Math.min(requested, cap) : Math.max(requested, -cap);
    reaction.reactants.forEach((species) => {
      concentrations[species.key] = Math.max(0, (concentrations[species.key] || 0) - species.coefficient * extent);
    });
    reaction.products.forEach((species) => {
      concentrations[species.key] = Math.max(0, (concentrations[species.key] || 0) + species.coefficient * extent);
    });
  }
  function makeParticle(key) {
    const left = key[0] === "r";
    return {
      key: key,
      x: left ? canvasWidth * (.06 + Math.random() * .36) : canvasWidth * (.58 + Math.random() * .36),
      y: canvasHeight * (.12 + Math.random() * .76),
      vx: (Math.random() - .5) * 28,
      vy: (Math.random() - .5) * 24,
      phase: Math.random() * Math.PI * 2,
      size: 3.2 + Math.random() * 2.3
    };
  }
  function syncParticles(rebuild) {
    const wanted = [];
    speciesList(reaction).forEach((species) => {
      const count = Math.min(MAX_PARTICLES_PER_SPECIES, Math.round(Math.max(0, concentrations[species.key] || 0) * PARTICLES_PER_MOLAR));
      for (let i = 0; i < count; i++) wanted.push(species.key);
    });
    if (rebuild) { particles = wanted.map(makeParticle); return; }
    const next = [];
    wanted.forEach((key) => {
      const index = particles.findIndex((particle) => particle.key === key);
      if (index >= 0) next.push(particles.splice(index, 1)[0]);
      else next.push(makeParticle(key));
    });
    particles = next;
  }
  function resizeCanvas() {
    const rect = els.particles.getBoundingClientRect();
    if (!rect.width) return;
    pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    canvasWidth = rect.width;
    canvasHeight = rect.height;
    els.particles.width = Math.round(canvasWidth * pixelRatio);
    els.particles.height = Math.round(canvasHeight * pixelRatio);
    ctx = els.particles.getContext("2d");
    drawParticles(performance.now());
  }
  function drawParticles(now) {
    if (!ctx || !canvasWidth || !canvasHeight) return;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    const bg = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    bg.addColorStop(0, "#0e1930"); bg.addColorStop(.5, "#0a1024"); bg.addColorStop(1, "#17132b");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    const glow = ctx.createRadialGradient(canvasWidth*.5,canvasHeight*.5,4,canvasWidth*.5,canvasHeight*.5,canvasWidth*.6);
    glow.addColorStop(0,"rgba(98,231,255,.10)"); glow.addColorStop(1,"rgba(98,231,255,0)");
    ctx.fillStyle=glow; ctx.fillRect(0,0,canvasWidth,canvasHeight);
    ctx.save(); ctx.setLineDash([4,7]); ctx.strokeStyle="rgba(170,190,240,.20)";
    ctx.beginPath(); ctx.moveTo(canvasWidth*.5,18); ctx.lineTo(canvasWidth*.5,canvasHeight-18); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.strokeStyle="rgba(125,240,189,.65)"; ctx.shadowColor="rgba(125,240,189,.7)"; ctx.shadowBlur=12; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(canvasWidth*.455,canvasHeight*.5); ctx.lineTo(canvasWidth*.545,canvasHeight*.5);
    ctx.moveTo(canvasWidth*.525,canvasHeight*.475); ctx.lineTo(canvasWidth*.545,canvasHeight*.5); ctx.lineTo(canvasWidth*.525,canvasHeight*.525); ctx.stroke(); ctx.restore();
    ctx.textAlign="center"; ctx.fillStyle="rgba(190,205,239,.75)"; ctx.font="800 9px system-ui,sans-serif";
    ctx.fillText("REACTANTS",canvasWidth*.25,17); ctx.fillText("PRODUCTS",canvasWidth*.75,17);
    const t=now/1000;
    particles.forEach((p)=>{
      if (running && !reducedMotion) {
        p.x+=p.vx/60; p.y+=p.vy/60;
        const left=p.key[0]==="r"; const minX=left?canvasWidth*.045:canvasWidth*.555; const maxX=left?canvasWidth*.445:canvasWidth*.955;
        if(p.x<minX||p.x>maxX)p.vx*=-1; if(p.y<canvasHeight*.09||p.y>canvasHeight*.91)p.vy*=-1;
        p.x=Math.max(minX,Math.min(maxX,p.x)); p.y=Math.max(canvasHeight*.09,Math.min(canvasHeight*.91,p.y));
      }
      const color=COLORS[p.key]; const pulse=reducedMotion?1:.84+Math.sin(t*2.4+p.phase)*.16;
      ctx.save(); ctx.globalAlpha=pulse; ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=previousInjectionKey===p.key?17:11;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
      ctx.fillStyle="rgba(255,255,255,.55)"; ctx.beginPath(); ctx.arc(p.x-p.size*.28,p.y-p.size*.28,p.size*.25,0,Math.PI*2); ctx.fill(); ctx.restore();
    });
    const rates=calculateRates(concentrations); const alpha=Math.min(.22,Math.abs(rates.forward-rates.reverse)*.12);
    if(alpha>.002){const g=ctx.createRadialGradient(canvasWidth*.5,canvasHeight*.5,2,canvasWidth*.5,canvasHeight*.5,70);g.addColorStop(0,"rgba(125,240,189,"+alpha+")");g.addColorStop(1,"rgba(125,240,189,0)");ctx.fillStyle=g;ctx.fillRect(canvasWidth*.5-70,canvasHeight*.5-70,140,140);}
  }
  function sampleAfterInjection() {
    if (chart) {
      chart.data.datasets.forEach((dataset,index) => {
        const species=speciesList(reaction)[index];
        dataset.data.push({x:simulationTime,y:Math.max(0,concentrations[species.key]||0)});
        if(dataset.data.length>MAX_CHART_POINTS)dataset.data.shift();
      });
      chart.update("none");
    }
  }
  function injectSpecies() {
    if(!els.leChatelier.checked)return;
    if(!predictionChoice) {
      els.predictionFeedback.textContent = "Make a prediction before injecting a species.";
      els.predictionFeedback.dataset.state = "error";
      return;
    }
    if(pendingPrediction && !pendingPrediction.complete)return;
    const key=els.injectSpecies.value; const species=speciesForKey(key); const amount=Number(els.injectAmount.value);
    if(!species||!Number.isFinite(amount)||amount<=0)return;
    // Record the quotient immediately after the concentration jump; its relation to Kc
    // determines the thermodynamically required direction of relaxation.
    sampleAfterInjection();
    concentrations[key]=(concentrations[key]||0)+amount/VOLUME_L;
    simulationTime+=.002;
    previousInjectionKey=key;
    const qAfter = calculateQc(concentrations);
    const kc = calculateKc();
    const actual = Number.isNaN(qAfter) || qAfter < kc * (1 - 1e-5)
      ? "forward"
      : qAfter > kc * (1 + 1e-5) ? "reverse" : (key[0] === "r" ? "forward" : "reverse");
    pendingPrediction = {
      choice: predictionChoice,
      actual: actual,
      qAfter: qAfter,
      kc: kc,
      side: key[0] === "r" ? "reactant" : "product",
      startedAt: simulationTime,
      complete: false
    };
    sampleAfterInjection();
    syncParticles(false); updateMonitor();
    els.injectButton.disabled = true;
    els.predictionForward.disabled = true;
    els.predictionReverse.disabled = true;
    els.predictionFeedback.dataset.state = "info";
    els.predictionFeedback.textContent = "Species injected. Observe the reaction as it relaxes toward the new equilibrium...";
    if(!running)startReaction();
    setStatus("Added "+species.label+" by "+amount.toFixed(2)+" mol. Comparing the post-injection Qc with Kc to observe the shift.","success");
  }
  function resetSimulation(keepSliderValues) {
    if(!keepSliderValues)updateInitialAmountsFromControls();
    concentrations=Object.assign({},initialAmounts);
    simulationTime=0; frameCounter=0; running=false; lastFrameTime=0; previousInjectionKey=null;
    els.predictionForward.disabled = false; els.predictionReverse.disabled = false;
    clearPrediction("Simulation reset. Make a fresh prediction before the next injection.");
    els.start.textContent="▶ Start Reaction"; els.pause.disabled=true;
    rebuildChart(); syncParticles(true); updateMonitor(); drawParticles(performance.now());
    setStatus("Ready. Press Start Reaction to watch the system approach equilibrium.","info");
  }
  function startReaction() {
    if(running)return;
    running=true; lastFrameTime=0; els.start.textContent="Ⅱ Pause Reaction"; els.pause.disabled=false;
    setStatus("Reaction running. Compare Qc with Kc as concentrations change.","success");
    updateMonitor();
  }
  function pauseReaction() {
    if(!running)return;
    running=false; lastFrameTime=0; els.start.textContent="▶ Resume Reaction"; els.pause.disabled=true;
    setStatus("Paused at t = "+simulationTime.toFixed(2)+" s. Press Resume to continue.","info");
    updateMonitor();
  }
  function selectReaction() {
    pauseReaction(); reaction=REACTIONS[els.reaction.value]||REACTIONS["h2-i2"];
    configureControls(); updatePredictionPrompt(); renderEquations(); resetSimulation(true);
  }
  function updateRangeOutput(key) {
    els.values[key].textContent=Number(els.ranges[key].value).toFixed(2)+" mol";
  }
  function frame(now) {
    if(!lastFrameTime)lastFrameTime=now;
    const dt=Math.min(.05,Math.max(0,(now-lastFrameTime)/1000));
    lastFrameTime=now;
    if(running&&dt>0){
      updateKinetics(dt); simulationTime+=dt; frameCounter++;
      if(frameCounter%6===0){syncParticles(false);sampleAfterInjection();updateMonitor();}
      assessPrediction();
    }
    drawParticles(now);
    rafId=window.requestAnimationFrame(frame);
  }

  ["r1","r2","p1","p2"].forEach((key)=>{
    els.ranges[key].addEventListener("input",function(){
      updateRangeOutput(key); pauseReaction(); resetSimulation(false);
    });
  });
  els.reaction.addEventListener("change",selectReaction);
  els.start.addEventListener("click",function(){if(running)pauseReaction();else startReaction();});
  els.pause.addEventListener("click",pauseReaction);
  els.reset.addEventListener("click",function(){pauseReaction();resetSimulation(true);});
  els.leChatelier.addEventListener("change",function(){els.injectPanel.hidden=!els.leChatelier.checked;});
  els.injectAmount.addEventListener("input",function(){els.injectValue.textContent=Number(els.injectAmount.value).toFixed(2)+" mol";});
  els.injectButton.addEventListener("click",injectSpecies);
  els.predictionForward.addEventListener("click",function(){choosePrediction("forward");});
  els.predictionReverse.addEventListener("click",function(){choosePrediction("reverse");});
  els.injectSpecies.addEventListener("change",function(){
    updatePredictionPrompt();
    clearPrediction("Species changed. Make a new prediction for the selected species.");
  });

  function initialize() {
    ctx=els.particles.getContext("2d");
    configureControls(); renderEquations(); resetSimulation(true);
    if(!window.Chart)setStatus("Chart.js did not load. Reconnect and reload to enable the concentration graph.","error");
    resizeCanvas();
    if(!rafId)rafId=window.requestAnimationFrame(frame);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initialize,{once:true});
  else initialize();
  window.addEventListener("resize",resizeCanvas,{passive:true});
  if("ResizeObserver" in window){const observer=new ResizeObserver(resizeCanvas);observer.observe(els.particles.parentElement);}
})();