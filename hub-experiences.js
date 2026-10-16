(function () {
  "use strict";
  var deck = document.getElementById("experience-deck");
  var stage = document.getElementById("experience-stage");
  var picker = document.getElementById("theme-select");
  if (!deck || !stage || !picker || typeof CATALOG === "undefined") return;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  var all = CATALOG;
  var live = all.filter(function (x) { return x.status === "live"; });
  var cats = [];
  all.forEach(function (x) {
    if (cats.indexOf(x.category) === -1) cats.push(x.category);
  });

  function label(c) {
    return c.replace(/[-_]/g, " ").replace(/\b\w/g, function (m) { return m.toUpperCase(); });
  }

  var selected = cats[0] || "kinematics";
  var terminalHistory = ["VINIT SIM HUB // SECURE SHELL", "Type help | ls | open ID | clear"];

  function liveList(cat) {
    return live.filter(function (x) { return !cat || x.category === cat; });
  }

  function controlRoom() {
    var catBtns = cats.map(function (c) {
      return '<button type="button" class="cr-cat' + (c === selected ? " on" : "") +
        '" data-category="' + esc(c) + '">' + esc(label(c)) +
        " <em>" + liveList(c).length + "</em></button>";
    }).join("");

    var cards = liveList(selected).map(function (x) {
      return '<a class="cr-card" href="' + esc(x.url) + '">' +
        '<span class="cr-badge">LIVE</span>' +
        "<strong>" + esc(x.title) + "</strong>" +
        "<span>" + esc(x.desc) + "</span></a>";
    }).join("") || '<p class="cr-empty">No live labs in this sector yet.</p>';

    return '<div class="cr-wrap">' +
      '<div class="cr-top"><div class="cr-title"><span class="cr-icon">◈</span><div>' +
      "<h2>Space Data Center</h2><p>Mission control for every physics lab</p></div></div>" +
      '<div class="cr-status"><span class="cr-dot"></span> SYSTEMS ONLINE</div></div>' +
      '<div class="cr-stats">' +
      '<div class="cr-stat"><b>' + all.length + "</b><span>Catalog</span></div>" +
      '<div class="cr-stat"><b>' + live.length + "</b><span>Live Labs</span></div>" +
      '<div class="cr-stat"><b>' + cats.length + "</b><span>Sectors</span></div>" +
      '<div class="cr-stat warn"><b>' + (all.length - live.length) + "</b><span>Queued</span></div>" +
      "</div>" +
      '<div class="cr-body"><div class="cr-side"><div class="cr-panel"><h3>Sectors</h3>' +
      '<div class="cr-cats">' + catBtns + "</div></div></div>" +
      '<div class="cr-main"><div class="cr-panel"><h3>' + esc(label(selected)) +
      ' · Live Modules</h3><div class="cr-grid">' + cards + "</div></div></div></div></div>";
  }

  function constellation() {
    var nodes = cats.map(function (c, i) {
      var angle = (i / cats.length) * Math.PI * 2 - Math.PI / 2;
      var r = 38;
      return {
        c: c,
        x: 50 + r * Math.cos(angle),
        y: 50 + r * Math.sin(angle),
        live: liveList(c).length
      };
    });

    var lines = nodes.map(function (n) {
      return '<line x1="50" y1="50" x2="' + n.x + '" y2="' + n.y + '" class="st-link"/>';
    }).join("");

    var circles = nodes.map(function (n) {
      return '<circle cx="' + n.x + '" cy="' + n.y + '" r="' +
        (n.c === selected ? 3.2 : 2.4) + '" class="st-node' +
        (n.c === selected ? " on" : "") + '" data-category="' + esc(n.c) + '"/>';
    }).join("");

    var labels = nodes.map(function (n) {
      return '<button type="button" class="st-label' + (n.c === selected ? " on" : "") +
        '" data-category="' + esc(n.c) + '" style="left:' + n.x + "%;top:" + n.y + '%">' +
        esc(label(n.c)) + "<small>" + n.live + " live</small></button>";
    }).join("");

    var items = liveList(selected).map(function (x) {
      return '<a href="' + esc(x.url) + '" class="st-item"><b>' +
        esc(x.icon || "●") + "</b> " + esc(x.title) + "</a>";
    }).join("") || "<span>No live labs</span>";

    return '<div class="st-wrap"><div class="st-head"><h2>★ Star Map</h2>' +
      "<p>Tap a node to explore that sector</p></div>" +
      '<div class="st-map"><svg viewBox="0 0 100 100" class="st-svg">' +
      lines + '<circle cx="50" cy="50" r="4" class="st-core"/>' + circles +
      '</svg><div class="st-labels">' + labels + "</div></div>" +
      '<div class="st-panel"><h3>' + esc(label(selected)) + "</h3>" +
      '<div class="st-items">' + items + "</div></div></div>";
  }

  function holographic() {
    var panels = cats.map(function (c) {
      var links = liveList(c).slice(0, 4).map(function (x) {
        return '<a href="' + esc(x.url) + '">' + esc(x.title) + "</a>";
      }).join("") || '<span class="hg-muted">Coming soon</span>';
      return '<div class="hg-panel' + (c === selected ? " on" : "") + '">' +
        '<button type="button" class="hg-tab" data-category="' + esc(c) + '">' +
        esc(label(c)) + '</button><div class="hg-list">' + links + "</div></div>";
    }).join("");

    return '<div class="hg-wrap"><div class="hg-orb-zone">' +
      '<div class="hg-orb"><div class="hg-ring"></div><div class="hg-ring r2"></div>' +
      '<div class="hg-core">∑</div></div>' +
      '<div class="hg-float f1"><b>' + live.length + "</b><span>Live Sims</span></div>" +
      '<div class="hg-float f2"><b>' + cats.length + "</b><span>Sectors</span></div>" +
      '<div class="hg-float f3"><b>' + all.length + "</b><span>Catalog</span></div>" +
      '</div><div class="hg-panels">' + panels + "</div></div>";
  }

  function terminal() {
    var lines = terminalHistory.map(function (l) {
      return '<div class="tm-line">' + esc(l) + "</div>";
    }).join("");

    var side = cats.map(function (c) {
      return '<button type="button" class="tm-file" data-category="' + esc(c) +
        '">./' + esc(c) + "/</button>";
    }).join("");

    var labs = liveList(selected).map(function (x) {
      return '<a class="tm-lab" href="' + esc(x.url) + '"><span class="tm-id">' +
        esc(x.id) + "</span> " + esc(x.title) + "</a>";
    }).join("") || '<div class="tm-line"># no live labs in sector</div>';

    return '<div class="tm-wrap"><div class="tm-bar"><span>root@vinit-sim:~#</span>' +
      '<span class="tm-online">● ONLINE</span></div><div class="tm-body">' +
      '<div class="tm-side"><div class="tm-file on">./hub.sh</div>' + side + "</div>" +
      '<div class="tm-main"><div class="tm-cards">' +
      '<div class="tm-card"><span>LIVE</span><b>' + live.length + "</b></div>" +
      '<div class="tm-card"><span>TOTAL</span><b>' + all.length + "</b></div>" +
      '<div class="tm-card"><span>SECTOR</span><b>' + esc(label(selected)) + "</b></div>" +
      '</div><div class="tm-log" id="exp-log">' + lines + "</div>" +
      '<div class="tm-labs"><div class="tm-labs-title">// live — ' + esc(label(selected)) +
      "</div>" + labs + "</div>" +
      '<form id="exp-terminal-form" class="tm-form"><span>$</span>' +
      '<input id="exp-command" autocomplete="off" placeholder="help | ls | open projectile | clear"/>' +
      '<button type="submit">EXEC</button></form>' +
      '<div id="exp-terminal-result" class="tm-result"></div></div></div></div>';
  }

  function render() {
    var theme = picker.value;
    try {
      if (theme === "holographic") stage.innerHTML = holographic();
      else if (theme === "constellation") stage.innerHTML = constellation();
      else if (theme === "terminal") stage.innerHTML = terminal();
      else stage.innerHTML = controlRoom();
    } catch (err) {
      stage.innerHTML = '<div style="padding:20px;color:#f88">Theme render error: ' +
        esc(String(err && err.message ? err.message : err)) + "</div>";
    }
  }

  deck.addEventListener("click", function (e) {
    var b = e.target.closest("[data-category]");
    if (!b) return;
    selected = b.dataset.category;
    render();
  });

  deck.addEventListener("submit", function (e) {
    if (e.target.id !== "exp-terminal-form") return;
    e.preventDefault();
    var input = deck.querySelector("#exp-command");
    if (!input) return;
    var raw = input.value.trim();
    var parts = raw.split(/\s+/);
    var cmd = (parts.shift() || "").toLowerCase();
    var arg = parts.join(" ");
    var result = "";
    if (cmd === "help") result = "help | ls | cd CATEGORY | open ID | clear";
    else if (cmd === "ls") {
      result = cats.map(function (c) {
        return c + " (" + liveList(c).length + " live)";
      }).join("\n") + "\nIDs: " + live.map(function (x) { return x.id; }).join(", ");
    } else if (cmd === "cd") {
      var c = cats.filter(function (x) {
        return x.toLowerCase() === arg.toLowerCase() ||
          label(x).toLowerCase() === arg.toLowerCase();
      })[0];
      if (c) { selected = c; result = "sector → " + label(c); render(); return; }
      result = "unknown sector";
    } else if (cmd === "open") {
      var x = live.filter(function (item) { return item.id === arg; })[0];
      if (x && x.url) { location.href = x.url; return; }
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