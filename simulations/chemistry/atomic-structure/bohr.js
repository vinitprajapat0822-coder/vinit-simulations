/**
 * Vinit Simulation Hub — Atomic Structure / Bohr Model & Spectrum
 * Hydrogen Bohr levels n = 1 ... 6, Canvas 2D only.
 */

import {
  PLANCK_CONSTANT,
  SPEED_OF_LIGHT,
  ELECTRON_MASS,
  RYDBERG_CONSTANT,
  BOHR_RADIUS
} from "./constants.js";

const MAX_LEVEL = 6;
const RYDBERG_NM = RYDBERG_CONSTANT;
const SERIES = Object.freeze({
  "1": { name: "Lyman", lower: 1, region: "Ultraviolet" },
  "2": { name: "Balmer", lower: 2, region: "Visible" },
  "3": { name: "Paschen", lower: 3, region: "Infrared" },
  "4": { name: "Brackett", lower: 4, region: "Infrared" },
  "5": { name: "Pfund", lower: 5, region: "Infrared" }
});

const COLORS = Object.freeze({
  purple: "#a78bfa",
  cyan: "#62e7ff",
  green: "#7df0bd",
  text: "#f5f1ff",
  muted: "#aaa0c5",
  panel: "#0a0514"
});

const SPECTRUM_MIN_NM = 380;
const SPECTRUM_MAX_NM = 750;

const ui = {
  canvas: document.getElementById("bohr-canvas"),
  spectrumCanvas: document.getElementById("spectrum-canvas"),
  series: document.getElementById("spectral-series"),
  waveToggle: document.getElementById("show-debroglie"),
  excite: document.getElementById("excite-atom"),
  energy: document.getElementById("energy-value"),
  radius: document.getElementById("radius-value"),
  velocity: document.getElementById("velocity-value"),
  liveEquations: document.getElementById("live-equations"),
  stageState: document.getElementById("stage-current-state"),
  orbitChip: document.getElementById("current-orbit-chip"),
  seriesLabel: document.getElementById("spectrum-series-label"),
  status: document.getElementById("bohr-status"),
  transitionEquation: document.getElementById("transition-equation"),
  lastTransition: document.getElementById("last-transition")
};

let currentN = 1;
let electronAngle = -Math.PI / 2;
let animationFrame = 0;
let lastFrameTime = 0;
let resizeObserver = null;
let geometry = null;
let photonParticles = [];
let spectrumLines = [];
let previousTransition = null;
let mathJaxReady = false;

const canvasContext = ui.canvas ? ui.canvas.getContext("2d") : null;
const spectrumContext = ui.spectrumCanvas
  ? ui.spectrumCanvas.getContext("2d")
  : null;

function assertElements() {
  for (const [name, element] of Object.entries(ui)) {
    if (!element) throw new Error("Missing Bohr model element: " + name);
  }
  if (!canvasContext || !spectrumContext) {
    throw new Error("Canvas 2D is unavailable in this browser.");
  }
}

function levelEnergyEV(n) {
  return -13.6 / (n * n);
}

function levelRadiusPm(n) {
  return 52.9 * n * n;
}

function levelVelocityMps(n) {
  return 2.18e6 / n;
}

function deBroglieWavelengthPm(n) {
  const velocity = levelVelocityMps(n);
  return PLANCK_CONSTANT / (ELECTRON_MASS * velocity) * 1e12;
}

function transitionWavelengthNm(lowerN, upperN) {
  if (
    !Number.isInteger(lowerN) ||
    !Number.isInteger(upperN) ||
    lowerN < 1 ||
    upperN <= lowerN
  ) {
    throw new RangeError("Emission requires integer levels with upper n > lower n >= 1.");
  }

  const inverseWavelengthPerMetre =
    RYDBERG_NM * (1 / (lowerN * lowerN) - 1 / (upperN * upperN));

  if (!Number.isFinite(inverseWavelengthPerMetre) || inverseWavelengthPerMetre <= 0) {
    throw new RangeError("Rydberg calculation produced an invalid wavelength.");
  }

  return 1e9 / inverseWavelengthPerMetre;
}

