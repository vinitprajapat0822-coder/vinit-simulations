/**
 * Vinit Simulation Hub — Atomic Structure / Bohr vs Quantum
 * Canvas-only comparison of a classical Bohr orbit and hydrogen ns probability clouds.
 *
 * The cloud is a 2D cross-section of |ψ|². Points are sampled over the plane
 * with area weight r |R_n0(r)|², so radial nodes appear as dark circular gaps.
 * The uncertainty slider is an explicitly illustrative spread control, not a measured Δx.
 */

(function () {
  "use strict";

  const BOHR_RADIUS_PM = 52.917721;
  const RYDBERG_EV = 13.605693;
  const CLOUD_POINTS = 920;

  const ui = {
    bohrCanvas: document.getElementById("bohr-canvas"),
    quantumCanvas: document.getElementById("quantum-canvas"),
    uncertainty: document.getElementById("uncertainty-slider"),
    uncertaintyValue: document.getElementById("uncertainty-value"),
    quantumNumber: document.getElementById("quantum-number"),
    bohrLevel: document.getElementById("bohr-level-label"),
    quantumLevel: document.getElementById("quantum-level-label"),
    comparisonN: document.getElementById("comparison-n-label"),
    bohrRadius: document.getElementById("bohr-radius"),
    quantumRadius: document.getElementById("quantum-radius"),
    bohrEnergy: document.getElementById("bohr-energy"),
    quantumEnergy: document.getElementById("quantum-energy")
  };

  const bohrCtx = ui.bohrCanvas.getContext("2d");
  const quantumCtx = ui.quantumCanvas.getContext("2d");

  let level = 1;
  let uncertainty = 0;
  let angle = -Math.PI / 2;
  let previousFrame = 0;
  let bohrSize = { width: 0, height: 0 };
  let quantumSize = { width: 0, height: 0 };
  let cloud = [];
  let reducedMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function seededRandom(seed) {
    let state = seed >>> 0;
    return function () {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function laguerreForSState(n, x) {
    if (n === 1) return 1;
    if (n === 2) return 2 - x;
    return 0.5 * (x * x - 6 * x + 6);
  }

  function createRadialSampler(n) {
    const steps = 2400;
    const maxX = 42;
    const dx = maxX / steps;
    const cdf = new Float64Array(steps + 1);
    let total = 0;
    let previousDensity = 0;

    for (let i = 1; i <= steps; i += 1) {
      const x = i * dx;
      const laguerre = laguerreForSState(n, x);
      const density = x * laguerre * laguerre * Math.exp(-x);
      total += (previousDensity + density) * 0.5 * dx;
      cdf[i] = total;
      previousDensity = density;
    }

    if (!Number.isFinite(total) || total <= 0) {
      throw new Error("Unable to construct the radial probability distribution.");
    }

    for (let i = 1; i <= steps; i += 1) cdf[i] /= total;

    return function (random) {
      const target = random();
      let low = 1;
      let high = steps;

      while (low < high) {
        const middle = (low + high) >> 1;
        if (cdf[middle] < target) low = middle + 1;
        else high = middle;
      }

      const before = cdf[low - 1];
      const after = cdf[low];
      const fraction = after > before ? (target - before) / (after - before) : 0;
      return ((low - 1) + fraction) * dx;
    };
  }

  function buildCloud(n) {
    const random = seededRandom(0x51f15e + n * 997);
    const sampleRadius = createRadialSampler(n);
    const points = [];

    for (let i = 0; i < CLOUD_POINTS; i += 1) {
      const x = sampleRadius(random);
      const radiusA0 = (n * x) / 2;
      const azimuth = random() * Math.PI * 2;
      const opacity = 0.25 + random() * 0.48;
      const dotSize = 0.65 + random() * 1.05;

      points.push({
        x: Math.cos(azimuth) * radiusA0,
        y: Math.sin(azimuth) * radiusA0,
        opacity: opacity,
        size: dotSize
      });
    }

    return points;
  }

  function resizeCanvas(canvas, ctx) {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.65);
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width: width, height: height };
  }

  function drawBackdrop(ctx, width, height, tint) {
    ctx.clearRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(
      width * 0.5, height * 0.48, 2,
      width * 0.5, height * 0.48, Math.min(width, height) * 0.57
    );
    glow.addColorStop(0, tint);
    glow.addColorStop(1, "rgba(5,4,14,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = "rgba(190,190,230,0.16)";
    ctx.lineWidth = 1;
    const gap = 34;
    for (let x = 0; x < width; x += gap) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gap) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawNucleus(ctx, cx, cy) {
    ctx.save();
    const halo = ctx.createRadialGradient(cx, cy, 1, cx, cy, 30);
    halo.addColorStop(0, "rgba(244,114,208,0.34)");
    halo.addColorStop(0.42, "rgba(167,139,250,0.16)");
    halo.addColorStop(1, "rgba(167,139,250,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fill();

    const core = ctx.createRadialGradient(cx - 3, cy - 4, 1, cx, cy, 9);
    core.addColorStop(0, "#fff4ff");
    core.addColorStop(0.36, "#f472d0");
    core.addColorStop(1, "#853d9b");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBohr() {
    const size = resizeCanvas(ui.bohrCanvas, bohrCtx);
    bohrSize = size;
    const width = size.width;
    const height = size.height;
    const cx = width / 2;
    const cy = height / 2;
    const minSide = Math.min(width, height);
    const orbitRadius = minSide * (0.115 + (level - 1) * 0.102);
    const speed = 1.15 / Math.sqrt(level);
    const x = cx + Math.cos(angle) * orbitRadius;
    const y = cy + Math.sin(angle) * orbitRadius;

    drawBackdrop(bohrCtx, width, height, "rgba(98,231,255,0.11)");

    bohrCtx.save();
    bohrCtx.strokeStyle = "rgba(98,231,255,0.20)";
    bohrCtx.lineWidth = 1;
    bohrCtx.setLineDash([3, 7]);
    bohrCtx.beginPath();
    bohrCtx.arc(cx, cy, orbitRadius, 0, Math.PI * 2);
    bohrCtx.stroke();
    bohrCtx.setLineDash([]);
    bohrCtx.restore();

    const blurStrength = (uncertainty / 100) * 7;
    const ghostCount = uncertainty > 2 ? 3 : 0;
    for (let i = ghostCount; i >= 1; i -= 1) {
      const ghostAngle = angle - speed * 0.018 * i;
      const ghostX = cx + Math.cos(ghostAngle) * orbitRadius;
      const ghostY = cy + Math.sin(ghostAngle) * orbitRadius;
      bohrCtx.save();
      bohrCtx.globalAlpha = (uncertainty / 100) * (0.18 / i);
      bohrCtx.fillStyle = "#62e7ff";
      bohrCtx.beginPath();
      bohrCtx.arc(ghostX, ghostY, 4.2 + blurStrength * 0.12, 0, Math.PI * 2);
      bohrCtx.fill();
      bohrCtx.restore();
    }

    drawNucleus(bohrCtx, cx, cy);

    bohrCtx.save();
    bohrCtx.shadowColor = "#62e7ff";
    bohrCtx.shadowBlur = 17 + blurStrength;
    bohrCtx.fillStyle = "#62e7ff";
    bohrCtx.beginPath();
    bohrCtx.arc(x, y, 5.4, 0, Math.PI * 2);
    bohrCtx.fill();
    bohrCtx.shadowBlur = 0;
    bohrCtx.fillStyle = "#f4feff";
    bohrCtx.beginPath();
    bohrCtx.arc(x - 1.5, y - 1.5, 1.8, 0, Math.PI * 2);
    bohrCtx.fill();
    bohrCtx.restore();

    bohrCtx.save();
    bohrCtx.fillStyle = "rgba(221,210,245,0.64)";
    bohrCtx.font = "10px system-ui, sans-serif";
    bohrCtx.textAlign = "center";
    bohrCtx.fillText("r" + level + " = " + (BOHR_RADIUS_PM * level * level).toFixed(1) + " pm", cx, height - 17);
    bohrCtx.restore();
  }

  function drawQuantum() {
    const size = resizeCanvas(ui.quantumCanvas, quantumCtx);
    quantumSize = size;
    const width = size.width;
    const height = size.height;
    const cx = width / 2;
    const cy = height / 2;
    const minSide = Math.min(width, height);
    const spread = 1 + (uncertainty / 100) * 0.55;
    const pixelsPerA0 = (minSide * 0.046) / level;

    drawBackdrop(quantumCtx, width, height, "rgba(125,240,189,0.105)");

    const glowRadius = minSide * (0.08 + 0.055 * level) * spread;
    const cloudGlow = quantumCtx.createRadialGradient(cx, cy, 1, cx, cy, glowRadius);
    cloudGlow.addColorStop(0, "rgba(125,240,189," + (0.13 + uncertainty / 1000) + ")");
    cloudGlow.addColorStop(0.5, "rgba(98,231,255,0.055)");
    cloudGlow.addColorStop(1, "rgba(98,231,255,0)");
    quantumCtx.fillStyle = cloudGlow;
    quantumCtx.fillRect(0, 0, width, height);

    quantumCtx.save();
    quantumCtx.globalCompositeOperation = "lighter";
    const pointAlpha = 0.30 - (uncertainty / 100) * 0.07;
    const pointBlur = 1.2 + (uncertainty / 100) * 3.8;
    quantumCtx.shadowColor = "rgba(98,231,255,0.72)";
    quantumCtx.shadowBlur = pointBlur;

    for (let i = 0; i < cloud.length; i += 1) {
      const point = cloud[i];
      const px = cx + point.x * pixelsPerA0 * spread;
      const py = cy + point.y * pixelsPerA0 * spread;

      if (px < -8 || px > width + 8 || py < -8 || py > height + 8) continue;

      quantumCtx.globalAlpha = pointAlpha * point.opacity;
      quantumCtx.fillStyle = i % 7 === 0 ? "#7df0bd" : "#62e7ff";
      quantumCtx.beginPath();
      quantumCtx.arc(px, py, point.size, 0, Math.PI * 2);
      quantumCtx.fill();
    }
    quantumCtx.restore();

    drawNucleus(quantumCtx, cx, cy);

    quantumCtx.save();
    quantumCtx.fillStyle = "rgba(221,210,245,0.64)";
    quantumCtx.font = "10px system-ui, sans-serif";
    quantumCtx.textAlign = "center";
    quantumCtx.fillText(level + "s radial probability · schematic scale", cx, height - 17);
    quantumCtx.restore();
  }

  function updateComparison() {
    const nSquared = level * level;
    const bohrRadius = BOHR_RADIUS_PM * nSquared;
    const quantumMeanRadius = 1.5 * BOHR_RADIUS_PM * nSquared;
    const energy = -RYDBERG_EV / nSquared;

    ui.bohrLevel.textContent = "n = " + level;
    ui.quantumLevel.textContent = level + "s orbital · " +
      (level === 1 ? "no radial nodes" : (level - 1) + " radial node(s)");
    ui.comparisonN.textContent = "n = " + level;
    ui.bohrRadius.textContent = bohrRadius.toFixed(1) + " pm";
    ui.quantumRadius.textContent = quantumMeanRadius.toFixed(1) + " pm";
    ui.bohrEnergy.textContent = energy.toFixed(3) + " eV";
    ui.quantumEnergy.textContent = energy.toFixed(3) + " eV";
    ui.uncertaintyValue.textContent = uncertainty + "%";
    ui.uncertainty.setAttribute("aria-valuetext", uncertainty + " percent illustrative spread");
  }

  function updateVisuals() {
    updateComparison();
    cloud = buildCloud(level);
    drawQuantum();
    drawBohr();
  }

  function onFrame(timestamp) {
    if (!previousFrame) previousFrame = timestamp;
    const delta = Math.min((timestamp - previousFrame) / 1000, 0.04);
    previousFrame = timestamp;

    if (!reducedMotion) angle = (angle + delta * (1.15 / Math.sqrt(level))) % (Math.PI * 2);
    drawBohr();
    window.requestAnimationFrame(onFrame);
  }

  function handleResize() {
    drawBohr();
    drawQuantum();
  }

  ui.uncertainty.addEventListener("input", function () {
    uncertainty = clamp(Number(ui.uncertainty.value) || 0, 0, 100);
    updateComparison();
    drawQuantum();
    drawBohr();
  });

  ui.quantumNumber.addEventListener("change", function () {
    const selected = Number(ui.quantumNumber.value);
    level = Number.isInteger(selected) ? clamp(selected, 1, 3) : 1;
    updateVisuals();
  });

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(handleResize);
    observer.observe(ui.bohrCanvas);
    observer.observe(ui.quantumCanvas);
  } else {
    window.addEventListener("resize", handleResize, { passive: true });
  }

  updateVisuals();
  window.requestAnimationFrame(onFrame);
})();
