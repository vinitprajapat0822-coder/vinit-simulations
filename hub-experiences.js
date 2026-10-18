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
      .replace(/"/g, "&quot;");
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

  var selected = "modern";
  if (cats.indexOf("kinematics") >= 0) selected = "kinematics";
  var terminalHistory = ["VINIT SIM HUB // SECURE SHELL", "Type help | ls | open ID | clear"];
  var stackIndex = 0;
  var stackItems = live.slice();

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
        '<span class="cr-badge">LIVE</span><strong>' + esc(x.title) +
        "</strong><span>" + esc(x.desc) + "</span></a>";
    }).join("") || '<p class="cr-empty">No live labs in this sector.</p>';
    return '<div class="cr-wrap"><div class="cr-top"><div class="cr-title"><span class="cr-icon">◈</span><div>' +
      "<h2>Space Data Center</h2><p>Live labs only · mission control</p></div></div>" +
      '<div class="cr-status"><span class="cr-dot"></span> ONLINE</div></div>' +
      '<div class="cr-stats"><div class="cr-stat"><b>' + live.length + "</b><span>Live</span></div>" +
      '<div class="cr-stat"><b>' + cats.length + "</b><span>Sectors</span></div>" +
      '<div class="cr-stat"><b>' + liveList(selected).length + "</b><span>This sector</span></div>" +
      '<div class="cr-stat warn"><b>' + (all.length - live.length) + "</b><span>Hidden</span></div></div>" +
      '<div class="cr-body"><div class="cr-side"><div class="cr-panel"><h3>Sectors</h3><div class="cr-cats">' +
      catBtns + '</div></div></div><div class="cr-main"><div class="cr-panel"><h3>' +
      esc(label(selected)) + ' · Live</h3><div class="cr-grid">' + cards +
      "</div></div></div></div></div>";
  }

  
  function constellation() {
    var nodes = cats.map(function (c, i) {
      var angle = (i / Math.max(cats.length, 1)) * Math.PI * 2 - Math.PI / 2;
      var orbit = 22 + (i % 4) * 10;
      return {
        c: c,
        orbit: orbit,
        angle: angle,
        live: liveList(c).length,
        label: label(c)
      };
    });
    var items = liveList(selected)
      .map(function (x) {
        return (
          '<a href="' +
          esc(x.url) +
          '" class="st-item"><b>' +
          esc(x.icon || "●") +
          "</b> " +
          esc(x.title) +
          "</a>"
        );
      })
      .join("") || "<span>No live labs</span>";

    return (
      '<div class="st-wrap solar">' +
      '<div class="st-head"><h2>✦ Solar Topic Map</h2>' +
      "<p>Drag to rotate · each orbit is a subject · tap a planet for live labs</p></div>" +
      '<div class="solar-stage" id="solar-stage">' +
      '<div class="solar-scene" id="solar-scene">' +
      '<div class="solar-sun">∑</div>' +
      nodes
        .map(function (n, i) {
          var on = n.c === selected ? " on" : "";
          return (
            '<div class="solar-orbit" style="width:' +
            n.orbit * 2 +
            "%;height:" +
            n.orbit * 2 +
            '%;margin-left:-' +
            n.orbit +
            "%;margin-top:-" +
            n.orbit +
            '%">' +
            '<button type="button" class="solar-planet' +
            on +
            '" data-category="' +
            esc(n.c) +
            '" style="--a:' +
            n.angle +
            'rad" title="' +
            esc(n.label) +
            '"><span class="sp-inner"><span class="sp-dot"></span><span class="sp-name">' +
            esc(n.label) +
            "</span><small>" +
            n.live +
            "</small></span></button></div>"
          );
        })
        .join("") +
      "</div></div>" +
      '<div class="st-panel"><h3>' +
      esc(label(selected)) +
      ' · Live</h3><div class="st-items">' +
      items +
      "</div></div></div>"
    );
  }

  function bindSolarDrag() {
    var stage = document.getElementById("solar-stage");
    var scene = document.getElementById("solar-scene");
    if (!stage || !scene) return;
    var rotX = -18, rotY = 12;
    var dragging = false, lx = 0, ly = 0;
    function apply() {
      scene.style.transform =
        "rotateX(" + rotX + "deg) rotateY(" + rotY + "deg)";
    }
    apply();
    function down(x, y) {
      dragging = true;
      lx = x;
      ly = y;
    }
    function move(x, y) {
      if (!dragging) return;
      rotY += (x - lx) * 0.35;
      rotX -= (y - ly) * 0.35;
      rotX = Math.max(-55, Math.min(55, rotX));
      lx = x;
      ly = y;
      apply();
    }
    function up() {
      dragging = false;
    }
    stage.addEventListener("mousedown", function (e) {
      down(e.clientX, e.clientY);
    });
    window.addEventListener("mousemove", function (e) {
      move(e.clientX, e.clientY);
    });
    window.addEventListener("mouseup", up);
    stage.addEventListener(
      "touchstart",
      function (e) {
        var t = e.changedTouches[0];
        down(t.clientX, t.clientY);
      },
      { passive: true }
    );
    stage.addEventListener(
      "touchmove",
      function (e) {
        var t = e.changedTouches[0];
        move(t.clientX, t.clientY);
      },
      { passive: true }
    );
    stage.addEventListener("touchend", up);
  }

