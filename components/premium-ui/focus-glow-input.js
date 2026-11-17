(function (global) {
  "use strict";
  var ns = global.PremiumUI = global.PremiumUI || {};
  function FocusGlowInput(input) {
    if (!input || !/^(INPUT|TEXTAREA)$/.test(input.tagName)) throw new TypeError("FocusGlowInput requires an input or textarea.");
    this.input = input;
    input.classList.add("pui-focus-glow-input");
  }
  FocusGlowInput.prototype.destroy = function () {
    this.input.classList.remove("pui-focus-glow-input");
  };
  ns.FocusGlowInput = FocusGlowInput;
})(window);
