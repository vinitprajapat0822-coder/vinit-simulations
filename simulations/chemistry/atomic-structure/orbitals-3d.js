/**
 * Vinit Simulation Hub — Atomic Structure / 3D Orbitals
 *
 * A mobile-conscious point-cloud renderer for real hydrogenic orbitals.
 * Cartesian forms are used so the angular nodal surfaces emerge naturally:
 *   1s:      exp(-rho)
 *   2s:      (2-rho) exp(-rho/2)
 *   2p_x:    x exp(-rho/2)   (and corresponding y/z forms)
 *   3d_xy:   x*y exp(-rho/3)
 *   3d_z2:   (3*z*z-rho*rho) exp(-rho/3)
 * where x,y,z,rho are measured in Bohr radii.
 */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const CHEMISTRY = Object.freeze({
  background: 0x0a0514,
  positive: 0xa78bfa,
  negative: 0x62e7ff,
  node: 0xd9c7ff,
  green: 0x7df0bd
});

const WORLD_SCALE = 0.28;
const GRID_STEPS = 34;
const POINT_THRESHOLD = 0.095;
const MAX_DEVICE_PIXEL_RATIO = 1.5;

const ORBITALS = Object.freeze({
  "1s": {
    label: "1s",
    shape: "Spherical cloud",
    n: 1,
    l: 0,
    m: "0",
    subshell: "s",
    extent: 4.2,
    radialNodes: [],
    angularType: "none",
    description: "Spherical electron cloud. The 1s state has no radial or angular nodes.",
    wavefunction: (x, y, z, rho) => Math.exp(-rho)
  },
  "2s": {
    label: "2s",
    shape: "Spherical cloud with two phases",
    n: 2,
    l: 0,
    m: "0",
    subshell: "s",
    extent: 8.0,
    radialNodes: [2],
    angularType: "none",
    description: "Spherical 2s cloud. One radial node at r = 2a₀ separates the inner positive region from the outer negative region.",
    wavefunction: (x, y, z, rho) => (2 - rho) * Math.exp(-rho / 2)
  },
  "2p_x": {
    label: "2pₓ",
    shape: "X-axis dumbbell",
    n: 2,
    l: 1,
    m: "±1 (real)",
    subshell: "p",
    extent: 7.0,
    radialNodes: [],
    angularType: "plane-yz",
    description: "Two p lobes lie along the x-axis. The yz-plane (x = 0) is the angular nodal plane. This real orbital is a combination of m = +1 and m = −1 states.",
    wavefunction: (x, y, z, rho) => x * Math.exp(-rho / 2)
  },
  "2p_y": {
    label: "2pᵧ",
    shape: "Y-axis dumbbell",
    n: 2,
    l: 1,
    m: "±1 (real)",
    subshell: "p",
    extent: 7.0,
    radialNodes: [],
    angularType: "plane-xz",
    description: "Two p lobes lie along the y-axis. The xz-plane (y = 0) is the angular nodal plane. This real orbital is a combination of m = +1 and m = −1 states.",
    wavefunction: (x, y, z, rho) => y * Math.exp(-rho / 2)
  },
  "2p_z": {
    label: "2p_z",
    shape: "Z-axis dumbbell",
    n: 2,
    l: 1,
    m: "0",
    subshell: "p",
    extent: 7.0,
    radialNodes: [],
    angularType: "plane-xy",
    description: "Two p lobes lie along the z-axis. The xy-plane (z = 0) is the angular nodal plane.",
    wavefunction: (x, y, z, rho) => z * Math.exp(-rho / 2)
  },
  "3d_xy": {
    label: "3dₓᵧ",
    shape: "Four-leaf clover",
    n: 3,
    l: 2,
    m: "±2 (real)",
    subshell: "d",
    extent: 9.5,
    radialNodes: [],
    angularType: "planes-xy",
    description: "Four lobes lie between the x- and y-axes in the xy-plane. Both x = 0 and y = 0 planes are angular nodes. This real orbital is a combination of m = +2 and m = −2 states.",
    wavefunction: (x, y, z, rho) => x * y * Math.exp(-rho / 3)
  },
  "3d_z2": {
    label: "3d_z²",
    shape: "Two lobes and an equatorial torus",
    n: 3,
    l: 2,
    m: "0",
    subshell: "d",
    extent: 9.5,
    radialNodes: [],
    angularType: "double-cone",
    description: "Two positive lobes align with the z-axis and a negative toroidal region wraps around the equator. Its angular nodes are two cones (not planes), at cos²θ = 1/3.",
    wavefunction: (x, y, z, rho) => (3 * z * z - rho * rho) * Math.exp(-rho / 3)
  }
});

