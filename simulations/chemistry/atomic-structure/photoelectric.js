/**
 * Vinit Simulation Hub — Atomic Structure / Photoelectric Effect
 * Rapier2D handles photon-to-metal sensor collisions and electron motion.
 *
 * Teaching model:
 * - Photon energy is calculated from E = hc/lambda.
 * - Emission occurs only when E_gamma > the selected metal work function.
 * - Electron speed follows v = sqrt(2 K_max / m_e).
 * - Light intensity changes photon arrival rate only; it never enters KE.
 * - Canvas particle drawings are a visual layer over the Rapier2D world.
 */

import RAPIER from "@dimforge/rapier2d-compat";
import {
  PLANCK_CONSTANT,
  SPEED_OF_LIGHT,
  ELECTRON_MASS,
  ELEMENTARY_CHARGE
} from "./constants.js";

const METALS = Object.freeze({
  sodium: { name: "Sodium", symbol: "Na", workFunctionEV: 2.28 },
  potassium: { name: "Potassium", symbol: "K", workFunctionEV: 2.30 },
  calcium: { name: "Calcium", symbol: "Ca", workFunctionEV: 2.90 },
  zinc: { name: "Zinc", symbol: "Zn", workFunctionEV: 4.31 },
  copper: { name: "Copper", symbol: "Cu", workFunctionEV: 4.70 },
  silver: { name: "Silver", symbol: "Ag", workFunctionEV: 4.73 },
  platinum: { name: "Platinum", symbol: "Pt", workFunctionEV: 6.35 }
});

const WORLD = Object.freeze({
  width: 12,
  height: 8,
  surfaceY: -2.62,
  metalHalfWidth: 5.55,
  metalThickness: 0.42,
  photonStartY: 3.55,
  photonSpeed: 3.0,
  photonRadius: 0.065,
  electronRadius: 0.075,
  maxPhotons: 65,
  maxElectrons: 100,
  fixedStep: 1 / 60,
  maxSubSteps: 4,
  electronWorldScale: 2.2
});

const ui = {
  canvas: document.getElementById("photoelectric-canvas"),
  intensity: document.getElementById("light-intensity"),
  intensityValue: document.getElementById("intensity-value"),
  photonRate: document.getElementById("photon-rate-label"),
  wavelength: document.getElementById("light-wavelength"),
  wavelengthValue: document.getElementById("wavelength-value"),
  frequency: document.getElementById("frequency-readout"),
  metal: document.getElementById("metal-select"),
  metalName: document.getElementById("metal-name-readout"),
  workFunction: document.getElementById("work-function-readout"),
  showDeBroglie: document.getElementById("show-debroglie"),
  deBroglieCard: document.getElementById("debroglie-card"),
  deBroglieFormula: document.getElementById("debroglie-formula"),
  photonEnergy: document.getElementById("data-photon-energy"),
  kineticEnergy: document.getElementById("data-kinetic-energy"),
  stoppingPotential: document.getElementById("data-stopping-potential"),
  deBroglie: document.getElementById("data-debroglie"),
  electrons: document.getElementById("data-electrons"),
  electronSpeed: document.getElementById("data-electron-speed"),
  emissionState: document.getElementById("emission-state"),
  thresholdExplanation: document.getElementById("threshold-explanation"),
  status: document.getElementById("pe-status")
};

let world = null;
let eventQueue = null;
let metalBody = null;
let metalCollider = null;
let physicsReady = false;
let animationFrameId = 0;
let resizeObserver = null;
let lastFrameTime = 0;
let physicsAccumulator = 0;
let photonSpawnAccumulator = 0;
let emittedElectronCount = 0;
let photonCollisionCount = 0;
let surfaceGlow = 0;
let lastStatsUpdate = 0;
let emissionWindowStart = 0;
let emissionsInWindow = 0;
let emissionRate = 0;
let lastElectronSpeedMps = 0;

const photonParticles = [];
const electronParticles = [];
const photonByCollider = new Map();

const canvasContext = ui.canvas ? ui.canvas.getContext("2d", { alpha: false }) : null;

