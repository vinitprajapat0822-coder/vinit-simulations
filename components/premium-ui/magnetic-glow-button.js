(function (global) {
  "use strict";
  var ns = global.PremiumUI = global.PremiumUI || {};
  var reducedMotion = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function MagneticGlowButton(element, options) {
    if (!element || element.tagName !== "BUTTON") throw new TypeError("MagneticGlowButton requires a button element.");
    this.element = element;
    this.options = options || {};
    this.originalDisabled = element.disabled;
    element.classList.add("pui-magnetic-glow-button");
    element.setAttribute("data-pui-magnetic", "");
    this._onMove = this._onMove.bind(this);
    this._onLeave = this._onLeave.bind(this);
    this._onDown = this._onDown.bind(this);
    if (!reducedMotion && global.matchMedia && !global.matchMedia("(hover: none)").matches) {
      element.addEventListener("pointermove", this._onMove);
      element.addEventListener("pointerleave", this._onLeave);
    }
    element.addEventListener("pointerdown", this._onDown);
    if (this.options.disabled) this.setDisabled(true);
  }
  MagneticGlowButton.prototype._onMove = function (event) {
    var rect = this.element.getBoundingClientRect();
    var x = (event.clientX - rect.left) / rect.width;
    var y = (event.clientY - rect.top) / rect.height;
    var dx = (x - 0.5) * (this.options.strength || 7);
    var dy = (y - 0.5) * (this.options.strength || 7);
    this.element.style.setProperty("--pui-button-x", dx.toFixed(2) + "px");
    this.element.style.setProperty("--pui-button-y", dy.toFixed(2) + "px");
    this.element.style.setProperty("--pui-glow-x", (x * 100).toFixed(1) + "%");
    this.element.style.setProperty("--pui-glow-y", (y * 100).toFixed(1) + "%");
  };
  MagneticGlowButton.prototype._onLeave = function () {
    this.element.style.setProperty("--pui-button-x", "0px");
    this.element.style.setProperty("--pui-button-y", "0px");
  };
  MagneticGlowButton.prototype._onDown = function (event) {
    if (reducedMotion || this.element.disabled || this.element.getAttribute("aria-busy") === "true") return;
    var rect = this.element.getBoundingClientRect();
    var ripple = global.document.createElement("span");
    ripple.className = "pui-ripple";
    ripple.setAttribute("aria-hidden", "true");
    ripple.style.left = (event.clientX - rect.left) + "px";
    ripple.style.top = (event.clientY - rect.top) + "px";
    this.element.appendChild(ripple);
    ripple.addEventListener("animationend", function () { ripple.remove(); }, { once: true });
  };
  MagneticGlowButton.prototype.setLoading = function (loading) {
    var active = Boolean(loading);
    this.element.classList.toggle("is-loading", active);
    this.element.setAttribute("aria-busy", active ? "true" : "false");
    this.element.disabled = active || this.originalDisabled;
  };
  MagneticGlowButton.prototype.setDisabled = function (disabled) {
    this.originalDisabled = Boolean(disabled);
    this.element.disabled = this.originalDisabled || this.element.getAttribute("aria-busy") === "true";
  };
  MagneticGlowButton.prototype.destroy = function () {
    this.element.removeEventListener("pointermove", this._onMove);
    this.element.removeEventListener("pointerleave", this._onLeave);
    this.element.removeEventListener("pointerdown", this._onDown);
    this._onLeave();
    this.element.classList.remove("pui-magnetic-glow-button", "is-loading");
    this.element.removeAttribute("data-pui-magnetic");
    this.element.removeAttribute("aria-busy");
    this.element.disabled = this.originalDisabled;
  };
  ns.MagneticGlowButton = MagneticGlowButton;
})(window);
