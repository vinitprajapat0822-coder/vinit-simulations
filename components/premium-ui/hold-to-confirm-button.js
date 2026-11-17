(function (global) {
  "use strict";
  var ns = global.PremiumUI = global.PremiumUI || {};
  function HoldToConfirmButton(element, options) {
    if (!element || element.tagName !== "BUTTON") throw new TypeError("HoldToConfirmButton requires a button element.");
    this.element = element;
    this.options = options || {};
    this.duration = Math.max(400, Number(this.options.duration) || 1300);
    this.startedAt = 0;
    this.frame = 0;
    this.active = false;
    this.keyActive = false;
    this.keyboardSequence = false;
    this._pointerDown = this.start.bind(this);
    this._pointerUp = this.cancel.bind(this);
    this._keyDown = this._onKeyDown.bind(this);
    this._keyUp = this._onKeyUp.bind(this);
    this._click = this._onClick.bind(this);
    element.classList.add("pui-hold-to-confirm-button");
    element.setAttribute("aria-keyshortcuts", "Space Enter");
    element.addEventListener("pointerdown", this._pointerDown);
    element.addEventListener("pointerup", this._pointerUp);
    element.addEventListener("pointercancel", this._pointerUp);
    element.addEventListener("lostpointercapture", this._pointerUp);
    element.addEventListener("keydown", this._keyDown);
    element.addEventListener("keyup", this._keyUp);
    element.addEventListener("click", this._click);
  }
  HoldToConfirmButton.prototype._onClick = function (event) {
    if (event.detail === 0 && this.keyboardSequence) { this.keyboardSequence = false; return; }
    if (event.detail === 0 && !this.active) this._confirm();
  };
  HoldToConfirmButton.prototype._onKeyDown = function (event) {
    if ((event.code === "Space" || event.code === "Enter") && !event.repeat) {
      event.preventDefault();
      this.keyActive = true;
      this.keyboardSequence = true;
      this.start();
    }
  };
  HoldToConfirmButton.prototype._onKeyUp = function (event) {
    if (this.keyActive && (event.code === "Space" || event.code === "Enter")) {
      event.preventDefault();
      this.keyActive = false;
      this.cancel();
      var self = this;
      global.setTimeout(function () { self.keyboardSequence = false; }, 0);
    }
  };
  HoldToConfirmButton.prototype.start = function (event) {
    if (this.element.disabled || this.active) return;
    if (event && event.button != null && event.button !== 0) return;
    this.active = true;
    this.startedAt = global.performance.now();
    this.element.style.setProperty("--pui-hold-progress", "0deg");
    this.element.classList.add("is-holding");
    if (event && event.pointerId != null && this.element.setPointerCapture) {
      try { this.element.setPointerCapture(event.pointerId); } catch (ignore) {}
    }
    this._tick();
  };
  HoldToConfirmButton.prototype._tick = function () {
    var self = this;
    if (!this.active) return;
    var progress = Math.min(1, (global.performance.now() - this.startedAt) / this.duration);
    this.element.style.setProperty("--pui-hold-progress", (progress * 360).toFixed(1) + "deg");
    if (progress >= 1) {
      this.active = false;
      this.frame = 0;
      this.element.classList.remove("is-holding");
      this.element.style.setProperty("--pui-hold-progress", "360deg");
      this._confirm();
      return;
    }
    this.frame = global.requestAnimationFrame(function () { self._tick(); });
  };
  HoldToConfirmButton.prototype.cancel = function () {
    if (!this.active) return;
    this.active = false;
    if (this.frame) global.cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.element.classList.remove("is-holding");
    this.element.style.setProperty("--pui-hold-progress", "0deg");
  };
  HoldToConfirmButton.prototype._confirm = function () {
    if (this.frame) global.cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.active = false;
    this.element.classList.remove("is-holding");
    this.element.style.setProperty("--pui-hold-progress", "0deg");
    this.element.dispatchEvent(new CustomEvent("holdconfirm", { bubbles: true }));
    if (typeof this.options.onConfirm === "function") this.options.onConfirm();
  };
  HoldToConfirmButton.prototype.destroy = function () {
    this.cancel();
    this.element.removeEventListener("pointerdown", this._pointerDown);
    this.element.removeEventListener("pointerup", this._pointerUp);
    this.element.removeEventListener("pointercancel", this._pointerUp);
    this.element.removeEventListener("lostpointercapture", this._pointerUp);
    this.element.removeEventListener("keydown", this._keyDown);
    this.element.removeEventListener("keyup", this._keyUp);
    this.element.removeEventListener("click", this._click);
    this.element.classList.remove("pui-hold-to-confirm-button", "is-holding");
    this.element.style.removeProperty("--pui-hold-progress");
    this.element.removeAttribute("aria-keyshortcuts");
  };
  ns.HoldToConfirmButton = HoldToConfirmButton;
})(window);
