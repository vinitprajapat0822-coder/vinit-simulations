'use strict';
const assert = require('node:assert/strict');
const P = require('../physics-core.js');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log('PASS:', name);
    passed++;
  } catch (e) {
    console.error('FAIL:', name, '-', e.message);
    process.exitCode = 1;
  }
}
function near(actual, expected, tol = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= tol,
    `expected ${expected}, got ${actual}`);
}

test('same-level 20 m/s at 45 degrees', () => {
  const c = P.calculate({u:20, theta:Math.PI/4, h:0, g:10});
  near(c.flightTime, 2*Math.sqrt(2), 1e-6);
  near(c.range, 40, 1e-6);
  near(c.maxHeight, 10, 1e-6);
});

test('horizontal launch from height', () => {
  const c = P.calculate({u:10, theta:0, h:20, g:10});
  near(c.flightTime, 2, 1e-6);
  near(c.range, 20, 1e-6);
});

test('vertical launch has zero horizontal range', () => {
  const c = P.calculate({u:20, theta:Math.PI/2, h:0, g:10});
  near(c.range, 0, 1e-6);
  near(c.timeToPeak, 2, 1e-6);
  near(c.maxHeight, 20, 1e-6);
});

test('position and velocity at time zero', () => {
  const p = {u:25, theta:Math.PI/4, h:3, g:9.81};
  const pos = P.positionAt(p, 0);
  const v = P.velocityAt(p, 0);
  near(pos.x, 0);
  near(pos.y, 3);
  near(v.speed, 25);
  near(v.ay, -9.81);
});

test('minimum speed to target (30,40), g=10', () => {
  const r = P.minimumSpeedToTarget(30, 40, 10);
  near(r.distance, 50);
  near(r.speed, 30);
  near(r.angle * 180 / Math.PI, 71.565051177, 1e-6);
});

test('minimum-speed trajectory passes through target', () => {
  const r = P.minimumSpeedToTarget(30, 40, 10);
  const p = {u:r.speed, theta:r.angle, h:0, g:10};
  const hit = P.checkTarget(p, 30, 40, 0.001);
  assert.equal(hit.hit, true);
  near(hit.time, Math.sqrt(10), 1e-6);
});

test('reachable target has two launch angles', () => {
  const a = P.launchAnglesToTarget(20, 0, 20, 10);
  assert.equal(a.length, 2);
});

test('minimum-speed target has one unique angle', () => {
  const r = P.minimumSpeedToTarget(30, 40, 10);
  const a = P.launchAnglesToTarget(30, 40, r.speed, 10);
  assert.equal(a.length, 1);
  near(a[0], r.angle, 1e-6);
});

test('unreachable target returns no angles', () => {
  assert.deepEqual(P.launchAnglesToTarget(100, 100, 5, 10), []);
});

test('invalid gravity is rejected', () => {
  assert.throws(() => P.calculate({u:10,theta:0,h:0,g:0}));
});

test('negative time is rejected', () => {
  assert.throws(() => P.positionAt({u:10,theta:0,h:0,g:10}, -1));
});

console.log(`\n${passed}/11 tests passed.`);
