/* Browser-global entry point. Load component scripts before this file. */
(function (global) {
  "use strict";
  var required = [
    "MagneticGlowButton",
    "GlassSimulationCard",
    "AdvancedParameterSlider",
    "ThinkingState",
    "SuccessStateButton",
    "StatusBadge",
    "FocusGlowInput",
    "HoldToConfirmButton"
  ];
  var missing = required.filter(function (name) {
    return typeof global.PremiumUI === "undefined" || typeof global.PremiumUI[name] !== "function";
  });
  if (missing.length) {
    throw new Error("PremiumUI components were not loaded: " + missing.join(", "));
  }
  global.PremiumUI.version = "1.0.0";
  global.PremiumUI.components = Object.freeze(required.slice());
})(window);