function assertElementsExist() {
  for (const [name, element] of Object.entries(ui)) {
    if (!element) {
      throw new Error("Photoelectric page is missing required element: " + name);
    }
  }
  if (!canvasContext) {
    throw new Error("A 2D canvas context could not be created on this device.");
  }
}

function getCurrentWavelengthNm() {
  return Number(ui.wavelength.value);
}

function getCurrentIntensity() {
  return Number(ui.intensity.value);
}

function getCurrentMetal() {
  return METALS[ui.metal.value] || METALS.sodium;
}

/** Photon energy in eV from exact SI constants. */
export function photonEnergyEV(wavelengthNm) {
  if (!Number.isFinite(wavelengthNm) || wavelengthNm <= 0) {
    throw new RangeError("Wavelength must be a positive finite number in nm.");
  }
  const wavelengthMetres = wavelengthNm * 1e-9;
  const energyJoules = PLANCK_CONSTANT * SPEED_OF_LIGHT / wavelengthMetres;
  return energyJoules / ELEMENTARY_CHARGE;
}

/** de Broglie wavelength in nm for a non-relativistic electron. */
export function deBroglieWavelengthNm(kineticEnergyEV) {
  if (!Number.isFinite(kineticEnergyEV) || kineticEnergyEV < 0) {
    throw new RangeError("Kinetic energy must be a non-negative finite number in eV.");
  }
  if (kineticEnergyEV === 0) return null;
  const kineticEnergyJoules = kineticEnergyEV * ELEMENTARY_CHARGE;
  const momentum = Math.sqrt(2 * ELECTRON_MASS * kineticEnergyJoules);
  return (PLANCK_CONSTANT / momentum) * 1e9;
}

/** Compute the photoelectric data without using light intensity. */
export function calculatePhotoelectricData(wavelengthNm, workFunctionEV) {
  if (!Number.isFinite(workFunctionEV) || workFunctionEV < 0) {
    throw new RangeError("Work function must be a non-negative finite number in eV.");
  }
  const energy = photonEnergyEV(wavelengthNm);
  const emits = energy > workFunctionEV;
  const kineticEnergy = emits ? energy - workFunctionEV : 0;
  const deBroglie = deBroglieWavelengthNm(kineticEnergy);
  const speedMps = kineticEnergy > 0
    ? Math.sqrt((2 * kineticEnergy * ELEMENTARY_CHARGE) / ELECTRON_MASS)
    : 0;

  return {
    photonEnergyEV: energy,
    workFunctionEV,
    kineticEnergyEV: kineticEnergy,
    stoppingPotentialV: kineticEnergy,
    deBroglieWavelengthNm: deBroglie,
    electronSpeedMps: speedMps,
    emits
  };
}

function formatNumber(value, decimals) {
  return Number.isFinite(value) ? value.toFixed(decimals) : "—";
}

function wavelengthRegion(wavelengthNm) {
  if (wavelengthNm < 280) return "Deep UV";
  if (wavelengthNm < 400) return "UV";
  if (wavelengthNm < 450) return "Violet";
  if (wavelengthNm < 495) return "Blue";
  if (wavelengthNm < 570) return "Green";
  if (wavelengthNm < 590) return "Yellow";
  if (wavelengthNm < 620) return "Orange";
  if (wavelengthNm <= 700) return "Red";
  return "Infrared";
}

/** Low frequency / long wavelength is red; high frequency / UV is violet. */
function photonColor(wavelengthNm) {
  const hue = Math.max(0, Math.min(285, ((800 - wavelengthNm) / 700) * 285));
  return "hsl(" + hue.toFixed(1) + ", 94%, 65%)";
}

function photonRateFromIntensity(intensity) {
  const fraction = (intensity - 1) / 99;
  return 0.35 + fraction * 16;
}

