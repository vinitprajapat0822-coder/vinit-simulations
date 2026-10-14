/* Vinit Simulation Hub — Projectile Physics Core
 * Ideal projectile motion; no air resistance.
 */
(function (root) {
  'use strict';

  function validate(p) {
    for (const k of ['u', 'theta', 'h', 'g']) {
      if (!Number.isFinite(p[k])) {
        throw new TypeError(`Invalid parameter: ${k}`);
      }
    }
    if (p.u < 0 || p.h < 0 || p.g <= 0) {
      throw new RangeError('Require u >= 0, h >= 0, g > 0');
    }
  }

  function calculate(p) {
    validate(p);

    const ux = p.u * Math.cos(p.theta);
    const uy = p.u * Math.sin(p.theta);
    const discriminant = uy * uy + 2 * p.g * p.h;
    const flightTime = (uy + Math.sqrt(discriminant)) / p.g;
    const range = ux * flightTime;
    const timeToPeak = uy > 0 ? uy / p.g : 0;
    const maxHeight = p.h + (uy > 0 ? uy * uy / (2 * p.g) : 0);

    return {
      ux, uy, flightTime, range, timeToPeak, maxHeight
    };
  }

  function positionAt(p, t) {
    validate(p);
    if (!Number.isFinite(t) || t < 0) {
      throw new RangeError('Time must be finite and >= 0');
    }
    return {
      x: p.u * Math.cos(p.theta) * t,
      y: p.h + p.u * Math.sin(p.theta) * t - 0.5 * p.g * t * t
    };
  }

  function velocityAt(p, t) {
    validate(p);
    if (!Number.isFinite(t) || t < 0) {
      throw new RangeError('Time must be finite and >= 0');
    }
    const vx = p.u * Math.cos(p.theta);
    const vy = p.u * Math.sin(p.theta) - p.g * t;
    return { vx, vy, speed: Math.hypot(vx, vy), ax: 0, ay: -p.g };
  }

  function minimumSpeedToTarget(x, y, g) {
    if (![x, y, g].every(Number.isFinite) || x <= 0 || g <= 0) {
      throw new RangeError('Require finite x > 0 and g > 0');
    }
    const r = Math.hypot(x, y);
    return {
      speed: Math.sqrt(g * (y + r)),
      angle: Math.atan2(y + r, x),
      distance: r
    };
  }

  function launchAnglesToTarget(x, y, u, g) {
    if (![x, y, u, g].every(Number.isFinite) ||
        x <= 0 || u <= 0 || g <= 0) {
      throw new RangeError('Require finite x > 0, u > 0, g > 0');
    }

    const A = g * x * x / (2 * u * u);
    const disc = x * x - 4 * A * (A + y);
    const tolerance = 1e-12 * Math.max(1, x * x);

    if (disc < -tolerance) return [];
    const root = Math.sqrt(Math.max(0, disc));
    const candidates = [(x - root) / (2 * A), (x + root) / (2 * A)];

    return [...new Set(candidates
      .filter(Number.isFinite)
      .filter(tan => tan >= 0)
      .map(tan => Math.atan(tan))
      .filter(theta => theta >= 0 && theta <= Math.PI / 2)
      .map(theta => Number(theta.toFixed(12))))]
      .sort((a, b) => a - b);
  }

  function checkTarget(p, x, y, tolerance = 0.001) {
    validate(p);
    if (![x, y, tolerance].every(Number.isFinite) || tolerance < 0) {
      throw new RangeError('Invalid target or tolerance');
    }

    const c = calculate(p);
    if (c.ux <= 1e-12) {
      return {
        hit: Math.abs(x) <= tolerance &&
             Math.abs(p.h - y) <= tolerance,
        error: Math.hypot(x, p.h - y),
        time: 0
      };
    }

    const t = x / c.ux;
    if (t < 0 || t > c.flightTime + tolerance) {
      return { hit: false, error: Infinity, time: t };
    }

    const pos = positionAt(p, t);
    const error = Math.hypot(pos.x - x, pos.y - y);
    return { hit: error <= tolerance, error, time: t };
  }

  const api = {
    calculate, positionAt, velocityAt,
    minimumSpeedToTarget, launchAnglesToTarget, checkTarget
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.ProjectilePhysics = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
