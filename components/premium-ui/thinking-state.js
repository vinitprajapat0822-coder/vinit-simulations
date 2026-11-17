(function (global) {
  "use strict";
  var ns = global.PremiumUI = global.PremiumUI || {};
  function ThinkingState(element, options) {
    if (!element) throw new TypeError("ThinkingState requires an element.");
    this.element = element;
    this.options = options || {};
    this.element.classList.add("pui-thinking-state");
    this.element.classList.toggle("pui-thinking-state--overlay", this.options.mode === "overlay" || element.getAttribute("data-mode") === "overlay");
    this.element.setAttribute("role", "status");
    this.element.setAttribute("aria-live", "polite");
    this.element.setAttribute("aria-atomic", "true");
    if (!element.querySelector(".pui-thinking-state__ring")) {
      var ring = global.document.createElement("span");
      ring.className = "pui-thinking-state__ring";
      ring.setAttribute("aria-hidden", "true");
      element.insertBefore(ring, element.firstChild);
    }
    if (!element.querySelector(".pui-thinking-state__dots")) {
      var dots = global.document.createElement("span");
      dots.className = "pui-thinking-state__dots";
      dots.setAttribute("aria-hidden", "true");
      dots.innerHTML = "<span></span><span></span><span></span>";
      element.appendChild(dots);
    }
    if (this.options.visible !== true) element.hidden = true;
  }
  ThinkingState.prototype.show = function (message) {
    if (message != null) {
      var text = this.element.querySelector("[data-thinking-text]");
      if (text) text.textContent = String(message);
      else this.element.setAttribute("aria-label", String(message));
    }
    this.element.hidden = false;
    this.element.setAttribute("aria-busy", "true");
  };
  ThinkingState.prototype.hide = function () {
    this.element.hidden = true;
    this.element.setAttribute("aria-busy", "false");
  };
  ThinkingState.prototype.setText = function (message) {
    var text = this.element.querySelector("[data-thinking-text]");
    if (text) text.textContent = String(message);
    this.element.setAttribute("aria-label", String(message));
  };
  ThinkingState.prototype.destroy = function () {
    this.element.classList.remove("pui-thinking-state", "pui-thinking-state--overlay");
    this.element.removeAttribute("aria-busy");
  };
  ns.ThinkingState = ThinkingState;
})(window);
