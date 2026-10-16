(function () {
  "use strict";
  const deck = document.getElementById("experience-deck");
  const stage = document.getElementById("experience-stage");
  const picker = document.getElementById("theme-select");
  if (!deck || !stage || !picker || typeof CATALOG === "undefined") return;

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  const all = CATALOG;
  const live = all.filter((x) => x.status === "live");
  const cats = [...new Set(all.map((x) => x.category))];
  const label = (c) =>
    c.replace(/[-_]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

  let selected = cats[0] || "kinematics";
  let terminalHistory = [
    "VINIT SIM HUB // SECURE SHELL",
    "Type help | ls | open ID | clear",
  ];

  function liveList(cat) {
    return live.filter((x) => !cat || x.category === cat);
  }

  /* ========== CONTROL ROOM — Space Data Center ========== */
  function controlRoom() {
    const byCat = cats.map((c) => ({
      c,
      n: all.filter((x) => x.category === c).length,
      live: live.filter((x) => x.category === c).length,
    }));
    return `
<div class="cr-wrap">
  <div class="cr-top">
    <div class="cr-title">
      <span class="cr-icon">◈</span>
      <div>
        <h2>Space Data Center</h2>
        <p>Mission control for every physics lab · live telemetry</p>
      </div>
    </div>
    <div class="cr-status"><span class="cr-dot"></span> SYSTEMS ONLINE</div>
  </div>
  <div class="cr-stats">
    <div class="cr-stat"><b>${all.length}</b><span>Catalog</span></div>
    <div class="cr-stat"><b>${live.length}</b><span>Live Labs</span></div>
    <div class="cr-stat"><b>${cats.length}</b><span>Sectors</span></div>
    <div class="cr-stat warn"><b>${all.length - live.length}</b><span>Queued</span></div>
  </div>
  <div class="cr-body">
    <div class="cr-side">
      <div class="cr-panel">
        <h3>Sectors</h3>
        <div class="cr-cats">
          ${cats
            .map(
              (c) =>
                `<button type="button" class="cr-cat ${c === selected ? "on" : ""}" data-category="${esc(c)}">${esc(label(c))} <em>${liveList(c).length}</em></button>`
            )
            .join("")}
        </div>
      </div>
    </div>
    <div class="cr-main">
      <div class="cr-panel">
        <h3>${esc(label(selected))} · Live Modules</h3>
        <div class="cr-grid">
          ${liveList(selected)
            .map(
              (x) => `
            <a class="cr-card" href="${esc(x.url)}">
              <span class="cr-badge">LIVE</span>
              <strong>${esc(x.title)}</strong>
              <span>${esc(x.desc)}</span>
            </a>`
            )
            .join("") || '<p class="cr-empty">No live labs in this sector yet.</p>'}
        </div>
      </div>
    </div>
  </div>
</div>`;
  }

  /* ========== CONSTELLATION — Star Map ========== */
  function constellation() {
    const nodes = cats.map((c, i) => {
      const angle = (i / cats.length) * Math.PI * 2 - Math.PI / 2;
      const r = 38;
      return {
        c,
        x: 50 + r * Math.cos(angle),
        y: 50 + r * Math.sin(angle),
        live: liveList(c).length,
      };
    });
    return `
<div class="st-wrap">
  <div class="st-head">
    <h2>★ Star Map</h2>
    <p>Constellation of knowledge · tap a node to explore that sector</p>
  </div>
  <div class="st-map">
    <svg viewBox="0 0 100 100" class="st-svg">
      ${nodes
        .map(
          (n) =>
            `<line x1="50" y1="50" x2="${n.x}" y2="${n.y}" class="st-link"/>`
        )
        .join("")}
      <circle cx="50" cy="50" r="4" class="st-core"/>
      ${nodes
        .map(
          (n, i) =>
            `<circle cx="${n.x}" cy="${n.y}" r="${n.c === selected ? 3.2 : 2.4}" class="st-node ${n.c === selected ? "on" : ""}" data-category="${esc(n.c)}"/>`
        )
        .join("")}
    </svg>
    <div class="st-labels">
      ${nodes
        .map(
          (n) =>
            `<button type="button" class="st-label ${n.c === selected ? "on" : ""}" data-category="${esc(n.c)}" style="left:${n.x}%;top:${n.y}%">${esc(label(n.c))}<small>${n.live} live</small></button>`
        )
        .join("")}
    </div>
  </div>
  <div class="st-panel">
    <h3>${esc(label(selected))}</h3>
    <div class="st-items">
      ${liveList(selected)
        .map(
          (x) =>
            `<a href="${esc(x.url)}" class="st-item"><b>${esc(x.icon || "●")}</b> ${esc(x.title)}</a>`
        )
        .join("") || "<span>No live labs</span>"}
    </div>
  </div>
</div>`;
  }

  /* ========== HOLOGRAPHIC — Neon floating panels ========== */
  function holographic() {
    return `
<div class="hg-wrap">
  <div class="hg-orb-zone">
    <div class="hg-orb">
      <div class="hg-ring"></div>
      <div class="hg-ring r2"></div>
      <div class="hg-core">∑</div>
    </div>
    <div class="hg-float f1">
      <b>${live.length}</b><span>Live Sims</span>
    </div>
    <div class="hg-float f2">
      <b>${cats.length}</b><span>Sectors</span>
    </div>
    <div class="hg-float f3">
      <b>${all.length}</b><span>Catalog</span>
    </div>
  </div>
  <div class="hg-panels">
    ${cats
      .map(
        (c) => `
      <div class="hg-panel ${c === selected ? "on" : ""}">
        <button type="button" class="hg-tab" data-category="${esc(c)}">${esc(label(c))}</button>
        <div class="hg-list">
          ${liveList(c)
            .slice(0, 4)
            .map(
              (x) =>
                `<a href="${esc(x.url)}">${esc(x.title)}</a>`
            )
            .join("") || '<span class="hg-muted">Coming soon</span>'}
        </div>
      </div>`
      )
      .join("")}
  </div>
</div>`;
  }

  /* ========== TERMINAL — Hacker green ========== */
  function terminal() {
    const lines = terminalHistory
      .map((l) => `<div class="tm-line">${esc(l)}</div>`)
      .join("");
    const liveIds = live.map((x) => x.id).join("  ");
    return `
<div class="tm-wrap">
  <div class="tm-bar">
    <span>root@vinit-sim:~#</span>
    <span class="tm-online">● ONLINE</span>
  </div>
  <div class="tm-body">
    <div class="tm-side">
      <div class="tm-file on">./hub.sh</div>
      <div class="tm-file">./catalog.js</div>
      <div class="tm-file">./projects/</div>
      ${cats.map((c) => `<button type="button" class="tm-file" data-category="${esc(c)}">./${esc(c)}/</button>`).join("")}
    </div>
    <div class="tm-main">
      <div class="tm-cards">
        <div class="tm-card"><span>LIVE</span><b>${live.length}</b></div>
        <div class="tm-card"><span>TOTAL</span><b>${all.length}</b></div>
        <div class="tm-card"><span>SECTOR</span><b>${esc(label(selected))}</b></div>
      </div>
      <div class="tm-log" id="exp-log">${lines}</div>
      <div class="tm-labs">
        <div class="tm-labs-title">// live modules — ${esc(label(selected))}</div>
        ${liveList(selected)
          .map(
            (x) =>
              `<a class="tm-lab" href="${esc(x.url)}"><span class="tm-id">${esc(x.id)}</span> ${esc(x.title)}</a>`
          )
          .join("") || '<div class="tm-line"># no live labs in sector</div>'}
      </div>
      <form id="exp-terminal-form" class="tm-form">
        <span>$</span>
        <input id="exp-command" autocomplete="off" placeholder="help | ls | open projectile | clear" />
        <button type="submit">EXEC</button>
      </form>
      <div id="exp-terminal-result" class="tm-result"></div>
    </div>
  </div>
</div>`;
  }

  function render() {
    const theme = picker.value;
    if (theme === "holographic") stage.innerHTML = holographic();
    else if (theme === "constellation") stage.innerHTML = constellation();
    else if (theme === "terminal") stage.innerHTML = terminal();
    else stage.innerHTML = controlRoom();
  }

  deck.addEventListener("click", (e) => {
    const b = e.target.closest("[data-category]");
    if (!b) return;
    selected = b.dataset.category;
    render();
  });

  deck.addEventListener("submit", (e) => {
    if (e.target.id !== "exp-terminal-form") return;
    e.preventDefault();
    const input = deck.querySelector("#exp-command");
    const out = deck.querySelector("#exp-terminal-result");
    if (!input || !out) return;
    const raw = input.value.trim();
    const parts = raw.split(/\s+/);
    const cmd = (parts.shift() || "").toLowerCase();
    const arg = parts.join(" ");
    let result = "";
    if (cmd === "help")
      result = "help | ls | cd CATEGORY | open ID | clear";
    else if (cmd === "ls")
      result =
        cats.map((c) => c + " (" + liveList(c).length + " live)").join("\n") +
        "\n\nIDs: " +
        live.map((x) => x.id).join(", ");
    else if (cmd === "cd") {
      const c = cats.find(
        (x) =>
          x.toLowerCase() === arg.toLowerCase() ||
          label(x).toLowerCase() === arg.toLowerCase()
      );
      if (c) {
        selected = c;
        result = "sector → " + label(c);
        render();
        return;
      } else result = "unknown sector";
    } else if (cmd === "open") {
      const x = live.find((x) => x.id === arg);
      if (x && x.url) {
        location.href = x.url;
        return;
      }
      result = "not found / not live";
    } else if (cmd === "clear") {
      terminalHistory = ["cleared."];
      render();
      return;
    } else result = "unknown. type help";
    terminalHistory.push("$ " + raw, result);
    terminalHistory = terminalHistory.slice(-12);
    input.value = "";
    render();
  });

  picker.addEventListener("change", render);
  document.addEventListener("vsh-theme-change", render);
  render();
})();