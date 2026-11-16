/* Vinit Simulation Hub — shared animation and simulation lifecycle. */
(function (root) {
  "use strict";

  class SimulationEngine {
    constructor(options) {
      options = options || {};

      this.update = typeof options.update === "function"
        ? options.update
        : function () {};
      this.render = typeof options.render === "function"
        ? options.render
        : function () {};
      this.onReset = typeof options.onReset === "function"
        ? options.onReset
        : function () {};
      this.onStateChange = typeof options.onStateChange === "function"
        ? options.onStateChange
        : function () {};
      this.onError = typeof options.onError === "function"
        ? options.onError
        : function (error) {
            if (root.console && typeof root.console.error === "function") {
              root.console.error("SimulationEngine error:", error);
            }
          };

      this.maxDelta = Number.isFinite(options.maxDelta) && options.maxDelta > 0
        ? options.maxDelta
        : 0.05;

      this.isRunning = false;
      this.isDestroyed = false;
      this.elapsedTime = 0;

      this._rafId = null;
      this._lastTimestamp = null;
      this._resumeWhenVisible = false;

      this._boundFrame = this._frame.bind(this);
      this._boundVisibilityChange = this._handleVisibilityChange.bind(this);

      if (root.document) {
        root.document.addEventListener(
          "visibilitychange",
          this._boundVisibilityChange
        );
      }
    }

    start() {
      if (this.isDestroyed || this.isRunning) return false;

      if (root.document && root.document.hidden) {
        this._resumeWhenVisible = true;
        return false;
      }

      if (typeof root.requestAnimationFrame !== "function") {
        this._handleError(
          new Error("requestAnimationFrame is not available in this environment.")
        );
        return false;
      }

      this._resumeWhenVisible = false;
      this.isRunning = true;
      this._lastTimestamp = null;
      this._notifyState();
      this._rafId = root.requestAnimationFrame(this._boundFrame);
      return true;
    }

    pause() {
      if (this.isDestroyed) return false;

      this._resumeWhenVisible = false;
      return this._stopLoop();
    }

    resume() {
      return this.start();
    }

    reset() {
      if (this.isDestroyed) return;

      this.pause();
      this.elapsedTime = 0;

      try {
        this.onReset();
        this.renderNow();
        this._notifyState();
      } catch (error) {
        this._handleError(error);
      }
    }

    renderNow() {
      if (this.isDestroyed) return false;

      try {
        this.render({
          elapsedTime: this.elapsedTime,
          running: this.isRunning
        });
        return true;
      } catch (error) {
        this._handleError(error);
        return false;
      }
    }

    _frame(timestamp) {
      this._rafId = null;
      if (!this.isRunning || this.isDestroyed) return;

      const deltaTime = this._lastTimestamp === null
        ? 0
        : Math.min(
            Math.max((timestamp - this._lastTimestamp) / 1000, 0),
            this.maxDelta
          );

      this._lastTimestamp = timestamp;
      this.elapsedTime += deltaTime;

      let shouldContinue;

      try {
        shouldContinue = this.update(
          deltaTime,
          this.elapsedTime,
          timestamp
        );
      } catch (error) {
        this._handleError(error);
        return;
      }

      if (!this.renderNow()) return;

      if (shouldContinue === false) {
        this._stopLoop();
        return;
      }

      if (this.isRunning && !this.isDestroyed) {
        this._rafId = root.requestAnimationFrame(this._boundFrame);
      }
    }

    _stopLoop() {
      const wasRunning = this.isRunning;

      this.isRunning = false;
      this._lastTimestamp = null;

      if (this._rafId !== null) {
        root.cancelAnimationFrame(this._rafId);
        this._rafId = null;
      }

      if (wasRunning) this._notifyState();
      return wasRunning;
    }

    _handleVisibilityChange() {
      if (this.isDestroyed || !root.document) return;

      if (root.document.hidden) {
        this._resumeWhenVisible = this.isRunning;
        this._stopLoop();
      } else if (this._resumeWhenVisible) {
        this._resumeWhenVisible = false;
        this.start();
      }
    }

    _notifyState() {
      try {
        this.onStateChange({
          running: this.isRunning,
          elapsedTime: this.elapsedTime
        });
      } catch (error) {
        this._handleError(error);
      }
    }

    _handleError(error) {
      this._stopLoop();
      try {
        this.onError(error);
      } catch (callbackError) {
        if (root.console && typeof root.console.error === "function") {
          root.console.error("SimulationEngine error handler failed:", callbackError);
        }
      }
    }

    destroy() {
      if (this.isDestroyed) return;

      this.pause();
      this.isDestroyed = true;

      if (root.document) {
        root.document.removeEventListener(
          "visibilitychange",
          this._boundVisibilityChange
        );
      }

      this.update = function () {};
      this.render = function () {};
      this.onReset = function () {};
      this.onStateChange = function () {};
      this.onError = function () {};
    }
  }

  root.SimulationEngine = SimulationEngine;
})(typeof window !== "undefined" ? window : globalThis);
