/* Vinit Simulation Hub — simple pendulum physics model. */
(function (root) {
  "use strict";

  const PendulumPhysics = {
    calculate(parameters) {
      if (!parameters || typeof parameters !== "object") {
        throw new TypeError("Pendulum parameters must be an object.");
      }

      const L = parameters.L;
      const theta0 = parameters.theta0;
      const g = parameters.g;

      if (![L, theta0, g].every(Number.isFinite)) {
        throw new TypeError("Pendulum parameters must be finite numbers.");
      }
      if (L <= 0 || g <= 0 || theta0 < 0) {
        throw new RangeError("Require L > 0, g > 0 and theta0 >= 0.");
      }

      // Preserve the original small-angle SHM calculation.
      const w = Math.sqrt(g / L);

      return {
        L: L,
        theta0: theta0,
        g: g,
        w: w,
        T: 2 * Math.PI / w
      };
    },

    angleAt(state, time) {
      if (!state || !Number.isFinite(time) || time < 0) {
        throw new RangeError("A valid pendulum state and time >= 0 are required.");
      }

      // Same amplitude and angular-displacement equation as the original lab.
      return state.theta0 * Math.cos(state.w * time);
    }
  };

  root.PendulumPhysics = PendulumPhysics;
})(typeof window !== "undefined" ? window : globalThis);
