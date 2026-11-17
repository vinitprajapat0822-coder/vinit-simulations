(function (global) {
  "use strict";
  var ns = global.PremiumUI = global.PremiumUI || {};
  var labels = { ready: "Ready", calculating: "Calculating", error: "Error", success: "Success" };
  function StatusBadge(element, initialState) {
    if (!element) throw new TypeError("StatusBadge requires an element.");
    this.element = element;
    element.classList.add("pui-status-badge");
    element.setAttribute("role", "status");
    element.setAttribute("aria-live", "polite");
    this.setState(initialState || element.getAttribute("data-state") || "ready");
  }
  StatusBadge.prototype.setState = function (state, label) {
    var key = String(state).toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(labels, key)) throw new TypeError("Unknown status: " + state);
    this.element.setAttribute("data-state", key);
    this.element.textContent = label || labels[key];
  };
  StatusBadge.prototype.destroy = function () {
    this.element.classList.remove("pui-status-badge");
    this.element.removeAttribute("role");
    this.element.removeAttribute("aria-live");
    this.element.removeAttribute("data-state");
  };
  ns.StatusBadge = StatusBadge;
})(window);
