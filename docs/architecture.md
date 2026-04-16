# Nexus Arcade OS v2.0 — Architecture

## Overview

Nexus Arcade OS is a client-side, event-driven application with no build step. All modules are plain HTML/CSS/JS files fetched dynamically by the OS shell.

## Core Concepts

### OS Shell (`os-shell.html`)
The top-level HTML document. Loads `os.css` and `os.js`. Provides the navigation bar and `#main-content` mount point.

### Module Loader (`os.js`)
```js
async function loadModule(id) {
  const html = await fetch(`modules/${id}.html`).then(r => r.text());
  document.getElementById('main-content').innerHTML = html;
}
```
Modules are fetched on demand. Each module's `.js` file is injected as a `<script type="module">` only once.

### Global Event Bus
```js
window.NexusOS = {
  events: {},
  on(event, fn)   { (this.events[event] ||= []).push(fn); },
  emit(event, data) { (this.events[event] || []).forEach(fn => fn(data)); }
};
```
All inter-module communication goes through `NexusOS.on` / `NexusOS.emit`.

## Unlock Chain

```
Seven Stars (all 7) → unlocks Arcade
Arcade Revelation    → unlocks Lore Codex
Badge: ruby_catalyst → unlocks Lore Codex
Combo Tier 4         → unlocks Mystery Meter
Mystery Meter 100%   → unlocks NPC Village
```

## Engine Scripts

| Script              | Responsibility                          |
|---------------------|-----------------------------------------|
| `reward-engine.js`  | Maps events to item/badge rewards       |
| `unlock-engine.js`  | Persists and emits node unlocks         |
| `fx-engine.js`      | Spawns particles on game events         |
| `combo-engine.js`   | Tracks combo count and tier changes     |
| `item-engine.js`    | Manages inventory in localStorage      |

## Data Layer

All persistent state is stored in `localStorage`:

| Key                    | Contents                          |
|------------------------|-----------------------------------|
| `nexus_seven_stars`    | Array of collected star names     |
| `nexus_badges_unlocked`| Array of badge IDs                |
| `nexus_lore_unlocked`  | Array of lore entry IDs           |
| `nexus_mystery_value`  | Mystery Meter percentage (0-100)  |
| `nexus_inventory`      | Object mapping item ID to count   |
| `nexus_unlocked_nodes` | Array of unlocked module IDs      |
| `nexus_quests_active`  | Array of active quest IDs         |

## Asset Pipeline

```
assets/
  sprites/
    gems/       SVG gem icons
    fx/         SVG effect icons
    badges/     SVG badge icons
    ui/         SVG UI icons
  audio/
    match.wav
    combo.wav
    revelation.mp3
  maps/
    overworld.svg
```