const ui = {
  stage: document.getElementById("orbital-stage"),
  canvas: document.getElementById("orbital-canvas"),
  select: document.getElementById("orbital-3d-select"),
  radialToggle: document.getElementById("show-radial-nodes"),
  angularToggle: document.getElementById("show-angular-nodes"),
  reset: document.getElementById("reset-view"),
  status: document.getElementById("render-status"),
  orbitalName: document.getElementById("stage-orbital-name"),
  quantumN: document.getElementById("quantum-n"),
  quantumL: document.getElementById("quantum-l"),
  quantumM: document.getElementById("quantum-m"),
  quantumMeta: document.getElementById("quantum-meta"),
  description: document.getElementById("orbital-description")
};

let scene = null;
let camera = null;
let renderer = null;
let controls = null;
let orbitalGroup = null;
let nodeGroup = null;
let activeKey = "1s";
let resizeObserver = null;
let animationStarted = false;

const initialCameraPosition = new THREE.Vector3(6.4, 5.4, 7.6);
const initialTarget = new THREE.Vector3(0, 0, 0);

function requireUI() {
  for (const key of Object.keys(ui)) {
    if (!ui[key]) {
      throw new Error("Missing required 3D orbital page element: " + key);
    }
  }
}

function setStatus(message) {
  ui.status.textContent = message;
}

function disposeGroupContents(group) {
  while (group.children.length > 0) {
    const child = group.children[group.children.length - 1];
    group.remove(child);
    child.traverse((object) => {
      if (object.geometry && typeof object.geometry.dispose === "function") {
        object.geometry.dispose();
      }
      if (object.material) {
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((material) => {
          if (material && typeof material.dispose === "function") {
            material.dispose();
          }
        });
      }
    });
  }
}

function evaluateWavefunction(orbital, x, y, z) {
  const rho = Math.sqrt(x * x + y * y + z * z);
  return orbital.wavefunction(x, y, z, rho);
}