function updateReadouts() {
  const wavelengthNm = getCurrentWavelengthNm();
  const intensity = getCurrentIntensity();
  const metal = getCurrentMetal();
  const data = calculatePhotoelectricData(wavelengthNm, metal.workFunctionEV);
  const frequencyHz = SPEED_OF_LIGHT / (wavelengthNm * 1e-9);
  const rate = photonRateFromIntensity(intensity);

  ui.intensityValue.value = intensity + "%";
  ui.intensityValue.textContent = intensity + "%";
  ui.photonRate.textContent = "Approx. " + rate.toFixed(1) + " photons per second";

  ui.wavelengthValue.value = wavelengthNm + " nm · " + wavelengthRegion(wavelengthNm);
  ui.wavelengthValue.textContent = wavelengthNm + " nm · " + wavelengthRegion(wavelengthNm);
  ui.frequency.textContent = "Frequency: " + (frequencyHz / 1e12).toFixed(1) + " THz";

  ui.metalName.textContent = metal.name;
  ui.workFunction.textContent = "φ = " + metal.workFunctionEV.toFixed(2) + " eV";

  ui.photonEnergy.textContent = data.photonEnergyEV.toFixed(2) + " eV";
  ui.kineticEnergy.textContent = data.emits
    ? data.kineticEnergyEV.toFixed(2) + " eV"
    : "0.00 eV";
  ui.stoppingPotential.textContent = data.emits
    ? data.stoppingPotentialV.toFixed(2) + " V"
    : "0.00 V";

  if (data.emits && data.deBroglieWavelengthNm !== null) {
    ui.deBroglie.textContent = formatNumber(data.deBroglieWavelengthNm, 3) + " nm";
  } else {
    ui.deBroglie.textContent = "No emission";
  }

  ui.deBroglieCard.classList.toggle("is-hidden", !ui.showDeBroglie.checked);
  ui.deBroglieFormula.classList.toggle("is-hidden", !ui.showDeBroglie.checked);

  ui.electrons.textContent = String(emittedElectronCount);
  ui.electronSpeed.textContent = lastElectronSpeedMps > 0
    ? "Last emitted electron: " + (lastElectronSpeedMps / 1e6).toFixed(3) + " × 10⁶ m/s"
    : "Electron speed: —";

  ui.emissionState.textContent = data.emits ? "Emission possible" : "Below threshold";
  ui.emissionState.classList.toggle("emission", data.emits);
  ui.emissionState.classList.toggle("no-emission", !data.emits);

  if (data.emits) {
    ui.thresholdExplanation.textContent =
      "Eγ exceeds φ. Each emitted electron can have up to " +
      data.kineticEnergyEV.toFixed(2) + " eV of kinetic energy.";
  } else {
    const thresholdNm = (PLANCK_CONSTANT * SPEED_OF_LIGHT) /
      (metal.workFunctionEV * ELEMENTARY_CHARGE) * 1e9;
    ui.thresholdExplanation.textContent =
      "No photoelectrons: photon energy is below the " +
      metal.name + " work function. The threshold wavelength is about " +
      thresholdNm.toFixed(0) + " nm; shorter wavelengths can eject electrons.";
  }

  return data;
}

function removePhoton(particle) {
  if (!particle || particle.removed) return;
  particle.removed = true;
  photonByCollider.delete(particle.collider.handle);
  world.removeRigidBody(particle.body);
  const index = photonParticles.indexOf(particle);
  if (index !== -1) photonParticles.splice(index, 1);
}

function removeElectron(particle) {
  if (!particle || particle.removed) return;
  particle.removed = true;
  world.removeRigidBody(particle.body);
  const index = electronParticles.indexOf(particle);
  if (index !== -1) electronParticles.splice(index, 1);
}

function createPhoton() {
  if (!physicsReady || photonParticles.length >= WORLD.maxPhotons) return;

  const halfSpan = WORLD.metalHalfWidth - 0.20;
  const x = (Math.random() * 2 - 1) * halfSpan;
  const wavelengthNm = getCurrentWavelengthNm();
  const metal = getCurrentMetal();
  const energyEV = photonEnergyEV(wavelengthNm);

  const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(x, WORLD.photonStartY)
    .setLinvel(0, -WORLD.photonSpeed)
    .setCcdEnabled(true)
    .setCanSleep(false);

  const body = world.createRigidBody(bodyDesc);
  const colliderDesc = RAPIER.ColliderDesc.ball(WORLD.photonRadius)
    .setSensor(true)
    .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
  const collider = world.createCollider(colliderDesc, body);

  const particle = {
    body,
    collider,
    wavelengthNm,
    energyEV,
    color: photonColor(wavelengthNm),
    age: 0,
    removed: false,
    metalAtLaunch: metal.name
  };

  photonParticles.push(particle);
  photonByCollider.set(collider.handle, particle);
}

