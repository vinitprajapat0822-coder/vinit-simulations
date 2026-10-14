(function () {
  'use strict';

  function start() {
    const P = window.ProjectilePhysics;
    const canvas = document.getElementById('canvas');
    if (!P || !canvas) {
      console.error('Projectile enhancement: physics core or canvas missing.');
      return;
    }

    const $ = id => document.getElementById(id);
    const read = id => Number($(id).value);
    const rad = degrees => degrees * Math.PI / 180;

    const panel = document.createElement('section');
    panel.id = 'livePhysicsDashboard';
    panel.innerHTML = `
      <h3>Live Physics Dashboard</h3>
      <div class="live-physics-grid">
        <div><small>Time</small><strong id="liveT">0.00 s</strong></div>
        <div><small>Position X</small><strong id="liveX">0.00 m</strong></div>
        <div><small>Position Y</small><strong id="liveY">0.00 m</strong></div>
        <div><small>Horizontal velocity</small><strong id="liveVx">0.00 m/s</strong></div>
        <div><small>Vertical velocity</small><strong id="liveVy">0.00 m/s</strong></div>
        <div><small>Speed magnitude</small><strong id="liveSpeed">0.00 m/s</strong></div>
        <div><small>Acceleration X</small><strong id="liveAx">0.00 m/s²</strong></div>
        <div><small>Acceleration Y</small><strong id="liveAy">−9.81 m/s²</strong></div>
      </div>
      <div class="live-physics-divider"></div>
      <h3>Target Analysis</h3>
      <p id="targetAnalysis" aria-live="polite">Switch to Hit Target mode to analyse a target.</p>
      <p class="live-physics-note">Ideal projectile model; air resistance is not included.</p>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #livePhysicsDashboard {
        margin-top: 16px;
        padding: 16px;
        border: 1px solid rgba(103,232,249,.24);
        border-radius: 14px;
        background: rgba(10,20,38,.96);
        color: #e6f5ff;
        font: inherit;
      }
      #livePhysicsDashboard h3 { margin: 0 0 12px; font-size: 1rem; }
      .live-physics-grid {
        display: grid;
        grid-template-columns: repeat(2,minmax(0,1fr));
        gap: 10px;
      }
      .live-physics-grid > div {
        min-width: 0; padding: 10px;
        border-radius: 9px;
        background: rgba(255,255,255,.045);
      }
      .live-physics-grid small {
        display: block; margin-bottom: 5px;
        color: #a7bfd5; font-size: .75rem;
      }
      .live-physics-grid strong {
        display: block; overflow-wrap: anywhere;
        color: #67e8f9; font-size: .95rem;
      }
      .live-physics-divider {
        height: 1px; margin: 16px 0;
        background: rgba(255,255,255,.12);
      }
      #targetAnalysis { line-height: 1.55; margin: 0; }
      .live-physics-note { color: #a7bfd5; font-size: .78rem; margin: 12px 0 0; }
      @media(min-width:600px) {
        .live-physics-grid { grid-template-columns: repeat(4,minmax(0,1fr)); }
      }
    `;

    document.head.appendChild(style);

    const canvasBox = canvas.closest('.canvasbox') || canvas.parentElement;
    canvasBox.insertAdjacentElement('afterend', panel);

    const watched = [
      'speed','speedNum','angle','angleNum','height','heightNum',
      'g','gNum','tx','txNum','ty','tyNum'
    ].map($).filter(Boolean);

    function params() {
      return {
        u: read('speed'),
        theta: rad(read('angle')),
        h: read('height'),
        g: read('g')
      };
    }

    function simulationTime() {
      const label = $('timeLabel');
      const match = label && label.textContent.match(/t\s*=\s*(-?[\d.]+)/);
      return match ? Math.max(0, Number(match[1])) : 0;
    }

    function fmt(n, unit) {
      return Number.isFinite(n) ? `${n.toFixed(2)} ${unit}` : '—';
    }

    function update() {
      try {
        const p = params();
        const c = P.calculate(p);
        const t = Math.min(simulationTime(), c.flightTime);
        const pos = P.positionAt(p, t);
        const vel = P.velocityAt(p, t);

        $('liveT').textContent = fmt(t, 's');
        $('liveX').textContent = fmt(pos.x, 'm');
        $('liveY').textContent = fmt(Math.max(0, pos.y), 'm');
        $('liveVx').textContent = fmt(vel.vx, 'm/s');
        $('liveVy').textContent = fmt(vel.vy, 'm/s');
        $('liveSpeed').textContent = fmt(vel.speed, 'm/s');
        $('liveAx').textContent = fmt(vel.ax, 'm/s²');
        $('liveAy').textContent = fmt(vel.ay, 'm/s²');

        const targetMode = document.querySelector(
          '.modebtn[aria-pressed="true"]'
        );
        const target = $('targetAnalysis');

        if (targetMode && targetMode.dataset.mode === 'target') {
          const x = read('tx');
          const y = read('ty');
          const dy = y - p.h;
          const min = P.minimumSpeedToTarget(x, dy, p.g);
          const angles = P.launchAnglesToTarget(x, dy, p.u, p.g);
          const hit = P.checkTarget(p, x, y, 0.25);
          const angleText = angles.length
            ? angles.map(a => `${(a * 180 / Math.PI).toFixed(2)}°`).join(' / ')
            : 'No upward launch angle at this speed';

          target.textContent =
            `Current trajectory: ${hit.hit ? 'HIT (within 0.25 m)' : 'MISS'}; ` +
            `position error ${Number.isFinite(hit.error) ? hit.error.toFixed(2) + ' m' : 'unreachable'}. ` +
            `Minimum launch speed: ${min.speed.toFixed(2)} m/s at ` +
            `${(min.angle * 180 / Math.PI).toFixed(2)}°. ` +
            `Possible upward launch angles at current speed: ${angleText}.`;
        } else {
          target.textContent =
            `Flight time: ${c.flightTime.toFixed(2)} s · ` +
            `Horizontal range: ${c.range.toFixed(2)} m · ` +
            `Maximum height: ${c.maxHeight.toFixed(2)} m · ` +
            `Time to apex: ${c.timeToPeak.toFixed(2)} s.`;
        }
      } catch (error) {
        $('targetAnalysis').textContent = `Check the input values: ${error.message}`;
      }
    }

    watched.forEach(el => {
      el.addEventListener('input', update);
      el.addEventListener('change', update);
    });
    document.querySelectorAll('.modebtn').forEach(el =>
      el.addEventListener('click', update)
    );

    // The original animation updates its time label every frame.
    // This lightweight loop reads that label without modifying the original renderer.
    let lastUpdate = 0;
    function frame(now) {
      if (now - lastUpdate > 80) {
        update();
        lastUpdate = now;
      }
      requestAnimationFrame(frame);
    }

    update();
    requestAnimationFrame(frame);
    console.log('Projectile live dashboard loaded.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