function createOrbitalPointCloud(orbital) {
  const extent = orbital.extent;
  const step = (2 * extent) / (GRID_STEPS - 1);
  let maxAmplitude = 0;

  // First pass: estimate the sampled maximum for relative point filtering.
  for (let ix = 0; ix < GRID_STEPS; ix += 1) {
    const x = -extent + ix * step;
    for (let iy = 0; iy < GRID_STEPS; iy += 1) {
      const y = -extent + iy * step;
      for (let iz = 0; iz < GRID_STEPS; iz += 1) {
        const z = -extent + iz * step;
        const rho = Math.sqrt(x * x + y * y + z * z);
        if (rho > extent) continue;
        const value = orbital.wavefunction(x, y, z, rho);
        maxAmplitude = Math.max(maxAmplitude, Math.abs(value));
      }
    }
  }

  if (!Number.isFinite(maxAmplitude) || maxAmplitude <= 0) {
    throw new Error("Unable to evaluate the selected orbital wavefunction.");
  }

  const cutoff = maxAmplitude * POINT_THRESHOLD;
  const positions = [];
  const colors = [];
  const positiveColor = new THREE.Color(CHEMISTRY.positive);
  const negativeColor = new THREE.Color(CHEMISTRY.negative);

  // Second pass: retain samples above the isovalue and color by wavefunction phase.
  for (let ix = 0; ix < GRID_STEPS; ix += 1) {
    const x = -extent + ix * step;
    for (let iy = 0; iy < GRID_STEPS; iy += 1) {
      const y = -extent + iy * step;
      for (let iz = 0; iz < GRID_STEPS; iz += 1) {
        const z = -extent + iz * step;
        const rho = Math.sqrt(x * x + y * y + z * z);
        if (rho > extent) continue;

        const value = orbital.wavefunction(x, y, z, rho);
        if (Math.abs(value) < cutoff) continue;

        positions.push(
          x * WORLD_SCALE,
          y * WORLD_SCALE,
          z * WORLD_SCALE
        );

        const color = value >= 0 ? positiveColor : negativeColor;
        colors.push(color.r, color.g, color.b);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colors, 3)
  );
  geometry.computeBoundingSphere();

  const material = new THREE.PointsMaterial({
    size: 0.052,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.83,
    depthWrite: false
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = true;
  return { points, pointCount: positions.length / 3 };
}

function createNucleus() {
  const geometry = new THREE.SphereGeometry(0.075, 12, 8);
  const material = new THREE.MeshBasicMaterial({
    color: CHEMISTRY.green,
    transparent: true,
    opacity: 0.95
  });
  const nucleus = new THREE.Mesh(geometry, material);
  nucleus.renderOrder = 3;
  return nucleus;
}

function addOrbitalGeometry(orbital) {
  disposeGroupContents(orbitalGroup);
  const cloud = createOrbitalPointCloud(orbital);
  orbitalGroup.add(cloud.points);
  orbitalGroup.add(createNucleus());
  return cloud.pointCount;
}

function makeNodeMaterial(color, opacity, side) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: side || THREE.DoubleSide,
    depthWrite: false,
    wireframe: false
  });
}

function addRadialNodeShells(orbital) {
  orbital.radialNodes.forEach((radius) => {
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(radius * WORLD_SCALE, 24, 16),
      makeNodeMaterial(CHEMISTRY.green, 0.24)
    );
    shell.renderOrder = 2;
    nodeGroup.add(shell);
  });
}

function addNodalPlane(rotationAxis) {
  const size = 2 * ORBITALS[activeKey].extent * WORLD_SCALE * 1.05;
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    makeNodeMaterial(CHEMISTRY.node, 0.16)
  );

  if (rotationAxis === "x") {
    plane.rotation.y = Math.PI / 2;
  } else if (rotationAxis === "y") {
    plane.rotation.x = Math.PI / 2;
  }
  plane.renderOrder = 1;
  nodeGroup.add(plane);
}

function addDoubleNodalCone() {
  // d_z² has two angular nodes at theta = arccos(1/sqrt(3)).
  // The nodal surfaces are cones, not planes.
  const height = 1.68;
  const radius = height * Math.SQRT2;
  const coneGeometry = new THREE.ConeGeometry(radius, height, 32, 1, true);
  const positiveZ = new THREE.Vector3(0, 0, 1);
  const negativeZ = new THREE.Vector3(0, 0, -1);
  const up = new THREE.Vector3(0, 1, 0);

  const top = new THREE.Mesh(
    coneGeometry,
    makeNodeMaterial(CHEMISTRY.node, 0.19)
  );
  top.quaternion.setFromUnitVectors(up, negativeZ);
  top.position.z = height / 2;
  top.renderOrder = 1;
  nodeGroup.add(top);

  const bottom = new THREE.Mesh(
    coneGeometry.clone(),
    makeNodeMaterial(CHEMISTRY.node, 0.19)
  );
  bottom.quaternion.setFromUnitVectors(up, positiveZ);
  bottom.position.z = -height / 2;
  bottom.renderOrder = 1;
  nodeGroup.add(bottom);
}