function photonEnergyEVForTransition(lowerN, upperN) {
  const wavelengthMetres = transitionWavelengthNm(lowerN, upperN) * 1e-9;
  return PLANCK_CONSTANT * SPEED_OF_LIGHT /
    (wavelengthMetres * 1.602176634e-19);
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function formatScientific(value, significantDigits) {
  return value.toExponential(significantDigits - 1)
    .replace("e+", " × 10^")
    .replace("e-", " × 10^-");
}

/**
 * Map a wavelength to an approximate perceived spectral color.
 * Values outside the visible range receive UV / IR indicator colors.
 */
function wavelengthToColor(wavelengthNm) {
  if (wavelengthNm < 380) return "#9b78ff";
  if (wavelengthNm > 750) return "#ff9b72";

  let red = 0;
  let green = 0;
  let blue = 0;

  if (wavelengthNm < 440) {
    red = -(wavelengthNm - 440) / (440 - 380);
    blue = 1;
  } else if (wavelengthNm < 490) {
    green = (wavelengthNm - 440) / (490 - 440);
    blue = 1;
  } else if (wavelengthNm < 510) {
    green = 1;
    blue = -(wavelengthNm - 510) / (510 - 490);
  } else if (wavelengthNm < 580) {
    red = (wavelengthNm - 510) / (580 - 510);
    green = 1;
  } else if (wavelengthNm < 645) {
    red = 1;
    green = -(wavelengthNm - 645) / (645 - 580);
  } else {
    red = 1;
  }

  let attenuation = 1;
  if (wavelengthNm < 420) {
    attenuation = 0.35 + 0.65 * (wavelengthNm - 380) / 40;
  } else if (wavelengthNm > 700) {
    attenuation = 0.35 + 0.65 * (750 - wavelengthNm) / 50;
  }

  const gamma = (channel) => Math.round(
    255 * Math.pow(clamp(channel * attenuation, 0, 1), 0.8)
  );

  return "rgb(" + gamma(red) + "," + gamma(green) + "," + gamma(blue) + ")";
}

function getCanvasSize(canvas) {
  return {
    width: Math.max(1, canvas.clientWidth),
    height: Math.max(1, canvas.clientHeight),
    ratio: Math.min(window.devicePixelRatio || 1, 1.5)
  };
}

function resizeCanvas(canvas, context) {
  const size = getCanvasSize(canvas);
  const pixelWidth = Math.round(size.width * size.ratio);
  const pixelHeight = Math.round(size.height * size.ratio);

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  context.setTransform(size.ratio, 0, 0, size.ratio, 0, 0);
  return size;
}

/**
 * The orbit circles are schematic and deliberately spaced for touch selection.
 * The displayed r_n values remain the physical n^2-scaled Bohr radii.
 */
function calculateGeometry(width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.max(92, Math.min(width, height) * 0.405);
  const radii = [];

  for (let n = 1; n <= MAX_LEVEL; n += 1) {
    radii.push(maxRadius * Math.pow(n / MAX_LEVEL, 1.3));
  }

  return { cx, cy, maxRadius, radii, width, height };
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function drawBohrBackground(ctx, width, height) {
  ctx.fillStyle = "#090515";
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(
    width / 2, height / 2, 8,
    width / 2, height / 2, Math.max(width, height) * 0.62
  );
  glow.addColorStop(0, "rgba(98,231,255,0.065)");
  glow.addColorStop(0.54, "rgba(167,139,250,0.045)");
  glow.addColorStop(1, "rgba(10,5,20,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

function drawOrbits(ctx, geo) {
  for (let n = 1; n <= MAX_LEVEL; n += 1) {
    const radius = geo.radii[n - 1];
    const active = n === currentN;

    ctx.save();
    ctx.beginPath();
    ctx.arc(geo.cx, geo.cy, radius, 0, Math.PI * 2);

    ctx.lineWidth = active ? 1.8 : 1.05;
    ctx.setLineDash(active ? [] : [3, 5]);
    ctx.strokeStyle = active
      ? "rgba(98,231,255,0.82)"
      : "rgba(167,139,250,0.37)";

    if (active) {
      ctx.shadowColor = "rgba(98,231,255,0.36)";
      ctx.shadowBlur = 12;
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    const labelAngle = -Math.PI / 2 - 0.09;
    const labelX = geo.cx + Math.cos(labelAngle) * radius;
    const labelY = geo.cy + Math.sin(labelAngle) * radius;

    ctx.fillStyle = active ? "#bdf7ff" : "rgba(205,190,232,0.80)";
    ctx.font = active ? "bold 11px system-ui,sans-serif" : "10px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("n=" + n, labelX, labelY - 9);
    ctx.restore();
  }
}

function drawDeBroglieWave(ctx, geo) {
  if (!ui.waveToggle.checked) return;

  const radius = geo.radii[currentN - 1];
  const amplitude = clamp(radius * 0.055, 2.3, 6.5);
  const steps = Math.max(240, currentN * 100);

  ctx.save();
  ctx.beginPath();

  for (let index = 0; index <= steps; index += 1) {
    const angle = (index / steps) * Math.PI * 2;
    const waveRadius = radius + amplitude * Math.sin(currentN * angle);
    const x = geo.cx + Math.cos(angle) * waveRadius;
    const y = geo.cy + Math.sin(angle) * waveRadius;

    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.strokeStyle = "rgba(125,240,189,0.92)";
  ctx.lineWidth = 1.7;
  ctx.shadowColor = "rgba(125,240,189,0.58)";
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.restore();
}

function drawNucleus(ctx, geo) {
  const radius = 10.5;
  ctx.save();

  const halo = ctx.createRadialGradient(
    geo.cx, geo.cy, 1,
    geo.cx, geo.cy, radius * 3.5
  );
  halo.addColorStop(0, "rgba(244,114,208,0.38)");
  halo.addColorStop(0.45, "rgba(167,139,250,0.14)");
  halo.addColorStop(1, "rgba(167,139,250,0)");

  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(geo.cx, geo.cy, radius * 3.5, 0, Math.PI * 2);
  ctx.fill();

  const core = ctx.createRadialGradient(
    geo.cx - 3, geo.cy - 4, 1,
    geo.cx, geo.cy, radius
  );
  core.addColorStop(0, "#fff0ff");
  core.addColorStop(0.32, "#f472d0");
  core.addColorStop(1, "#8b3d9b");

  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(geo.cx, geo.cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.arc(geo.cx - 3.2, geo.cy - 3.3, 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function getElectronPosition(geo) {
  const radius = geo.radii[currentN - 1];
  return {
    x: geo.cx + Math.cos(electronAngle) * radius,
    y: geo.cy + Math.sin(electronAngle) * radius,
    radius
  };
}

function drawElectron(ctx, geo) {
  const position = getElectronPosition(geo);
  const electronRadius = 5.2;

  ctx.save();
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 19;
  ctx.fillStyle = COLORS.cyan;
  ctx.beginPath();
  ctx.arc(position.x, position.y, electronRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#f3feff";
  ctx.beginPath();
  ctx.arc(position.x - 1.6, position.y - 1.6, 1.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPhotonParticles(ctx, deltaTime) {
  photonParticles.forEach((photon) => {
    photon.x += photon.vx * deltaTime;
    photon.y += photon.vy * deltaTime;
    photon.age += deltaTime;

    const alpha = clamp(1 - photon.age / photon.life, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = photon.color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = photon.color;
    ctx.beginPath();
    ctx.arc(photon.x, photon.y, 3.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha * 0.55;
    ctx.strokeStyle = photon.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(photon.x, photon.y);
    ctx.lineTo(photon.x - photon.vx * 0.045, photon.y - photon.vy * 0.045);
    ctx.stroke();
    ctx.restore();
  });

  photonParticles = photonParticles.filter((photon) =>
    photon.age < photon.life &&
    photon.x > -30 && photon.x < geoWidth() + 30 &&
    photon.y > -30 && photon.y < geoHeight() + 30
  );
}

function geoWidth() {
  return ui.canvas.clientWidth;
}

function geoHeight() {
  return ui.canvas.clientHeight;
}

function renderBohrCanvas(deltaTime) {
  const size = resizeCanvas(ui.canvas, canvasContext);
  const geo = calculateGeometry(size.width, size.height);
  geometry = geo;

  drawBohrBackground(canvasContext, size.width, size.height);
  drawOrbits(canvasContext, geo);
  drawDeBroglieWave(canvasContext, geo);
  drawNucleus(canvasContext, geo);
  drawElectron(canvasContext, geo);
  drawPhotonParticles(canvasContext, deltaTime);
}

function recordPhoton(lowerN, upperN, origin) {
  const wavelengthNm = transitionWavelengthNm(lowerN, upperN);
  const color = wavelengthToColor(wavelengthNm);
  const direction = electronAngle + 0.72;
  const speed = 150;

  photonParticles.push({
    x: origin.x,
    y: origin.y,
    vx: Math.cos(direction) * speed,
    vy: Math.sin(direction) * speed,
    color,
    wavelengthNm,
    upperN,
    lowerN,
    age: 0,
    life: 2.2
  });

  if (photonParticles.length > 24) photonParticles.shift();

  spectrumLines.push({
    wavelengthNm,
    color,
    upperN,
    lowerN,
    series: String(lowerN),
    label: upperN + " → " + lowerN
  });
  if (spectrumLines.length > 80) spectrumLines.shift();

  previousTransition = {
    upperN,
    lowerN,
    wavelengthNm,
    color
  };

  ui.lastTransition.textContent =
    upperN + " → " + lowerN + " · λ = " + wavelengthNm.toFixed(1) +
    " nm · " + seriesForLowerLevel(lowerN).name + " series";

  const inverseWavelength = RYDBERG_NM *
    (1 / (lowerN * lowerN) - 1 / (upperN * upperN));

  ui.transitionEquation.innerHTML =
    "\\\\(\\\\frac{1}{\\\\lambda}=" + RYDBERG_NM.toExponential(4) +
    "\\\\left(\\\\frac{1}{" + lowerN + "^2}-\\\\frac{1}{" +
    upperN + "^2}\\\\right)= " + (inverseWavelength / 1e9).toExponential(4) +
    "\\\\;\\\\text{nm}^{-1}\\\\\\\\" + "\\\\)";

  typesetNodes([ui.transitionEquation]);
  renderSpectrum();
}

function seriesForLowerLevel(lowerN) {
  return SERIES[String(lowerN)] || { name: "Unknown", lower: lowerN };
}

function jumpToLevel(targetN) {
  if (!Number.isInteger(targetN) || targetN < 1 || targetN > MAX_LEVEL) return;
  if (targetN === currentN) {
    ui.status.textContent = "The electron is already in the n = " + currentN + " orbit.";
    return;
  }

  const previousN = currentN;
  const electronOrigin = geometry
    ? getElectronPosition(geometry)
    : { x: ui.canvas.clientWidth / 2, y: ui.canvas.clientHeight / 2 };

  currentN = targetN;
  updateLiveData();

  if (targetN < previousN) {
    recordPhoton(targetN, previousN, electronOrigin);
    ui.status.textContent =
      "Emission: n = " + previousN + " → n = " + targetN +
      ". A photon has been emitted.";
  } else {
    ui.status.textContent =
      "Excitation: n = " + previousN + " → n = " + targetN +
      ". Energy is absorbed; no emission line is added.";
  }
}

function exciteAtom() {
  if (currentN >= MAX_LEVEL) {
    ui.status.textContent = "The atom is already at the highest displayed level, n = 6.";
    ui.excite.disabled = true;
    return;
  }
  jumpToLevel(currentN + 1);
  ui.excite.disabled = currentN >= MAX_LEVEL;
}

function updateLiveData() {
  const n = currentN;
  const energy = levelEnergyEV(n);
  const radius = levelRadiusPm(n);
  const velocity = levelVelocityMps(n);
  const deBroglie = deBroglieWavelengthPm(n);

  ui.energy.textContent = energy.toFixed(3) + " eV";
  ui.radius.textContent = radius.toFixed(1) + " pm";
  ui.velocity.textContent = formatScientific(velocity, 3) + " m/s";
  ui.stageState.textContent = "Electron · n = " + n;
  ui.orbitChip.textContent = "n = " + n;

  ui.liveEquations.innerHTML =
    "<div>\\\\(E_" + n + "=-\\\\frac{13.6}{" + n + "^2}=" +
      energy.toFixed(3) + "\\\\;\\\\text{eV}\\\\)</div>" +
    "<div>\\\\(r_" + n + "=52.9\\\\times" + n + "^2=" +
      radius.toFixed(1) + "\\\\;\\\\text{pm}\\\\)</div>" +
    "<div>\\\\(v_" + n + "=\\\\frac{2.18\\\\times10^6}{" + n + "}=" +
      velocity.toExponential(3).replace("e+", "\\\\times10^{") + "}\\\\;\\\\text{m/s}\\\\)</div>";

  if (ui.waveToggle.checked) {
    ui.status.textContent =
      "de Broglie standing wave: " + n + " complete wavelength cycles fit around the selected orbit.";
  }

  typesetNodes([ui.liveEquations]);
}

function visibleSpectrumColor(wavelengthNm) {
  return wavelengthToColor(wavelengthNm);
}

function drawSpectrumBackground(ctx, width, height) {
  ctx.fillStyle = "#030207";
  ctx.fillRect(0, 0, width, height);

  const left = 28;
  const right = width - 28;
  const bandY = 22;
  const bandHeight = Math.max(35, height - 52);

  const gradient = ctx.createLinearGradient(left, 0, right, 0);
  gradient.addColorStop(0, "#8b55ff");
  gradient.addColorStop(0.16, "#405dff");
  gradient.addColorStop(0.31, "#26bbff");
  gradient.addColorStop(0.46, "#25e2b1");
  gradient.addColorStop(0.62, "#e2f04d");
  gradient.addColorStop(0.76, "#ffad42");
  gradient.addColorStop(1, "#ff4545");

  ctx.save();
  ctx.globalAlpha = 0.09;
  ctx.fillStyle = gradient;
  roundedRect(ctx, left, bandY, right - left, bandHeight, 8);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "rgba(221,207,255,0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, bandY + bandHeight + 8);
  ctx.lineTo(right, bandY + bandHeight + 8);
  ctx.stroke();

  ctx.fillStyle = "rgba(205,190,232,0.72)";
  ctx.font = "9px system-ui,sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("380 nm", left, height - 5);
  ctx.fillText("Visible wavelength", width / 2, 12);
  ctx.fillText("750 nm", right, height - 5);

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(155,127,255,0.82)";
  ctx.fillText("UV", 4, bandY + bandHeight / 2 + 3);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,164,124,0.82)";
  ctx.fillText("IR", width - 4, bandY + bandHeight / 2 + 3);
}

function wavelengthToSpectrumX(wavelengthNm, width) {
  const left = 28;
  const right = width - 28;
  if (wavelengthNm < SPECTRUM_MIN_NM) return left;
  if (wavelengthNm > SPECTRUM_MAX_NM) return right;
  return left + (
    (wavelengthNm - SPECTRUM_MIN_NM) /
    (SPECTRUM_MAX_NM - SPECTRUM_MIN_NM)
  ) * (right - left);
}

function renderSpectrum() {
  const size = resizeCanvas(ui.spectrumCanvas, spectrumContext);
  const ctx = spectrumContext;
  const width = size.width;
  const height = size.height;
  const series = ui.series.value;

  ctx.fillStyle = "#030207";
  ctx.fillRect(0, 0, width, height);
  drawSpectrumBackground(ctx, width, height);

  const filtered = spectrumLines.filter((line) => line.series === series);
  const seriesInfo = SERIES[series];

  filtered.forEach((line, index) => {
    const x = wavelengthToSpectrumX(line.wavelengthNm, width);
    const top = 21;
    const bottom = height - 28;
    const outside = line.wavelengthNm < SPECTRUM_MIN_NM ||
      line.wavelengthNm > SPECTRUM_MAX_NM;

    ctx.save();
    ctx.strokeStyle = line.color;
    ctx.shadowColor = line.color;
    ctx.shadowBlur = 14;
    ctx.lineWidth = outside ? 2 : 2.4;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = line.color;
    ctx.font = "9px system-ui,sans-serif";
    ctx.textAlign = x < width * 0.16 ? "left" : (x > width * 0.84 ? "right" : "center");
    const labelX = x < width * 0.16 ? x + 4 : (x > width * 0.84 ? x - 4 : x);
    ctx.fillText(
      (outside ? (line.wavelengthNm < SPECTRUM_MIN_NM ? "UV " : "IR ") : "") +
      line.wavelengthNm.toFixed(1) + " nm",
      labelX,
      top + 10 + (index % 3) * 12
    );
    ctx.restore();
  });

  if (filtered.length === 0) {
    ctx.save();
    ctx.fillStyle = "rgba(205,190,232,0.7)";
    ctx.font = "11px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "No " + seriesInfo.name + " lines yet · emit a transition ending at n = " + series,
      width / 2,
      height / 2 + 4
    );
    ctx.restore();
  }

  ui.seriesLabel.textContent =
    seriesInfo.name + " series · n₁ = " + series +
    " · " + filtered.length + " line" + (filtered.length === 1 ? "" : "s");
}

function handleCanvasPointer(event) {
  if (!geometry) return;
  const rect = ui.canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const dx = x - geometry.cx;
  const dy = y - geometry.cy;
  const distance = Math.sqrt(dx * dx + dy * dy);

  let nearestN = 1;
  let nearestDifference = Infinity;

  geometry.radii.forEach((radius, index) => {
    const difference = Math.abs(distance - radius);
    if (difference < nearestDifference) {
      nearestDifference = difference;
      nearestN = index + 1;
    }
  });

  if (nearestDifference <= 23) {
    jumpToLevel(nearestN);
  } else {
    ui.status.textContent = "Tap closer to one of the six circular energy levels.";
  }
}

async function typesetNodes(nodes) {
  if (!window.MathJax || typeof window.MathJax.typesetPromise !== "function") return;
  try {
    if (window.MathJax.startup && window.MathJax.startup.promise) {
      await window.MathJax.startup.promise;
    }
    if (!mathJaxReady) mathJaxReady = true;
    nodes.forEach((node) => {
      if (typeof window.MathJax.typesetClear === "function") {
        window.MathJax.typesetClear([node]);
      }
    });
    await window.MathJax.typesetPromise(nodes);
  } catch (error) {
    console.warn("MathJax could not typeset the Bohr data:", error);
  }
}

function bindControls() {
  ui.canvas.addEventListener("pointerdown", handleCanvasPointer);
  ui.excite.addEventListener("click", exciteAtom);

  ui.waveToggle.addEventListener("change", () => {
    ui.status.textContent = ui.waveToggle.checked
      ? "de Broglie wave enabled: exactly " + currentN + " standing-wave cycles are drawn."
      : "de Broglie wave hidden.";
  });

  ui.series.addEventListener("change", () => {
    renderSpectrum();
    const series = SERIES[ui.series.value];
    ui.status.textContent =
      "Showing " + series.name + " transitions ending at n = " + series.lower + ".";
  });
}

function animate(timestamp) {
  animationFrame = window.requestAnimationFrame(animate);

  if (document.hidden) {
    lastFrameTime = timestamp;
    return;
  }

  if (!lastFrameTime) lastFrameTime = timestamp;
  const deltaTime = clamp((timestamp - lastFrameTime) / 1000, 0, 0.05);
  lastFrameTime = timestamp;

  // Bohr angular velocity scales as 1/n^3: larger orbits move more slowly.
  electronAngle += (2.4 / Math.pow(currentN, 3)) * deltaTime;
  if (electronAngle > Math.PI * 2) electronAngle -= Math.PI * 2;

  renderBohrCanvas(deltaTime);
}

function setupResize() {
  const resize = () => {
    renderBohrCanvas(0);
    renderSpectrum();
  };

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(ui.canvas);
    resizeObserver.observe(ui.spectrumCanvas);
  } else {
    window.addEventListener("resize", resize, { passive: true });
  }
  resize();
}

function init() {
  try {
    assertElements();
    bindControls();
    updateLiveData();
    renderSpectrum();
    setupResize();
    ui.excite.disabled = false;
    ui.status.textContent =
      "Tap an orbit to change the electron's energy level. Downward jumps emit photons.";
    animationFrame = window.requestAnimationFrame(animate);
  } catch (error) {
    console.error("Bohr model initialisation failed:", error);
    ui.status.textContent = "The Bohr simulation could not start. Check the browser console.";
  }
}

function dispose() {
  if (animationFrame) window.cancelAnimationFrame(animationFrame);
  if (resizeObserver) resizeObserver.disconnect();
}

window.addEventListener("pagehide", dispose, { once: true });

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
