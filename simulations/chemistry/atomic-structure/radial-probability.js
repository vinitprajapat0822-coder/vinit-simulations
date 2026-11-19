/**
 * Vinit Simulation Hub — Atomic Structure / Radial Probability Curves
 * Hydrogenic radial functions (normalization constants omitted).
 *
 * The x-axis is rho = r / a0. R, R^2 and 4*pi*rho^2*R^2 are each
 * independently peak-scaled for visual comparison; this does not alter
 * their zeros or the locations of the radial probability peaks.
 */

import { BOHR_RADIUS } from "./constants.js";

const MAX_RADIUS_A0 = 20;
const SAMPLE_INTERVALS = 800;
const ORBITALS = {
  "1s": {
    n: 1,
    l: 0,
    label: "1s",
    notation: "R_{10}(r)",
    formula: String.raw`\[R_{10}(r) \propto e^{-r/a_0}\]`,
    radial: (rho) => Math.exp(-rho),
    nodes: []
  },
  "2s": {
    n: 2,
    l: 0,
    label: "2s",
    notation: "R_{20}(r)",
    formula: String.raw`\[R_{20}(r) \propto \left(2-\frac{r}{a_0}\right)e^{-r/(2a_0)}\]`,
    radial: (rho) => (2 - rho) * Math.exp(-rho / 2),
    nodes: [2]
  },
  "2p": {
    n: 2,
    l: 1,
    label: "2p",
    notation: "R_{21}(r)",
    formula: String.raw`\[R_{21}(r) \propto \left(\frac{r}{a_0}\right)e^{-r/(2a_0)}\]`,
    radial: (rho) => rho * Math.exp(-rho / 2),
    // R(0) = 0 here is the origin, not a radial node.
    nodes: []
  },
  "3s": {
    n: 3,
    l: 0,
    label: "3s",
    notation: "R_{30}(r)",
    formula: String.raw`\[R_{30}(r) \propto \left[27-18\left(\frac{r}{a_0}\right)+2\left(\frac{r}{a_0}\right)^2\right]e^{-r/(3a_0)}\]`,
    radial: (rho) => (27 - 18 * rho + 2 * rho * rho) * Math.exp(-rho / 3),
    nodes: [4.5 - 1.5 * Math.sqrt(3), 4.5 + 1.5 * Math.sqrt(3)]
  },
  "3p": {
    n: 3,
    l: 1,
    label: "3p",
    notation: "R_{31}(r)",
    formula: String.raw`\[R_{31}(r) \propto \left(\frac{r}{a_0}\right)\left(6-\frac{r}{a_0}\right)e^{-r/(3a_0)}\]`,
    radial: (rho) => rho * (6 - rho) * Math.exp(-rho / 3),
    nodes: [6]
  },
  "3d": {
    n: 3,
    l: 2,
    label: "3d",
    notation: "R_{32}(r)",
    formula: String.raw`\[R_{32}(r) \propto \left(\frac{r}{a_0}\right)^2e^{-r/(3a_0)}\]`,
    radial: (rho) => rho * rho * Math.exp(-rho / 3),
    nodes: []
  }
};

const elements = {
  orbitalSelect: document.getElementById("orbital-select"),
  showR: document.getElementById("show-r"),
  showR2: document.getElementById("show-r2"),
  showP: document.getElementById("show-p"),
  nodeSummary: document.getElementById("node-summary"),
  chartTitle: document.getElementById("chart-title"),
  formulaName: document.getElementById("formula-orbital-name"),
  formula: document.getElementById("orbital-formula"),
  liveStatus: document.getElementById("live-status"),
  canvas: document.getElementById("radial-chart")
};

let radialChart = null;
let selectedOrbital = "1s";

function assertElementsExist() {
  for (const [name, element] of Object.entries(elements)) {
    if (!element) {
      throw new Error(`Radial Probability page is missing required element: ${name}`);
    }
  }
}

function radiusInBohrUnits(sampleIndex) {
  const fraction = sampleIndex / SAMPLE_INTERVALS;
  const radiusMetres = fraction * MAX_RADIUS_A0 * BOHR_RADIUS;
  return radiusMetres / BOHR_RADIUS;
}

function makeRadiusSamples() {
  return Array.from({ length: SAMPLE_INTERVALS + 1 }, (_, index) => ({
    x: radiusInBohrUnits(index)
  }));
}

function evaluateOrbital(orbital, radii) {
  const radial = radii.map(({ x }) => orbital.radial(x));
  const squared = radial.map((value) => value * value);
  // rho^2 is used instead of r^2; the common a0^2 factor is absorbed
  // by independent peak scaling and does not change the curve shape.
  const shellProbability = radial.map((value, index) =>
    4 * Math.PI * radii[index].x * radii[index].x * value * value
  );

  return {
    radial: normaliseByPeak(radial, true),
    squared: normaliseByPeak(squared, false),
    shellProbability: normaliseByPeak(shellProbability, false)
  };
}

