(function () {
  "use strict";

  if (window.__vshAnalyticsEventsInitialized) return;
  window.__vshAnalyticsEventsInitialized = true;

  function sendEvent(name, parameters) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", name, parameters || {});
  }

  // Record each scroll-depth milestone once per page view.
  var scrollMilestones = [25, 50, 75, 90];
  var reachedMilestones = Object.create(null);
  var scrollFramePending = false;

  function readScrollPercent() {
    var root = document.documentElement;
    var body = document.body;
    var scrollTop = window.pageYOffset || root.scrollTop || body.scrollTop || 0;
    var pageHeight = Math.max(
      root.scrollHeight || 0,
      body.scrollHeight || 0,
      root.offsetHeight || 0,
      body.offsetHeight || 0
    );
    var viewportHeight = window.innerHeight || root.clientHeight || 0;
    var scrollableHeight = pageHeight - viewportHeight;
    if (scrollableHeight <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((scrollTop / scrollableHeight) * 100)));
  }

  function recordScrollDepth() {
    scrollFramePending = false;
    var percent = readScrollPercent();
    scrollMilestones.forEach(function (milestone) {
      if (percent >= milestone && !reachedMilestones[milestone]) {
        reachedMilestones[milestone] = true;
        sendEvent("scroll_depth", {
          percent_scrolled: milestone,
          page_type: window.location.pathname.indexOf("/projects/") === 0 ? "simulation" : "hub"
        });
      }
    });
  }

  window.addEventListener("scroll", function () {
    if (scrollFramePending) return;
    scrollFramePending = true;
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(recordScrollDepth);
    } else {
      window.setTimeout(recordScrollDepth, 100);
    }
  }, { passive: true });

  // Track off-site HTTP(S) links without blocking navigation.
  document.addEventListener("click", function (event) {
    var target = event.target;
    var anchor = target && target.closest ? target.closest("a[href]") : null;
    if (!anchor) return;

    var destination;
    try {
      destination = new URL(anchor.href, window.location.href);
    } catch (error) {
      return;
    }

    if ((destination.protocol !== "http:" && destination.protocol !== "https:") ||
        destination.hostname === window.location.hostname) return;

    var linkText = (anchor.textContent || anchor.getAttribute("aria-label") || "")
      .replace(/\s+/g, " ").trim().slice(0, 120);

    sendEvent("outbound_click", {
      link_url: destination.href,
      link_domain: destination.hostname,
      link_text: linkText,
      transport_type: "beacon"
    });
  }, true);

  // Record one meaningful interaction as a page-engagement signal.
  var engagementRecorded = false;
  function recordEngagement(kind, target) {
    if (engagementRecorded) return;
    engagementRecorded = true;
    var isSimulation = window.location.pathname.indexOf("/projects/") === 0;
    sendEvent("simulation_engagement", {
      engagement_type: kind,
      page_type: isSimulation ? "simulation" : "hub",
      control_type: target && target.tagName ? target.tagName.toLowerCase() : "unknown"
    });
  }

  document.addEventListener("input", function (event) {
    var target = event.target;
    if (target && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) {
      recordEngagement("control_change", target);
    }
  }, true);

  document.addEventListener("change", function (event) {
    var target = event.target;
    if (target && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) {
      recordEngagement("control_change", target);
    }
  }, true);

  document.addEventListener("click", function (event) {
    var target = event.target;
    var control = target && target.closest
      ? target.closest("button, [role='button'], input[type='button'], input[type='submit']")
      : null;
    if (control) recordEngagement("action_click", control);
  }, true);
})();