/* Vinit Simulation Hub — Mole Concept & Stoichiometry Lab */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const els = {
    reactionSelect: $("reaction-select"),
    reactionInput: $("reaction-input"),
    simulateButton: $("simulate-button"),
    oneLabel: $("reactant-one-label"),
    twoLabel: $("reactant-two-label"),
    oneField: $("reactant-one-field"),
    twoField: $("reactant-two-field"),
    oneRange: $("moles-one"),
    twoRange: $("moles-two"),
    oneValue: $("moles-one-value"),
    twoValue: $("moles-two-value"),
    extraControls: $("extra-reactant-controls"),
    canvas: $("molecule-canvas"),
    equation: $("balanced-equation"),
    limiting: $("limiting-reagent"),
    excess: $("excess-reagent"),
    products: $("product-formed"),
    extent: $("reaction-extent"),
    stepsToggle: $("steps-toggle"),
    stepsPanel: $("steps-panel"),
    stepsList: $("steps-list"),
    status: $("app-status")
  };

  const DEFAULT_REACTION = "N2 + H2 -> NH3";
  const PARTICLES_PER_MOLE = 10;
  const MAX_DRAW_PARTICLES = 120;
  const EPSILON = 1e-8;
  const COLORS = ["#62e7ff", "#a78bfa", "#c084fc", "#38bdf8", "#7dd3fc"];
  const PRODUCT_COLOR = "#7df0bd";

  let balanced = null;
  let reactantControls = [];
  let calculation = null;
  let animationFrame = 0;
  let animationProgress = 1;
  let animationStart = 0;
  let lastSignature = "";
  let resizeObserver = null;
  let ctx = null;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let pixelRatio = 1;
  const reducedMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function formatMoles(value) {
    return Number(value).toFixed(2) + " mol";
  }

  function setStatus(message, state) {
    els.status.textContent = message;
    els.status.dataset.state = state || "info";
  }

  function formulaToTex(formula) {
    let value = String(formula)
      .replace(/·/g, "\\,\\cdot\\,")
      .replace(/•/g, "\\,\\cdot\\,")
      .replace(/([A-Z][a-z]?)(\d+)/g, "$1_{$2}")
      .replace(/([)\]])(\d+)/g, "$1_{$2}");
    value = value.replace(/\\^([0-9]*[+-])/g, "^{$1}");
    return "\\mathrm{" + value + "}";
  }

  function buildEquationTex(result) {
    const side = (species) => species.map((item) => {
      const coefficient = item.coefficient === 1 ? "" : String(item.coefficient) + "\\,";
      return coefficient + formulaToTex(item.formula);
    }).join(" + ");
    return "\\(" + side(result.reactants) + " \\longrightarrow " + side(result.products) + "\\)";
  }

  function renderEquation() {
    if (!balanced) return;
    els.equation.textContent = buildEquationTex(balanced);
    if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
      if (typeof window.MathJax.typesetClear === "function") {
        window.MathJax.typesetClear([els.equation]);
      }
      window.MathJax.typesetPromise([els.equation]).catch(function () {});
    }
  }

  function readCurrentMoles() {
    return reactantControls.map((control) => Number(control.value));
  }

  function createExtraSlider(index, formula, value) {
    const wrap = document.createElement("div");
    wrap.className = "range-field";
    const head = document.createElement("div");
    head.className = "range-head";
    const label = document.createElement("label");
    label.className = "range-name";
    label.htmlFor = "extra-moles-" + index;
    label.textContent = "Reactant " + (index + 1) + " · " + formula;
    const output = document.createElement("output");
    output.className = "range-value";
    output.htmlFor = "extra-moles-" + index;
    output.textContent = Number(value).toFixed(1) + " mol";
    head.appendChild(label);
    head.appendChild(output);

    const range = document.createElement("input");
    range.className = "mole-range";
    range.type = "range";
    range.id = "extra-moles-" + index;
    range.min = "0";
    range.max = "10";
    range.step = "0.1";
    range.value = String(value);
    range.setAttribute("aria-label", "Moles of reactant " + (index + 1));
    range.addEventListener("input", function () {
      output.textContent = Number(range.value).toFixed(1) + " mol";
      updateCalculation();
    });

    const scale = document.createElement("div");
    scale.className = "range-scale";
    scale.innerHTML = "<span>0 mol</span><span>10 mol</span>";
    wrap.appendChild(head);
    wrap.appendChild(range);
    wrap.appendChild(scale);
    return { wrap: wrap, range: range, output: output };
  }

  function setupReactantControls(reactants, resetValues) {
    const previous = readCurrentMoles();
    const signature = reactants.map((item) => item.formula).join("|");
    const reset = resetValues || signature !== lastSignature;
    lastSignature = signature;
    const values = reactants.map((item, index) => {
      if (!reset && Number.isFinite(previous[index])) return previous[index];
      return index === 0 ? 2 : index === 1 ? 3 : 1;
    });

    els.oneLabel.textContent = "Reactant 1 · " + reactants[0].formula;
    els.oneRange.value = String(values[0] || 0);
    els.oneValue.textContent = Number(els.oneRange.value).toFixed(1) + " mol";

    if (reactants.length > 1) {
      els.twoField.hidden = false;
      els.twoLabel.textContent = "Reactant 2 · " + reactants[1].formula;
      els.twoRange.value = String(values[1] || 0);
      els.twoValue.textContent = Number(els.twoRange.value).toFixed(1) + " mol";
    } else {
      els.twoField.hidden = true;
    }

    els.extraControls.replaceChildren();
    const extras = [];
    for (let i = 2; i < reactants.length; i++) {
      const entry = createExtraSlider(i, reactants[i].formula, values[i]);
      els.extraControls.appendChild(entry.wrap);
      extras.push(entry.range);
    }

    reactantControls = [els.oneRange];
    if (reactants.length > 1) reactantControls.push(els.twoRange);
    reactantControls = reactantControls.concat(extras);
  }

  function currentInputs() {
    return balanced.reactants.map((species, index) => ({
      formula: species.formula,
      coefficient: species.coefficient,
      moles: Math.max(0, Math.min(10, Number(reactantControls[index].value) || 0))
    }));
  }

  /*
   * Stoichiometric extent:
   *   xi = min(n_i / nu_i) over all reactants.
   * Product moles = nu_product * xi.
   * Reactant leftover = n_i - nu_i * xi.
   */
  function calculateStoichiometry() {
    const reactants = currentInputs();
    const ratios = reactants.map((item) => item.moles / item.coefficient);
    const extent = Math.min.apply(null, ratios);
    const tolerance = Math.max(1, Math.abs(extent)) * EPSILON;
    const limitingIndices = ratios
      .map((ratio, index) => Math.abs(ratio - extent) <= tolerance ? index : -1)
      .filter((index) => index >= 0);

    const reactantResults = reactants.map((item, index) => {
      const consumed = Math.min(item.moles, item.coefficient * extent);
      return {
        formula: item.formula,
        coefficient: item.coefficient,
        supplied: item.moles,
        consumed: consumed,
        leftover: Math.max(0, item.moles - consumed),
        ratio: ratios[index]
      };
    });

    const productResults = balanced.products.map((item) => ({
      formula: item.formula,
      coefficient: item.coefficient,
      moles: item.coefficient * extent
    }));

    return {
      extent: extent,
      ratios: ratios,
      limitingIndices: limitingIndices,
      reactants: reactantResults,
      products: productResults
    };
  }

  function updateCalculation() {
    if (!balanced || reactantControls.length !== balanced.reactants.length) return;
    calculation = calculateStoichiometry();
    renderResults();
    animationProgress = 1;
    drawScene(1);
  }

  function renderResults() {
    if (!calculation) return;
    const data = calculation;

    if (data.extent <= EPSILON) {
      els.limiting.innerHTML = '<span class="result-copy muted">Add a positive amount of each required reactant.</span>';
    } else {
      const names = data.limitingIndices.map((index) => data.reactants[index].formula);
      const label = names.length > 1 ? "Co-limiting: " + names.join(" + ") : names[0];
      const badge = document.createElement("span");
      badge.className = "reagent-badge";
      badge.textContent = label;
      els.limiting.replaceChildren(badge);
    }

    const excess = data.reactants.filter((item) => item.leftover > 1e-6);
    if (excess.length) {
      els.excess.textContent = excess.map((item) =>
        item.formula + ": " + formatMoles(item.leftover) + " left"
      ).join(" · ");
      els.excess.classList.remove("muted");
    } else {
      els.excess.textContent = data.extent <= EPSILON ? "No reaction has occurred yet." : "No excess reagent; the reactants are in the exact stoichiometric ratio.";
      els.excess.classList.add("muted");
    }

    els.products.replaceChildren();
    data.products.forEach((item) => {
      const li = document.createElement("li");
      const name = document.createElement("span");
      const amount = document.createElement("strong");
      name.textContent = item.formula;
      amount.textContent = formatMoles(item.moles);
      li.appendChild(name);
      li.appendChild(amount);
      els.products.appendChild(li);
    });

    els.extent.textContent = data.extent.toFixed(4) + " mol reaction extent (ξ)";
    renderSteps();
  }

  function addStep(text, strongText) {
    const li = document.createElement("li");
    if (strongText && text.indexOf(strongText) === 0) {
      const strong = document.createElement("strong");
      strong.textContent = strongText;
      li.appendChild(strong);
      li.appendChild(document.createTextNode(text.slice(strongText.length)));
    } else {
      li.textContent = text;
    }
    els.stepsList.appendChild(li);
  }

  function renderSteps() {
    if (!calculation) return;
    const data = calculation;
    els.stepsList.replaceChildren();

    addStep("Moles supplied: " + data.reactants.map((item) =>
      item.formula + " = " + formatMoles(item.supplied)
    ).join("; "));

    const ratioText = data.reactants.map((item) =>
      item.formula + ": " + item.supplied.toFixed(2) + " ÷ " + item.coefficient + " = " + item.ratio.toFixed(4)
    ).join("; ");
    addStep("Divide each reactant amount by its balanced coefficient (n/ν): " + ratioText + ".");

    const limitingNames = data.limitingIndices.map((index) => data.reactants[index].formula);
    addStep("The smallest n/ν value is " + data.extent.toFixed(4) + " mol. Limiting reagent: " + (limitingNames.join(" + ") || "none") + ".");

    addStep("Product formed: " + data.products.map((item) =>
      item.formula + " = " + item.coefficient + " × " + data.extent.toFixed(4) + " = " + formatMoles(item.moles)
    ).join("; "));

    addStep("Excess remaining: " + data.reactants.map((item) =>
      item.formula + " = " + item.supplied.toFixed(2) + " − " + item.consumed.toFixed(2) + " = " + formatMoles(item.leftover)
    ).join("; "));
  }

  function drawGlowParticle(x, y, radius, color, alpha) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.shadowColor = color;
    ctx.shadowBlur = 13;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha *= 0.38;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x - radius * 0.28, y - radius * 0.28, Math.max(0.8, radius * 0.28), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function particlePoint(index, count, laneX, width, height) {
    const columns = Math.max(5, Math.min(10, Math.floor(count / 5) + 1));
    const col = index % columns;
    const row = Math.floor(index / columns);
    const rows = Math.max(1, Math.ceil(count / columns));
    const spanX = Math.min(width * 0.18, 80);
    const spanY = Math.min(height * 0.58, 220);
    return {
      x: laneX + (col / Math.max(1, columns - 1) - 0.5) * spanX,
      y: height * 0.22 + (row / Math.max(1, rows - 1)) * spanY
    };
  }

  function drawScene(progress) {
    if (!ctx || !els.canvas) return;
    const width = canvasWidth;
    const height = canvasHeight;
    if (!width || !height) return;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, "#0c1730");
    background.addColorStop(0.52, "#0a1024");
    background.addColorStop(1, "#10132b");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width * .52, height * .48, 8, width * .52, height * .48, width * .52);
    glow.addColorStop(0, "rgba(98,231,255,.10)");
    glow.addColorStop(1, "rgba(98,231,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.setLineDash([4, 8]);
    ctx.strokeStyle = "rgba(166,185,240,.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width * .49, 38);
    ctx.lineTo(width * .49, height - 36);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(125,240,189,.62)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(125,240,189,.6)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(width * .52, height * .50);
    ctx.lineTo(width * .68, height * .50);
    ctx.lineTo(width * .65, height * .46);
    ctx.moveTo(width * .68, height * .50);
    ctx.lineTo(width * .65, height * .54);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "rgba(192,205,239,.78)";
    ctx.font = "800 10px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("REACTION ZONE", width * .57, height - 18);

    if (!calculation) {
      ctx.fillStyle = "rgba(203,214,244,.72)";
      ctx.font = "700 13px system-ui, sans-serif";
      ctx.fillText("Balance a reaction to begin", width * .5, height * .5);
      return;
    }

    const reactants = calculation.reactants;
    reactants.forEach((item, speciesIndex) => {
      const color = COLORS[speciesIndex % COLORS.length];
      const amount = Math.min(MAX_DRAW_PARTICLES, Math.round(item.supplied * PARTICLES_PER_MOLE));
      const consumed = Math.min(amount, Math.round(item.consumed * PARTICLES_PER_MOLE));
      const laneX = width * (0.13 + (speciesIndex / Math.max(1, reactants.length - 1)) * .27);
      for (let i = 0; i < amount; i++) {
        const point = particlePoint(i, amount, laneX, width, height);
        if (i < consumed && progress < 1) {
          const t = progress;
          const x = point.x + (width * .53 - point.x) * t;
          const y = point.y + (height * .50 - point.y) * t + Math.sin(t * Math.PI + i) * 8;
          drawGlowParticle(x, y, 2.4 + (1 - t) * 1.2, color, 1 - t * .9);
        } else if (i >= consumed) {
          drawGlowParticle(point.x, point.y, 3.1, color, .92);
        }
      }
    });

    calculation.products.forEach((item, speciesIndex) => {
      const amount = Math.min(MAX_DRAW_PARTICLES, Math.round(item.moles * PARTICLES_PER_MOLE));
      for (let i = 0; i < amount; i++) {
        const point = particlePoint(i, amount, width * .82, width, height);
        if (progress <= 0) continue;
        const t = progress;
        const x = width * .53 + (point.x - width * .53) * t;
        const y = height * .50 + (point.y - height * .50) * t;
        drawGlowParticle(x, y, 2.8 + t * .4, PRODUCT_COLOR, .95 * t);
      }
    });

    ctx.fillStyle = "rgba(185,198,231,.84)";
    ctx.font = "800 10px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SUPPLIED", width * .27, 22);
    ctx.fillText("FORMED", width * .82, 22);
    ctx.textAlign = "left";
  }

  function resizeCanvas() {
    const rect = els.canvas.getBoundingClientRect();
    if (!rect.width) return;
    pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    canvasWidth = rect.width;
    canvasHeight = Math.max(250, rect.height);
    els.canvas.width = Math.round(canvasWidth * pixelRatio);
    els.canvas.height = Math.round(canvasHeight * pixelRatio);
    drawScene(animationProgress);
  }

  function startAnimation() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    if (!calculation) return;
    if (reducedMotion) {
      animationProgress = 1;
      drawScene(1);
      return;
    }
    animationStart = performance.now();
    animationProgress = 0;
    const duration = 1850;
    function frame(now) {
      const elapsed = now - animationStart;
      animationProgress = Math.min(1, elapsed / duration);
      drawScene(animationProgress);
      if (animationProgress < 1) {
        animationFrame = requestAnimationFrame(frame);
      } else {
        animationFrame = 0;
        drawScene(1);
      }
    }
    animationFrame = requestAnimationFrame(frame);
  }

  function balanceReaction() {
    const input = els.reactionInput.value.trim();
    if (!input) {
      setStatus("Enter a reaction before balancing.", "error");
      els.reactionInput.focus();
      return;
    }
    if (!window.FastBalance || typeof window.FastBalance.balance !== "function") {
      setStatus("The fast-balance engine did not load. Check your connection and reload the lab.", "error");
      return;
    }

    els.simulateButton.disabled = true;
    try {
      const result = window.FastBalance.balance(input, { showOne: false, format: "text" });
      if (!result || !Array.isArray(result.reactants) || !Array.isArray(result.products) ||
          !result.reactants.length || !result.products.length) {
        throw new Error("The balancer returned an incomplete reaction.");
      }
      balanced = result;
      setupReactantControls(result.reactants, false);
      renderEquation();
      updateCalculation();
      if (result.underdetermined) {
        setStatus("Balanced with an underdetermined coefficient set. Verify the reaction context before using the result.", "info");
      } else {
        setStatus("Equation balanced. Adjust the reactant amounts or run the particle simulation.", "success");
      }
      startAnimation();
    } catch (error) {
      balanced = null;
      calculation = null;
      drawScene(1);
      setStatus(error && error.message ? error.message : "This reaction could not be balanced. Check the formulas and arrow.", "error");
    } finally {
      els.simulateButton.disabled = false;
    }
  }

  function updateSliderOutputs() {
    els.oneValue.textContent = Number(els.oneRange.value).toFixed(1) + " mol";
    els.twoValue.textContent = Number(els.twoRange.value).toFixed(1) + " mol";
  }

  els.oneRange.addEventListener("input", function () {
    updateSliderOutputs();
    updateCalculation();
  });
  els.twoRange.addEventListener("input", function () {
    updateSliderOutputs();
    updateCalculation();
  });

  els.simulateButton.addEventListener("click", balanceReaction);
  els.reactionInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") balanceReaction();
  });
  els.reactionSelect.addEventListener("change", function () {
    els.reactionInput.value = els.reactionSelect.value;
    balanceReaction();
  });
  els.stepsToggle.addEventListener("click", function () {
    const open = els.stepsPanel.hidden;
    els.stepsPanel.hidden = !open;
    els.stepsToggle.setAttribute("aria-expanded", open ? "true" : "false");
    els.stepsToggle.innerHTML = open
      ? '<span aria-hidden="true">▤</span> Hide Calculation Steps'
      : '<span aria-hidden="true">▤</span> Show Calculation Steps';
  });

  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(els.canvas.parentElement);
  } else {
    window.addEventListener("resize", resizeCanvas, { passive: true });
  }

  function initialize() {
    resizeCanvas();
    els.reactionInput.value = els.reactionSelect.value || DEFAULT_REACTION;
    balanceReaction();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