function normaliseByPeak(values, preserveSign) {
  const peak = values.reduce((largest, value) =>
    Math.max(largest, preserveSign ? Math.abs(value) : value), 0
  );

  if (peak === 0 || !Number.isFinite(peak)) {
    return values.map(() => 0);
  }

  return values.map((value) => value / peak);
}

const radialNodePlugin = {
  id: "radialNodeMarkers",
  afterDatasetsDraw(chart) {
    const orbital = ORBITALS[selectedOrbital];
    if (!orbital || orbital.nodes.length === 0) return;

    const xScale = chart.scales.x;
    const area = chart.chartArea;
    if (!xScale || !area) return;

    const { ctx } = chart;
    ctx.save();
    ctx.lineWidth = 1.4;
    ctx.font = "11px system-ui, sans-serif";
    ctx.textBaseline = "top";

    orbital.nodes.forEach((node, index) => {
      const pixelX = xScale.getPixelForValue(node);
      if (pixelX < area.left || pixelX > area.right) return;

      ctx.beginPath();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = "#f0b5ff";
      ctx.moveTo(pixelX, area.top + 2);
      ctx.lineTo(pixelX, area.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      const label = `Node ${index + 1} · ${node.toFixed(2)} a₀`;
      const labelWidth = ctx.measureText(label).width;
      const labelX = Math.min(
        Math.max(pixelX - labelWidth / 2, area.left + 4),
        area.right - labelWidth - 4
      );
      const labelY = area.top + 7 + index * 19;

      ctx.fillStyle = "rgba(29, 15, 45, 0.92)";
      ctx.fillRect(labelX - 5, labelY - 3, labelWidth + 10, 18);
      ctx.fillStyle = "#f0d9ff";
      ctx.fillText(label, labelX, labelY);
    });

    ctx.restore();
  }
};

function createDatasets() {
  return [
    {
      label: "R(r) · Radial wavefunction",
      data: [],
      borderColor: "#a78bfa",
      backgroundColor: "rgba(167, 139, 250, 0.10)",
      borderWidth: 2.5,
      pointRadius: 0,
      pointHitRadius: 8,
      tension: 0.16,
      fill: false,
      hidden: !elements.showR.checked
    },
    {
      label: "R²(r) · Squared amplitude",
      data: [],
      borderColor: "#62e7ff",
      backgroundColor: "rgba(98, 231, 255, 0.08)",
      borderWidth: 2.3,
      pointRadius: 0,
      pointHitRadius: 8,
      tension: 0.16,
      fill: false,
      hidden: !elements.showR2.checked
    },
    {
      label: "4πr²R² · Radial distribution",
      data: [],
      borderColor: "#7df0bd",
      backgroundColor: "rgba(125, 240, 189, 0.08)",
      borderWidth: 2.5,
      pointRadius: 0,
      pointHitRadius: 8,
      tension: 0.16,
      fill: false,
      hidden: !elements.showP.checked
    }
  ];
}

function createChart() {
  if (typeof window.Chart === "undefined") {
    elements.liveStatus.textContent =
      "Chart.js could not be loaded. Check your internet connection and reload this page.";
    throw new Error("Chart.js is unavailable.");
  }

  const context = elements.canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create a 2D chart context.");
  }

  window.Chart.defaults.color = "#c9bfdc";
  window.Chart.defaults.font.family =
    'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

  window.Chart.register(radialNodePlugin);

  radialChart = new window.Chart(context, {
    type: "line",
    data: {
      datasets: createDatasets()
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 320,
        easing: "easeOutQuart"
      },
      interaction: {
        mode: "nearest",
        intersect: false
      },
      elements: {
        line: { capBezierPoints: true }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: "rgba(18, 10, 32, 0.96)",
          borderColor: "rgba(167, 139, 250, 0.35)",
          borderWidth: 1,
          titleColor: "#f5f1ff",
          bodyColor: "#d9d0eb",
          padding: 11,
          displayColors: true,
          callbacks: {
            title(items) {
              if (!items.length) return "";
              return `r = ${Number(items[0].parsed.x).toFixed(2)} a₀`;
            },
            label(item) {
              return ` ${item.dataset.label}: ${Number(item.parsed.y).toFixed(3)} (scaled)`;
            }
          }
        }
      },
      scales: {
        x: {
          type: "linear",
          min: 0,
          max: MAX_RADIUS_A0,
          title: {
            display: true,
            text: "Radial distance, r / a₀",
            color: "#cfc4e2",
            padding: { top: 9 }
          },
          grid: {
            color: "rgba(221, 207, 255, 0.075)"
          },
          border: {
            color: "rgba(221, 207, 255, 0.20)"
          },
          ticks: {
            color: "#a99fbd",
            maxTicksLimit: 9
          }
        },
        y: {
          min: 0,
          max: 1.1,
          title: {
            display: true,
            text: "Independently scaled amplitude",
            color: "#cfc4e2",
            padding: { bottom: 8 }
          },
          grid: {
            color: "rgba(221, 207, 255, 0.075)"
          },
          border: {
            color: "rgba(221, 207, 255, 0.20)"
          },
          ticks: {
            color: "#a99fbd",
            maxTicksLimit: 6,
            callback(value) {
              return Number(value).toFixed(1);
            }
          }
        }
      }
    }
  });

  return radialChart;
}