function createPhotoelectron(x, y, kineticEnergyEV) {
  if (electronParticles.length >= WORLD.maxElectrons) {
    removeElectron(electronParticles[0]);
  }

  const speedMps = Math.sqrt(
    (2 * kineticEnergyEV * ELEMENTARY_CHARGE) / ELECTRON_MASS
  );
  const speedWorld = (speedMps / 1e6) * WORLD.electronWorldScale;

  // A small angular spread changes direction, not the speed magnitude.
  const angle = (Math.random() - 0.5) * 0.34;
  const velocityX = Math.sin(angle) * speedWorld;
  const velocityY = Math.cos(angle) * speedWorld;

  const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(x, Math.max(y, WORLD.surfaceY + WORLD.electronRadius + 0.02))
    .setLinvel(velocityX, velocityY)
    .setCanSleep(false);

  const body = world.createRigidBody(bodyDesc);
  const colliderDesc = RAPIER.ColliderDesc.ball(WORLD.electronRadius)
    .setSensor(true);
  const collider = world.createCollider(colliderDesc, body);

  electronParticles.push({
    body,
    collider,
    speedMps,
    kineticEnergyEV,
    age: 0,
    removed: false
  });

  emittedElectronCount += 1;
  emissionsInWindow += 1;
  lastElectronSpeedMps = speedMps;
  surfaceGlow = Math.min(1, surfaceGlow + 0.75);
}

function handlePhotonMetalCollision(photonColliderHandle) {
  const photon = photonByCollider.get(photonColliderHandle);
  if (!photon || photon.removed) return;

  const position = photon.body.translation();
  const impactX = position.x;
  const impactY = WORLD.surfaceY + WORLD.electronRadius + 0.025;
  const metal = getCurrentMetal();
  const kineticEnergyEV = photon.energyEV - metal.workFunctionEV;

  photonCollisionCount += 1;
  removePhoton(photon);

  if (kineticEnergyEV <= 0) {
    // Below threshold: photon is absorbed, but no electron is emitted.
    return;
  }

  createPhotoelectron(impactX, impactY, kineticEnergyEV);
}

function processCollisionEvents() {
  eventQueue.drainCollisionEvents((handleA, handleB, started) => {
    if (!started || !metalCollider) return;

    if (handleA === metalCollider.handle) {
      handlePhotonMetalCollision(handleB);
    } else if (handleB === metalCollider.handle) {
      handlePhotonMetalCollision(handleA);
    }
  });
}

function setupPhysicsWorld() {
  world = new RAPIER.World({ x: 0, y: 0 });
  world.timestep = WORLD.fixedStep;
  eventQueue = new RAPIER.EventQueue(true);

  const metalBodyDesc = RAPIER.RigidBodyDesc.fixed()
    .setTranslation(0, WORLD.surfaceY - WORLD.metalThickness / 2);
  metalBody = world.createRigidBody(metalBodyDesc);

  const metalColliderDesc = RAPIER.ColliderDesc
    .cuboid(WORLD.metalHalfWidth, WORLD.metalThickness / 2)
    .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

  metalCollider = world.createCollider(metalColliderDesc, metalBody);
}

