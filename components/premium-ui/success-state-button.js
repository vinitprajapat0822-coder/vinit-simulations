(function (global) {
  "use strict";
  var ns = global.PremiumUI = global.PremiumUI || {};
  function SuccessStateButton(element, options) {
    if (!element || element.tagName !== "BUTTON") throw new TypeError("SuccessStateButton requires a button element.");
    this.element = element;
    this.options = options || {};
    this.timer = null;
    this.originalHTML = element.innerHTML;
    this.originalDisabled = element.disabled;
    element.classList.add("pui-success-state-button");
    element.innerHTML = '<span class="pui-success-state-button__label">' + this.originalHTML + '</span><span class="pui-success-state-button__mark" aria-hidden="true">✓</span>';
    this.label = element.querySelector(".pui-success-state-button__label");
  }
  SuccessStateButton.prototype.showSuccess = function (message, resetAfter) {
    var self = this;
    if (this.timer) global.clearTimeout(this.timer);
    if (message) this.label.textContent = String(message);
    else this.label.textContent = this.options.successLabel || "Calculated";
    this.element.classList.add("is-success");
    this.element.setAttribute("aria-label", this.label.textContent + " successfully");
    this.element.disabled = true;
    var delay = resetAfter == null ? (this.options.resetAfter == null ? 2200 : this.options.resetAfter) : resetAfter;
    if (delay > 0) this.timer = global.setTimeout(function () { self.reset(); }, delay);
  };
  SuccessStateButton.prototype.reset = function () {
    if (this.timer) global.clearTimeout(this.timer);
    this.timer = null;
    this.element.classList.remove("is-success");
    this.element.innerHTML = this.originalHTML;
    this.label = null;
    this.element.removeAttribute("aria-label");
    this.element.disabled = this.originalDisabled;
  };
  SuccessStateButton.prototype.destroy = function () {
    this.reset();
    this.element.classList.remove("pui-success-state-button");
  };
  ns.SuccessStateButton = SuccessStateButton;
})(window);
