(function (global) {
  "use strict";
  var ns = global.PremiumUI = global.PremiumUI || {};
  function GlassSimulationCard(element) {
    if (!element) throw new TypeError("GlassSimulationCard requires an element.");
    this.element = element;
    element.classList.add("pui-glass-simulation-card");
    var header = element.querySelector("[data-card-header]");
    var body = element.querySelector("[data-card-body]");
    var footer = element.querySelector("[data-card-footer]");
    if (header) header.classList.add("pui-glass-card__header");
    if (body) body.classList.add("pui-glass-card__body");
    if (footer) footer.classList.add("pui-glass-card__footer");
  }
  GlassSimulationCard.prototype.setSlot = function (slot, content) {
    var allowed = ["header", "body", "footer"];
    if (allowed.indexOf(slot) === -1) throw new TypeError("Slot must be header, body, or footer.");
    var selector = '[data-card-' + slot + ']';
    var node = this.element.querySelector(selector);
    if (!node) {
      node = global.document.createElement("div");
      node.setAttribute("data-card-" + slot, "");
      this.element.appendChild(node);
      node.classList.add("pui-glass-card__" + slot);
    }
    if (content && content.nodeType) {
      node.replaceChildren(content);
    } else {
      node.textContent = content == null ? "" : String(content);
    }
    return node;
  };
  GlassSimulationCard.prototype.destroy = function () {
    this.element.classList.remove("pui-glass-simulation-card");
    this.element.querySelectorAll("[data-card-header], [data-card-body], [data-card-footer]").forEach(function (node) {
      node.classList.remove("pui-glass-card__header", "pui-glass-card__body", "pui-glass-card__footer");
    });
  };
  ns.GlassSimulationCard = GlassSimulationCard;
})(window);