function updatePhysics(deltaTime) {
  physicsAccumulator += Math.min(deltaTime, 0.05);

  let steps = 0;
  while (physicsAccumulator >= WORLD.fixedStep && steps < WORLD.maxSubSteps) {
    for (const photon of photonParticles) photon.age += WORLD.fixedStep;
    for (const electron of electronParticles) electron.age += WORLD.fixedStep;

    world.step(eventQueue);
    processCollisionEvents();

    photonParticles.slice().forEach((photon) => {
      if (photon.removed) return;
      const position = photon.body.translation();
      if (
        photon.age > 8 ||
        position.y < WORLD.surfaceY - 0.75 ||
        Math.abs(position.x) > WORLD.width
      ) {
        removePhoton(photon);
      }
    });

    electronParticles.slice().forEach((electron) => {
      if (electron.removed) return;
      const position = electron.body.translation();
      if (
        electron.age > 14 ||
        position.y > WORLD.photonStartY + 1.0 ||
        Math.abs(position.x) > WORLD.width
      ) {
        removeElectron(electron);
      }
    });

    physicsAccumulator -= WORLD.fixedStep;
    steps += 1;
  }

  if (steps === WORLD.maxSubSteps && physicsAccumulator > WORLD.fixedStep * WORLD.maxSubSteps) {
    physicsAccumulator = 0;
  }
}

function updatePhotonSpawning(deltaTime) {
  const rate = photonRateFromIntensity(getCurrentIntensity());
  photonSpawnAccumulator += deltaTime * rate;

  let spawnedThisFrame = 0;
  while (
    photonSpawnAccumulator >= 1 &&
    photonParticles.length < WORLD.maxPhotons &&
    spawnedThisFrame < 3
  ) {
    createPhoton();
    photonSpawnAccumulator -= 1;
    spawnedThisFrame += 1;
  }

  if (photonParticles.length >= WORLD.maxPhotons) {
    photonSpawnAccumulator = Math.min(photonSpawnAccumulator, 1);
  }
}

function canvasPoint(x, y, width, height, scale, offsetX, offsetY) {
  return {
    x: offsetX + (x + WORLD.width / 2) * scale,
    y: offsetY + (WORLD.height / 2 - y) * scale
  };
}

