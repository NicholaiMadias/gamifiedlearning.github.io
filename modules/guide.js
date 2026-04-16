/**
 * guide.js — Nexus Guide in-universe AI companion.
 *
 * When embedded as an iframe inside os-shell.html the guide receives
 * NexusOS events via window.postMessage forwarded by the shell.
 * It can also emit events back to the shell via postMessage.
 *
 * When opened standalone (e.g. for development) a local stub is used.
 */
(function () {
  'use strict';

  /* ── DOM ──────────────────────────────────────────────────── */
  const guideLog   = document.getElementById('guide-log');
  const guideInput = document.getElementById('guide-input');
  const guideSend  = document.getElementById('guide-send');

  /* ── NexusOS bridge ──────────────────────────────────────── */
  // When running inside the shell iframe, events arrive as postMessages.
  // When standalone, fall back to a no-op stub so the file still loads.
  const _msgHandlers = {};

  const NexusOS = {
    on(event, fn) {
      (_msgHandlers[event] = _msgHandlers[event] || []).push(fn);
    },
    emit(event, data) {
      data = data || {};
      // Relay back to the parent shell, restricted to the same origin.
      if (window.parent && window.parent !== window) {
        var targetOrigin = window.location.origin || '*';
        window.parent.postMessage({ nexusEvent: event, data }, targetOrigin);
      }
    },
  };

  // Receive forwarded OS events from the parent shell.
  window.addEventListener('message', function (e) {
    if (!e.data || typeof e.data.nexusEvent !== 'string') return;
    const fns = _msgHandlers[e.data.nexusEvent] || [];
    fns.forEach(function (fn) {
      try { fn(e.data.data || {}); } catch (_) {}
    });
  });

  /* ── Print helpers ───────────────────────────────────────── */
  function guidePrint(text, type) {
    type = type || 'system';
    var div = document.createElement('div');
    div.className = 'guide-msg ' + type;
    div.textContent = text;
    guideLog.appendChild(div);
    guideLog.scrollTop = guideLog.scrollHeight;
  }

  /* ── User Q&A ────────────────────────────────────────────── */
  function guideHandleUser(text) {
    guidePrint('> ' + text, 'user');

    var t = text.toLowerCase();

    if (t.includes('quest')) {
      NexusOS.emit('guide-request', { topic: 'quest' });
      guidePrint('Current quests are tracked in the Quest Log. Focus on the highlighted step in the HUD.');
      return;
    }

    if (t.includes('stars') || t.includes('seven')) {
      guidePrint('The Seven Stars module teaches you through the churches. Start there if you seek foundations.');
      return;
    }

    if (t.includes('arcade') || t.includes('combo')) {
      guidePrint('The Divine Revelation Engine rewards long combo chains. Aim for Tier 3 and Tier 4 for real power.');
      return;
    }

    if (t.includes('badge')) {
      guidePrint('Badges reflect milestones. Visit the Badge Room to see what you\'ve already awakened.');
      return;
    }

    if (t.includes('where') && t.includes('start')) {
      guidePrint('Begin with the Overworld. Follow the unlocked nodes in order: Seven Stars → Arcade → Lore → Mystery.');
      return;
    }

    if (t.includes('score') || t.includes('point')) {
      guidePrint('Every matched tile earns points. Chain reactions multiply your gain. Level up to extend your moves.');
      return;
    }

    if (t.includes('help')) {
      guidePrint('You may ask about: quests, stars, arcade, combos, badges, score, or where to start.');
      return;
    }

    guidePrint('I don\'t have a direct answer for that yet, but the Overworld and HUD will point you forward.');
  }

  /* ── Input handlers ──────────────────────────────────────── */
  guideSend.onclick = function () {
    var text = guideInput.value.trim();
    if (!text) return;
    guideInput.value = '';
    guideHandleUser(text);
  };

  guideInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') guideSend.click();
  });

  /* ── Reactive OS-event hints ─────────────────────────────── */
  NexusOS.on('star-collected', function (d) {
    guidePrint('You\'ve claimed a star at ' + (d.church || 'a sacred site') + '. The Lore Codex may now hold something new.', 'event');
  });

  NexusOS.on('badge-earned', function (d) {
    var id = d.badgeId || d.badge || 'unknown';
    guidePrint('A new badge (' + id + ') has awakened. Check the Badge Room to see its form.', 'event');
  });

  NexusOS.on('quest-started', function (d) {
    guidePrint('A new quest has begun (' + (d.id || '?') + '). Watch the HUD for your next step.', 'event');
  });

  NexusOS.on('quest-completed', function (d) {
    guidePrint('Quest completed (' + (d.id || '?') + '). The Mystery Meter and Overworld may have shifted.', 'event');
  });

  NexusOS.on('arcade-combo', function (d) {
    var tier = d.tier || 1;
    if (tier >= 2) {
      guidePrint('Combo Tier ' + tier + ' achieved — the board is bending in your favour.', 'event');
    }
  });

  NexusOS.on('combo-tier4', function () {
    guidePrint('You\'ve reached Combo Tier 4. This is where the board truly bends in your favour.', 'event');
  });

  /* ── Initial greeting ────────────────────────────────────── */
  guidePrint('Nexus Guide online. Ask about quests, stars, arcade, badges, or where to start.');
}());