function holographic() {
    stackItems = liveList(selected);
    if (stackIndex >= stackItems.length) stackIndex = 0;
    if (!stackItems.length) {
      return '<div class="hg-wrap"><div class="hg-empty">No live labs in this sector. Pick another sector below.</div>' +
        sectorChips() + "</div>";
    }
    var cards = "";
    var maxShow = Math.min(4, stackItems.length);
    for (var i = 0; i < maxShow; i++) {
      var idx = (stackIndex + i) % stackItems.length;
      var item = stackItems[idx];
      var z = maxShow - i;
      var scale = 1 - i * 0.04;
      var y = i * 12;
      cards += '<div class="hg-card" data-stack="' + i + '" style="z-index:' + z +
        ";transform:translateY(" + y + "px) scale(" + scale + ')" data-url="' + esc(item.url) + '">' +
        '<div class="hg-card-glow"></div>' +
        '<span class="hg-badge">LIVE · ' + esc(item.category) + "</span>" +
        "<h3>" + esc(item.title) + "</h3>" +
        "<p>" + esc(item.desc) + "</p>" +
        '<div class="hg-card-actions">' +
        '<a class="hg-open" href="' + esc(item.url) + '">Open lab →</a>' +
        "<span>" + (idx + 1) + " / " + stackItems.length + "</span></div></div>";
    }
    return '<div class="hg-wrap">' +
      '<div class="hg-head"><h2>Holographic Deck</h2>' +
      "<p>Swipe left / right or use buttons · like app cards</p></div>" +
      sectorChips() +
      '<div class="hg-stack-zone" id="hg-stack">' + cards + "</div>" +
      '<div class="hg-controls">' +
      '<button type="button" id="hg-prev" class="hg-nav">← Prev</button>' +
      '<button type="button" id="hg-next" class="hg-nav">Next →</button>' +
      "</div>" +
      '<p class="hg-hint">Swipe card left/right · tap Open lab</p></div>';
  }

  function sectorChips() {
    return '<div class="hg-sectors">' + cats.map(function (c) {
      return '<button type="button" class="hg-chip' + (c === selected ? " on" : "") +
        '" data-category="' + esc(c) + '">' + esc(label(c)) +
        " · " + liveList(c).length + "</button>";
    }).join("") + "</div>";
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
    }).join("") || '<div class="tm-line"># no live labs</div>';
    return '<div class="tm-wrap"><div class="tm-bar"><span>root@vinit-sim:~#</span>' +
      '<span class="tm-online">● ONLINE</span></div><div class="tm-body">' +
      '<div class="tm-side"><div class="tm-file on">./hub.sh</div>' + side +
      '</div><div class="tm-main"><div class="tm-cards">' +
      '<div class="tm-card"><span>LIVE</span><b>' + live.length + "</b></div>" +
      '<div class="tm-card"><span>SECTOR</span><b>' + esc(label(selected)) + "</b></div>" +
      '<div class="tm-card"><span>SHOWN</span><b>' + liveList(selected).length + "</b></div></div>" +
      '<div class="tm-log" id="exp-log">' + lines + "</div>" +
      '<div class="tm-labs"><div class="tm-labs-title">// live — ' + esc(label(selected)) +
      "</div>" + labs + "</div>" +
      '<form id="exp-terminal-form" class="tm-form"><span>$</span>' +
      '<input id="exp-command" autocomplete="off" placeholder="help | ls | open ID | clear"/>' +
      '<button type="submit">EXEC</button></form>' +
      '<div id="exp-terminal-result" class="tm-result"></div></div></div></div>';
  }

  function bindHolographicGestures() {
    var zone = document.getElementById("hg-stack");
    var prev = document.getElementById("hg-prev");
    var next = document.getElementById("hg-next");
    if (prev) prev.onclick = function () {
      stackIndex = (stackIndex - 1 + stackItems.length) % stackItems.length;
      render();
    };
    if (next) next.onclick = function () {
      stackIndex = (stackIndex + 1) % stackItems.length;
      render();
    };
    if (!zone) return;
    var startX = 0, startY = 0, dragging = false;
    var top = zone.querySelector('.hg-card[data-stack="0"]');
    if (!top) return;

    function onStart(x, y) {
      dragging = true;
      startX = x;
      startY = y;
      top.style.transition = "none";
    }
    function onMove(x, y) {
      if (!dragging || !top) return;
      var dx = x - startX;
      var dy = y - startY;
      top.style.transform = "translate(" + dx + "px," + dy + "px) rotate(" + dx * 0.05 + "deg)";
      top.style.opacity = String(Math.max(0.35, 1 - Math.abs(dx) / 220));
    }
    function onEnd(x, y) {
      if (!dragging || !top) return;
      dragging = false;
      var dx = x - startX;
      var dy = y - startY;
      top.style.transition = "transform 0.28s ease, opacity 0.28s ease";
      if (Math.abs(dx) > 80 || dy < -90) {
        var dir = dx > 0 ? 1 : -1;
        if (Math.abs(dx) < 40 && dy < -90) dir = 1;
        top.style.transform = "translate(" + dir * 420 + "px," + dy + "px) rotate(" + dir * 18 + "deg)";
        top.style.opacity = "0";
        setTimeout(function () {
          stackIndex = (stackIndex + 1) % Math.max(stackItems.length, 1);
          render();
        }, 240);
      } else {
        top.style.transform = "";
        top.style.opacity = "1";
      }
    }

    top.addEventListener("touchstart", function (e) {
      var t = e.changedTouches[0];
      onStart(t.clientX, t.clientY);
    }, { passive: true });
    top.addEventListener("touchmove", function (e) {
      var t = e.changedTouches[0];
      onMove(t.clientX, t.clientY);
    }, { passive: true });
    top.addEventListener("touchend", function (e) {
      var t = e.changedTouches[0];
      onEnd(t.clientX, t.clientY);
    });
    top.addEventListener("mousedown", function (e) {
      onStart(e.clientX, e.clientY);
      function mm(ev) { onMove(ev.clientX, ev.clientY); }
      function mu(ev) {
        onEnd(ev.clientX, ev.clientY);
        window.removeEventListener("mousemove", mm);
        window.removeEventListener("mouseup", mu);
      }
      window.addEventListener("mousemove", mm);
      window.addEventListener("mouseup", mu);
    });
  }

  function render() {
    var theme = picker.value;
    try {
      if (theme === "holographic") stage.innerHTML = holographic();
      else if (theme === "constellation") stage.innerHTML = constellation();
      else if (theme === "terminal") stage.innerHTML = terminal();
      else stage.innerHTML = controlRoom();
      if (theme === "holographic") bindHolographicGestures();
      if (theme === "constellation") bindSolarDrag();
    } catch (err) {
      stage.innerHTML = '<div style="padding:20px;color:#f88">Render error: ' +
        esc(String(err && err.message ? err.message : err)) + "</div>";
    }
  }

  deck.addEventListener("click", function (e) {
    var b = e.target.closest("[data-category]");
    if (!b) return;
    selected = b.dataset.category;
    stackIndex = 0;
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
      result = cats.map(function (c) { return c + " (" + liveList(c).length + " live)"; }).join("\n");
    } else if (cmd === "cd") {
      var c = cats.filter(function (x) {
        return x.toLowerCase() === arg.toLowerCase() || label(x).toLowerCase() === arg.toLowerCase();
      })[0];
      if (c) { selected = c; stackIndex = 0; result = "sector → " + label(c); render(); return; }
      result = "unknown sector";
    } else if (cmd === "open") {
      var x = live.filter(function (item) { return item.id === arg; })[0];
      if (x && x.url) { location.href = x.url; return; }
      result = "not found";
    } else if (cmd === "clear") { terminalHistory = ["cleared."]; render(); return; }
    else result = "unknown. type help";
    terminalHistory.push("$ " + raw, result);
    terminalHistory = terminalHistory.slice(-12);
    input.value = "";
    render();
  });

  picker.addEventListener("change", function () {
    stackIndex = 0;
    render();
  });
  document.addEventListener("vsh-theme-change", function () {
    stackIndex = 0;
    render();
  });
  render();
})();
