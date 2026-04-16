/**
 * nexus-os.js — NexusOS global event bus.
 *
 * Provides a publish/subscribe event bus (window.NexusOS) and forwards
 * events to any iframe module panels registered via NexusOS.registerFrame().
 * Frames can relay events back to the shell via window.postMessage.
 */
(function () {
  'use strict';

  const _handlers = {};
  const _frames   = new Set();

  const NexusOS = {
    /**
     * Subscribe to an OS event.
     * @param {string}   event
     * @param {Function} fn
     */
    on(event, fn) {
      (_handlers[event] = _handlers[event] || []).push(fn);
    },

    /**
     * Remove a previously registered handler.
     * @param {string}   event
     * @param {Function} fn
     */
    off(event, fn) {
      if (!_handlers[event]) return;
      _handlers[event] = _handlers[event].filter(h => h !== fn);
    },

    /**
     * Emit an OS event, notifying local subscribers and all registered frames.
     * @param {string} event
     * @param {object} [data]
     */
    emit(event, data) {
      data = data || {};
      (_handlers[event] || []).forEach(fn => {
        try { fn(data); } catch (e) { console.warn('[NexusOS] handler error', e); }
      });
      var origin = window.location.origin || '*';
      _frames.forEach(frame => {
        try {
          frame.contentWindow.postMessage({ nexusEvent: event, data }, origin);
        } catch (_) { /* frame may not be ready yet */ }
      });
    },

    /**
     * Register an <iframe> element so it receives forwarded events.
     * @param {HTMLIFrameElement} frameEl
     */
    registerFrame(frameEl) {
      _frames.add(frameEl);
    },

    /**
     * Unregister an <iframe> element.
     * @param {HTMLIFrameElement} frameEl
     */
    unregisterFrame(frameEl) {
      _frames.delete(frameEl);
    },

    /** Alias kept for compatibility with older callers. */
    listen(event, fn) {
      return this.on(event, fn);
    },
  };

  // Re-emit events that arrive from registered child frames so that
  // other shell-level listeners (and other frames) also receive them.
  window.addEventListener('message', function (e) {
    if (e.data && typeof e.data.nexusEvent === 'string') {
      // Only re-emit if the source is one of our registered frames.
      let fromFrame = false;
      _frames.forEach(frame => {
        if (frame.contentWindow === e.source) fromFrame = true;
      });
      if (fromFrame) NexusOS.emit(e.data.nexusEvent, e.data.data);
    }
  });

  window.NexusOS = NexusOS;
}());