function resizeCanvas() {
  if (!ui.canvas || !canvasContext) return;

  const width = Math.max(1, ui.canvas.clientWidth);
  const height = Math.max(1, ui.canvas.clientHeight);
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);

  const targetWidth = Math.round(width * ratio);
  const targetHeight = Math.round(height * ratio);
  if (ui.canvas.width !== targetWidth || ui.canvas.height !== targetHeight) {
    ui.canvas.width = targetWidth;
    ui.canvas.height = targetHeight;
  }
  canvasContext.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawBackground(ctx, width, height, scale, offsetX, offsetY) {
  ctx.fillStyle = "#090515";
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(
    width * 0.5, height * 0.24, 8,
    width * 0.5, height * 0.24, Math.max(width, height) * 0.75
  );
  glow.addColorStop(0, "rgba(98,231,255,0.075)");
  glow.addColorStop(1, "rgba(10,5,20,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.strokeStyle = "rgba(167,139,250,0.07)";
  ctx.lineWidth = 1;
  const gridSpacing = Math.max(28, scale * 0.75);
  for (let x = offsetX % gridSpacing; x < width; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  ctx.restore();

  const source = canvasPoint(0, WORLD.photonStartY, width, height, scale, offsetX, offsetY);
  ctx.save();
  ctx.fillStyle = "rgba(221,207,255,0.58)";
  ctx.font = "10px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("INCIDENT LIGHT", source.x, Math.max(48, source.y - 27));
  ctx.restore();
}

function drawMetal(ctx, width, height, scale, offsetX, offsetY, time) {
  const leftTop = canvasPoint(
    -WORLD.metalHalfWidth, WORLD.surfaceY,
    width, height, scale, offsetX, offsetY
  );
  const rightBottom = canvasPoint(
    WORLD.metalHalfWidth, WORLD.surfaceY - WORLD.metalThickness,
    width, height, scale, offsetX, offsetY
  );

  const glowAmount = Math.max(0, Math.min(1, surfaceGlow));
  if (glowAmount > 0.015) {
    ctx.save();
    ctx.shadowColor = "rgba(98,231,255," + (0.45 * glowAmount).toFixed(3) + ")";
    ctx.shadowBlur = 22 + glowAmount * 22;
    ctx.fillStyle = "rgba(98,231,255," + (0.10 * glowAmount).toFixed(3) + ")";
    ctx.fillRect(
      leftTop.x, leftTop.y - 7,
      rightBottom.x - leftTop.x, rightBottom.y - leftTop.y + 14
    );
    ctx.restore();
  }

  const gradient = ctx.createLinearGradient(0, leftTop.y, 0, rightBottom.y);
  gradient.addColorStop(0, "#a78bfa");
  gradient.addColorStop(0.10, "#59427f");
  gradient.addColorStop(1, "#211533");

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.fillRect(
    leftTop.x, leftTop.y,
    rightBottom.x - leftTop.x, rightBottom.y - leftTop.y
  );
  ctx.strokeStyle = "rgba(221,207,255,0.42)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(leftTop.x, leftTop.y);
  ctx.lineTo(rightBottom.x, leftTop.y);
  ctx.stroke();

  ctx.fillStyle = "rgba(230,220,255,0.65)";
  ctx.font = "10px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("METAL SURFACE", (leftTop.x + rightBottom.x) / 2, leftTop.y + 21);
  ctx.restore();

  // Very subtle scanline shimmer is decorative only; the physics is in Rapier.
  const shimmer = (Math.sin(time * 1.6) + 1) * 0.5;
  ctx.save();
  ctx.strokeStyle = "rgba(98,231,255," + (0.045 + shimmer * 0.035).toFixed(3) + ")";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftTop.x + 8, leftTop.y + 4);
  ctx.lineTo(rightBottom.x - 8, leftTop.y + 4);
  ctx.stroke();
  ctx.restore();
}

function drawPhoton(ctx, particle, width, height, scale, offsetX, offsetY) {
  if (particle.removed) return;
  const position = particle.body.translation();
  const point = canvasPoint(position.x, position.y, width, height, scale, offsetX, offsetY);
  const radius = Math.max(3.2, scale * WORLD.photonRadius * 0.88);

  ctx.save();
  ctx.shadowColor = particle.color;
  ctx.shadowBlur = 15;
  ctx.strokeStyle = particle.color;
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(point.x, point.y - radius * 3.1);
  ctx.lineTo(point.x, point.y - radius * 1.2);
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.fillStyle = particle.color;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff7dc";
  ctx.beginPath();
  ctx.arc(point.x - radius * 0.22, point.y - radius * 0.22, Math.max(1, radius * 0.32), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawElectron(ctx, particle, width, height, scale, offsetX, offsetY, time) {
  if (particle.removed) return;
  const position = particle.body.translation();
  const point = canvasPoint(position.x, position.y, width, height, scale, offsetX, offsetY);
  const radius = Math.max(3.7, scale * WORLD.electronRadius * 0.88);

  ctx.save();
  ctx.shadowColor = "#62e7ff";
  ctx.shadowBlur = 17;
  ctx.fillStyle = "#62e7ff";
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#e9fdff";
  ctx.beginPath();
  ctx.arc(point.x - radius * 0.2, point.y - radius * 0.2, radius * 0.34, 0, Math.PI * 2);
  ctx.fill();

  if (ui.showDeBroglie.checked) {
    // Schematic wavefront rings only; real electron de Broglie lengths are
    // far below the scale of this illustration.
    const phase = (time * 2.2 + particle.age * 2) % 1;
    ctx.globalAlpha = 0.20;
    ctx.strokeStyle = "#62e7ff";
    ctx.lineWidth = 1;
    for (let ring = 0; ring < 2; ring += 1) {
      const ringRadius = radius * (2.2 + ring * 2.1 + phase);
      ctx.beginPath();
      ctx.arc(point.x, point.y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function renderScene(timestamp) {
  const width = ui.canvas.clientWidth;
  const height = ui.canvas.clientHeight;
  if (width <= 0 || height <= 0) return;

  const ctx = canvasContext;
  ctx.save();
  ctx.setTransform(
    (ui.canvas.width / width), 0, 0,
    (ui.canvas.height / height), 0, 0
  );

  const scale = Math.min(width / WORLD.width, height / WORLD.height);
  const offsetX = (width - WORLD.width * scale) / 2;
  const offsetY = (height - WORLD.height * scale) / 2;

  drawBackground(ctx, width, height, scale, offsetX, offsetY);
  drawMetal(ctx, width, height, scale, offsetX, offsetY, timestamp / 1000);

  photonParticles.forEach((particle) =>
    drawPhoton(ctx, particle, width, height, scale, offsetX, offsetY)
  );
  electronParticles.forEach((particle) =>
    drawElectron(ctx, particle, width, height, scale, offsetX, offsetY, timestamp / 1000)
  );

  ctx.restore();
}

function updateEmissionRate(timestamp) {
  if (!emissionWindowStart) emissionWindowStart = timestamp;
  const elapsed = timestamp - emissionWindowStart;
  if (elapsed >= 1000) {
    emissionRate = emissionsInWindow * 1000 / elapsed;
    emissionsInWindow = 0;
    emissionWindowStart = timestamp;

    if (emissionRate > 0) {
      ui.electronSpeed.textContent =
        "Last emitted electron: " + (lastElectronSpeedMps / 1e6).toFixed(3) +
        " × 10⁶ m/s · " + emissionRate.toFixed(1) + " e⁻/s";
    }
  }

  if (timestamp - lastStatsUpdate > 250) {
    ui.electrons.textContent = String(emittedElectronCount);
    lastStatsUpdate = timestamp;
  }
}

function animate(timestamp) {
  animationFrameId = window.requestAnimationFrame(animate);

  if (!physicsReady) return;
  if (document.hidden) {
    lastFrameTime = timestamp;
    return;
  }

  if (!lastFrameTime) lastFrameTime = timestamp;
  const deltaTime = Math.min((timestamp - lastFrameTime) / 1000, 0.05);
  lastFrameTime = timestamp;

  updatePhotonSpawning(deltaTime);
  updatePhysics(deltaTime);

  surfaceGlow = Math.max(0, surfaceGlow - deltaTime * 0.7);
  updateEmissionRate(timestamp);
  renderScene(timestamp);
}

function bindControls() {
  ui.intensity.addEventListener("input", updateReadouts);
  ui.wavelength.addEventListener("input", () => {
    updateReadouts();
  });
  ui.metal.addEventListener("change", updateReadouts);
  ui.showDeBroglie.addEventListener("change", () => {
    ui.deBroglieCard.classList.toggle("is-hidden", !ui.showDeBroglie.checked);
    ui.deBroglieFormula.classList.toggle("is-hidden", !ui.showDeBroglie.checked);
  });
}

function setupCanvasResize() {
  resizeCanvas();
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(ui.canvas);
  } else {
    window.addEventListener("resize", resizeCanvas, { passive: true });
  }
}

async function initialise() {
  assertElementsExist();
  bindControls();
  updateReadouts();
  setupCanvasResize();

  try {
    ui.status.textContent = "Initialising Rapier2D WebAssembly…";
    await RAPIER.init();

    setupPhysicsWorld();
    physicsReady = true;

    ui.status.textContent =
      "Rapier2D is ready. Photons now strike the metal target; electron emission follows the work-function threshold.";
    lastFrameTime = 0;
    animationFrameId = window.requestAnimationFrame(animate);
    void typesetFormulas();
  } catch (error) {
    console.error("Photoelectric simulation initialisation failed:", error);
    ui.status.textContent =
      "Rapier2D could not initialise. Check the network connection and WebAssembly support, then reload the page.";
  }
}

async function typesetFormulas() {
  if (!window.MathJax || typeof window.MathJax.typesetPromise !== "function") return;
  try {
    if (window.MathJax.startup && window.MathJax.startup.promise) {
      await window.MathJax.startup.promise;
    }
    const formulaNodes = document.querySelectorAll(".pe-formula-line");
    await window.MathJax.typesetPromise(Array.from(formulaNodes));
  } catch (error) {
    console.warn("MathJax formula rendering was unavailable:", error);
  }
}

function disposeSimulation() {
  if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
  if (resizeObserver) resizeObserver.disconnect();
  if (eventQueue && typeof eventQueue.free === "function") eventQueue.free();
  if (world && typeof world.free === "function") world.free();
}

window.addEventListener("pagehide", disposeSimulation, { once: true });

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void initialise();
  }, { once: true });
} else {
  void initialise();
}