function updateNodeGeometry(orbital) {
  disposeGroupContents(nodeGroup);

  if (ui.radialToggle.checked) {
    addRadialNodeShells(orbital);
  }

  if (!ui.angularToggle.checked) return;

  if (orbital.angularType === "plane-yz") {
    addNodalPlane("x");
  } else if (orbital.angularType === "plane-xz") {
    addNodalPlane("y");
  } else if (orbital.angularType === "plane-xy") {
    addNodalPlane("z");
  } else if (orbital.angularType === "planes-xy") {
    addNodalPlane("x");
    addNodalPlane("y");
  } else if (orbital.angularType === "double-cone") {
    addDoubleNodalCone();
  }
}

function updateQuantumNumbers(orbital) {
  ui.quantumN.textContent = String(orbital.n);
  ui.quantumL.textContent = String(orbital.l);
  ui.quantumM.textContent = orbital.m;
  ui.quantumMeta.textContent =
    orbital.label + " orbital · " + orbital.subshell +
    " subshell · " + orbital.radialNodes.length + " radial node(s).";
  ui.description.textContent = orbital.description;
  ui.orbitalName.textContent = orbital.label + " · " + orbital.shape;
}

function updateOrbital(key) {
  const orbital = ORBITALS[key];
  if (!orbital) {
    throw new RangeError("Unsupported orbital: " + key);
  }

  activeKey = key;
  const count = addOrbitalGeometry(orbital);
  updateNodeGeometry(orbital);
  updateQuantumNumbers(orbital);

  setStatus(
    "Rendered " + count.toLocaleString() +
    " orbital points. Drag to rotate; use pinch or wheel to zoom."
  );
}

function resetCamera() {
  camera.position.copy(initialCameraPosition);
  controls.target.copy(initialTarget);
  controls.update();
}

function resizeRenderer() {
  if (!renderer || !camera || !ui.stage) return;
  const width = Math.max(1, ui.stage.clientWidth);
  const height = Math.max(1, ui.stage.clientHeight);
  const pixelRatio = Math.min(
    window.devicePixelRatio || 1,
    MAX_DEVICE_PIXEL_RATIO
  );

  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(CHEMISTRY.background);

  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.copy(initialCameraPosition);

  renderer = new THREE.WebGLRenderer({
    canvas: ui.canvas,
    antialias: false,
    alpha: false,
    powerPreference: "low-power"
  });
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO)
  );
  renderer.setClearColor(CHEMISTRY.background, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene.add(new THREE.AmbientLight(0xffffff, 1.55));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
  keyLight.position.set(5, 7, 8);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(CHEMISTRY.negative, 0.45);
  fillLight.position.set(-6, -3, -5);
  scene.add(fillLight);

  orbitalGroup = new THREE.Group();
  nodeGroup = new THREE.Group();
  scene.add(orbitalGroup);
  scene.add(nodeGroup);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = false;
  controls.rotateSpeed = 0.62;
  controls.zoomSpeed = 0.8;
  controls.minDistance = 3.1;
  controls.maxDistance = 17;
  controls.target.copy(initialTarget);
  controls.update();

  resizeRenderer();

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(resizeRenderer);
    resizeObserver.observe(ui.stage);
  } else {
    window.addEventListener("resize", resizeRenderer, { passive: true });
  }

  if (!animationStarted) {
    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });
    animationStarted = true;
  }
}

function bindControls() {
  ui.select.addEventListener("change", (event) => {
    try {
      updateOrbital(event.currentTarget.value);
    } catch (error) {
      console.error("Unable to update orbital:", error);
      setStatus("The selected orbital could not be generated. Check the console for details.");
    }
  });

  ui.radialToggle.addEventListener("change", () => {
    updateNodeGeometry(ORBITALS[activeKey]);
  });

  ui.angularToggle.addEventListener("change", () => {
    updateNodeGeometry(ORBITALS[activeKey]);
  });

  ui.reset.addEventListener("click", resetCamera);
}

function showWebGLError(error) {
  console.error("3D orbital viewer initialisation failed:", error);
  setStatus(
    "3D graphics could not start on this device or browser. Try a browser with WebGL enabled."
  );
}

function init() {
  requireUI();
  try {
    initScene();
    bindControls();
    updateOrbital(ui.select.value || "1s");
  } catch (error) {
    showWebGLError(error);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
