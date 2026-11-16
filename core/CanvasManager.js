/* Vinit Simulation Hub — responsive canvas lifecycle manager. */
(function (root) {
  "use strict";

  class CanvasManager {
    constructor(canvas, options) {
      options = options || {};

      if (!canvas || typeof canvas.getContext !== "function") {
        throw new TypeError("CanvasManager requires a valid canvas element.");
      }

      this.canvas = canvas;
      this.container = options.container || canvas.parentElement || canvas;
      this.maxDpr = Number.isFinite(options.maxDpr) && options.maxDpr > 0
        ? options.maxDpr
        : 2;
      this.onResize = typeof options.onResize === "function"
        ? options.onResize
        : null;
      this.context = canvas.getContext("2d", options.contextAttributes);

      if (!this.context) {
        throw new Error("A 2D canvas context could not be created.");
      }

      this.width = 0;
      this.height = 0;
      this.dpr = 0;
      this.pixelWidth = 0;
      this.pixelHeight = 0;
      this.destroyed = false;

      this._resizeObserver = null;
      this._dprQuery = null;
      this._dprListener = null;

      this._handleWindowResize = this.resize.bind(this);
      this._handleDprChange = this._onDprChange.bind(this);

      if (typeof root.ResizeObserver === "function") {
        this._resizeObserver = new root.ResizeObserver(() => {
          this.resize();
        });
        this._resizeObserver.observe(this.container);
      }

      if (typeof root.addEventListener === "function") {
        root.addEventListener("resize", this._handleWindowResize, {
          passive: true
        });
      }

      this._watchDevicePixelRatio();
      this.resize();
    }

    _measureContentBox() {
      const rect = this.canvas.getBoundingClientRect();
      const style = typeof root.getComputedStyle === "function"
        ? root.getComputedStyle(this.canvas)
        : null;

      if (!style || !rect.width || !rect.height) {
        return {
          width: this.canvas.clientWidth || 0,
          height: this.canvas.clientHeight || 0
        };
      }

      const number = function (property) {
        return parseFloat(style.getPropertyValue(property)) || 0;
      };

      return {
        width: Math.max(
          0,
          rect.width -
            number("border-left-width") -
            number("border-right-width") -
            number("padding-left") -
            number("padding-right")
        ),
        height: Math.max(
          0,
          rect.height -
            number("border-top-width") -
            number("border-bottom-width") -
            number("padding-top") -
            number("padding-bottom")
        )
      };
    }

    resize() {
      if (this.destroyed) return false;

      const size = this._measureContentBox();
      if (size.width <= 0 || size.height <= 0) return false;

      const dpr = Math.min(Number(root.devicePixelRatio) || 1, this.maxDpr);
      const pixelWidth = Math.max(1, Math.round(size.width * dpr));
      const pixelHeight = Math.max(1, Math.round(size.height * dpr));

      const logicalSizeChanged =
        Math.abs(size.width - this.width) > 0.001 ||
        Math.abs(size.height - this.height) > 0.001;
      const dprChanged = dpr !== this.dpr;
      const backingSizeChanged =
        pixelWidth !== this.canvas.width ||
        pixelHeight !== this.canvas.height;

      if (!logicalSizeChanged && !dprChanged && !backingSizeChanged) {
        return false;
      }

      // Assign backing dimensions only when the required pixel dimensions differ.
      if (this.canvas.width !== pixelWidth) {
        this.canvas.width = pixelWidth;
      }
      if (this.canvas.height !== pixelHeight) {
        this.canvas.height = pixelHeight;
      }

      this.context.setTransform(dpr, 0, 0, dpr, 0, 0);

      this.width = size.width;
      this.height = size.height;
      this.dpr = dpr;
      this.pixelWidth = pixelWidth;
      this.pixelHeight = pixelHeight;

      if (this.onResize) {
        this.onResize({
          width: this.width,
          height: this.height,
          dpr: this.dpr,
          pixelWidth: this.pixelWidth,
          pixelHeight: this.pixelHeight
        });
      }

      return true;
    }

    _watchDevicePixelRatio() {
      if (typeof root.matchMedia !== "function") return;

      this._clearDevicePixelRatioWatcher();

      const currentDpr = Number(root.devicePixelRatio) || 1;
      this._dprQuery = root.matchMedia(
        "(resolution: " + currentDpr + "dppx)"
      );
      this._dprListener = this._handleDprChange;

      if (typeof this._dprQuery.addEventListener === "function") {
        this._dprQuery.addEventListener("change", this._dprListener);
      } else if (typeof this._dprQuery.addListener === "function") {
        this._dprQuery.addListener(this._dprListener);
      }
    }

    _clearDevicePixelRatioWatcher() {
      if (!this._dprQuery || !this._dprListener) return;

      if (typeof this._dprQuery.removeEventListener === "function") {
        this._dprQuery.removeEventListener("change", this._dprListener);
      } else if (typeof this._dprQuery.removeListener === "function") {
        this._dprQuery.removeListener(this._dprListener);
      }

      this._dprQuery = null;
      this._dprListener = null;
    }

    _onDprChange() {
      if (this.destroyed) return;
      this._watchDevicePixelRatio();
      this.resize();
    }

    destroy() {
      if (this.destroyed) return;

      this.destroyed = true;

      if (this._resizeObserver) {
        this._resizeObserver.disconnect();
        this._resizeObserver = null;
      }

      if (typeof root.removeEventListener === "function") {
        root.removeEventListener("resize", this._handleWindowResize);
      }

      this._clearDevicePixelRatioWatcher();
      this.onResize = null;
    }
  }

  root.CanvasManager = CanvasManager;
})(typeof window !== "undefined" ? window : globalThis);