function updateYAxisRange(orbital) {
  const hasNegativeRadialLobes = ["2s", "3s", "3p"].includes(orbital.label);
  radialChart.options.scales.y.min = hasNegativeRadialLobes ? -1.1 : 0;
  radialChart.options.scales.y.max = 1.1;
}

async function typesetFormula() {
  if (!window.MathJax || typeof window.MathJax.typesetPromise !== "function") {
    elements.liveStatus.textContent =
      "MathJax is unavailable; the selected orbital equation is still shown as TeX.";
    return;
  }

  try {
    if (window.MathJax.startup && window.MathJax.startup.promise) {
      await window.MathJax.startup.promise;
    }
    await window.MathJax.typesetPromise([elements.formula]);
  } catch (error) {
    console.error("MathJax typesetting failed:", error);
    elements.liveStatus.textContent =
      "Formula rendering failed. Reload the page to retry MathJax.";
  }
}

function renderNodeSummary(orbital) {
  if (orbital.nodes.length === 0) {
    elements.nodeSummary.innerHTML =
      "<strong>Radial nodes:</strong> 0 · No radial node for this orbital.";
    return;
  }

  const positions = orbital.nodes
    .map((node) => `${node.toFixed(2)} a₀`)
    .join(", ");

  elements.nodeSummary.innerHTML =
    `<strong>Radial nodes:</strong> ${orbital.nodes.length} · ${positions}`;
}

function updateOrbital(orbitalKey) {
  const orbital = ORBITALS[orbitalKey];
  if (!orbital) {
    throw new RangeError(`Unsupported orbital: ${orbitalKey}`);
  }

  selectedOrbital = orbitalKey;

  const radii = makeRadiusSamples();
  const curves = evaluateOrbital(orbital, radii);

  if (!radialChart) {
    createChart();
  }

  radialChart.data.datasets[0].data = radii.map((point, index) => ({
    x: point.x,
    y: curves.radial[index]
  }));
  radialChart.data.datasets[1].data = radii.map((point, index) => ({
    x: point.x,
    y: curves.squared[index]
  }));
  radialChart.data.datasets[2].data = radii.map((point, index) => ({
    x: point.x,
    y: curves.shellProbability[index]
  }));

  radialChart.data.datasets[0].hidden = !elements.showR.checked;
  radialChart.data.datasets[1].hidden = !elements.showR2.checked;
  radialChart.data.datasets[2].hidden = !elements.showP.checked;

  updateYAxisRange(orbital);
  radialChart.update();

  elements.chartTitle.textContent = `${orbital.label} orbital · Radial curves`;
  elements.formulaName.textContent =
    `${orbital.label} orbital · ${orbital.notation}`;

  if (window.MathJax && typeof window.MathJax.typesetClear === "function") {
    window.MathJax.typesetClear([elements.formula]);
  }
  elements.formula.innerHTML = orbital.formula;

  renderNodeSummary(orbital);
  elements.liveStatus.textContent =
    `Showing ${orbital.label}: ${SAMPLE_INTERVALS + 1} calculated radial samples from 0 to ${MAX_RADIUS_A0} a₀.`;

  void typesetFormula();
}

function updateVisibleCurves() {
  if (!radialChart) return;

  radialChart.data.datasets[0].hidden = !elements.showR.checked;
  radialChart.data.datasets[1].hidden = !elements.showR2.checked;
  radialChart.data.datasets[2].hidden = !elements.showP.checked;
  radialChart.update();
}

function bindControls() {
  elements.orbitalSelect.addEventListener("change", (event) => {
    updateOrbital(event.currentTarget.value);
  });

  [elements.showR, elements.showR2, elements.showP].forEach((checkbox) => {
    checkbox.addEventListener("change", updateVisibleCurves);
  });
}

function init() {
  assertElementsExist();
  bindControls();
  updateOrbital(elements.orbitalSelect.value || "1s");
}

try {
  init();
} catch (error) {
  console.error("Radial Probability initialisation failed:", error);
  elements.liveStatus.textContent =
    error instanceof Error ? error.message : "The simulation could not be initialised.";
}
