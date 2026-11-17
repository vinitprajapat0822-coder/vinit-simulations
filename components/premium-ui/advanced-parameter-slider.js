(function (global) {
  "use strict";
  var ns = global.PremiumUI = global.PremiumUI || {};
  function AdvancedParameterSlider(input, options) {
    if (!input || input.type !== "range") throw new TypeError("AdvancedParameterSlider requires an input[type=range].");
    this.input = input;
    this.options = options || {};
    this.container = input.closest("[data-pui-slider]") || input.parentElement;
    this.container.classList.add("pui-slider");
    this.tooltip = this.container.querySelector("[data-slider-tooltip]");
    if (!this.tooltip) {
      this.tooltip = global.document.createElement("output");
      this.tooltip.className = "pui-slider__tooltip";
      this.tooltip.setAttribute("data-slider-tooltip", "");
      this.container.appendChild(this.tooltip);
    }
    this._update = this.update.bind(this);
    input.addEventListener("input", this._update);
    input.addEventListener("change", this._update);
    global.addEventListener("resize", this._update);
    this.update();
  }
  AdvancedParameterSlider.prototype.update = function () {
    var min = Number(this.input.min || 0);
    var max = Number(this.input.max || 100);
    var value = Number(this.input.value);
    var ratio = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;
    var format = this.options.format || function (number) { return String(number); };
    this.tooltip.textContent = format(value);
    this.tooltip.value = format(value);
    this.input.style.setProperty("--pui-slider-fill", (ratio * 100).toFixed(2) + "%");
    this.tooltip.style.left = (this.input.offsetLeft + 9 + ratio * Math.max(0, this.input.clientWidth - 18)) + "px";
    this.input.setAttribute("aria-valuetext", format(value));
    var outputSelector = this.input.getAttribute("data-value-output");
    if (outputSelector) {
      var output = global.document.querySelector(outputSelector);
      if (output) output.textContent = format(value);
    }
  };
  AdvancedParameterSlider.prototype.setValue = function (value) {
    var min = Number(this.input.min || 0);
    var max = Number(this.input.max || 100);
    this.input.value = String(Math.max(min, Math.min(max, Number(value))));
    this.update();
    this.input.dispatchEvent(new Event("input", { bubbles: true }));
  };
  AdvancedParameterSlider.prototype.destroy = function () {
    this.input.removeEventListener("input", this._update);
    this.input.removeEventListener("change", this._update);
    global.removeEventListener("resize", this._update);
    this.input.style.removeProperty("--pui-slider-fill");
    this.container.classList.remove("pui-slider");
    if (this.tooltip && this.tooltip.hasAttribute("data-slider-tooltip")) this.tooltip.remove();
  };
  ns.AdvancedParameterSlider = AdvancedParameterSlider;
})(window);
