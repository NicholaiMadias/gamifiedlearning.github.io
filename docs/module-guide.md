# Module Guide

Every module in Nexus Arcade OS follows the same three-file pattern.

## File Structure

```
modules/
  {module-id}.html   — DOM markup (no <html>/<head>/<body>)
  {module-id}.css    — Scoped styles
  {module-id}.js     — Logic + event wiring
```

## HTML Template

```html
<div class="module-container" id="{module}-module">
  <h2 class="module-title">🔷 Module Name</h2>
  <p class="module-status" id="{module}-status">Default status message.</p>

  <!-- Module-specific content here -->
</div>
```

## CSS Template

```css
.{module}-container {
  /* Uses .module-container from os.css as base */
}

.{module}-title {
  font-size: 1.4rem;
  color: #00ff41;
}
```

Inject the stylesheet from your JS file:

```js
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'modules/{module}.css';
document.head.appendChild(link);
```

## JS Template

```js
console.log('[NexusOS] {module} module loaded');

// Inject stylesheet
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'modules/{module}.css';
document.head.appendChild(link);

// Listen for OS events
NexusOS.on('some-event', data => {
  console.log('Event received:', data);
});

// Emit OS events
NexusOS.emit('some-event', { key: 'value' });
```

## Registering a New Module

1. Add files: `modules/{id}.html`, `modules/{id}.css`, `modules/{id}.js`
2. Add a nav button in `os-shell.html`:
   ```html
   <button class="os-nav-btn" data-module="{id}">🔷 Name</button>
   ```
3. Optionally add an overworld node in `modules/overworld.html`
4. Wire unlock conditions in `scripts/unlock-engine.js`

## Unlock Pattern

To lock a module until a condition is met, use the `unlock` event:

```js
// In unlock-engine.js
NexusOS.on('my-trigger-event', () => {
  unlockNode('{module-id}');
});
```

The overworld map automatically updates locked/unlocked state based on `NexusOS.on('unlock', ...)`.

## Available OS Events

| Event                  | Payload                    | Emitted by          |
|------------------------|----------------------------|---------------------|
| `module-loaded`        | `{ id }`                   | os.js               |
| `navigate`             | `{ module }`               | overworld.js        |
| `star-collected`       | `{ star }`                 | seven-stars.js      |
| `star-collected:{name}`| `{ star }`                 | seven-stars.js      |
| `arcade-combo`         | `{ combo, tier, score }`   | arcade.js           |
| `combo-tier4`          | `{ combo, score }`         | arcade.js           |
| `revelation-achieved`  | `{}`                       | arcade.js           |
| `badge-earned`         | `{ badgeId }`              | badges.js           |
| `lore-unlock`          | `{ id }`                   | lore-codex.js       |
| `unlock`               | `{ node }`                 | unlock-engine.js    |
| `reward-granted`       | `{ item?, badge? }`        | reward-engine.js    |
| `inventory-updated`    | `{ itemId, quantity, ... }`| item-engine.js      |
| `mystery-meter-full`   | `{}`                       | mystery-meter.js    |
