# Nexus Arcade OS v2.0

A modular, event-driven gamified learning platform built as a static site for GitHub Pages.

## Live Site

[https://nicholai.org/os-shell.html](https://nicholai.org/os-shell.html)

## Features

- **Overworld Map** — Navigate between modules via an SVG node map
- **Seven Stars** — Collect the seven churches of Revelation to unlock deeper modules
- **Divine Revelation Engine** — A match-3 arcade powered by a combo + charge system
- **Lore Codex** — An expanding library of entries unlocked through gameplay
- **Mystery Meter** — A cross-domain progress gauge gating the NPC Village
- **Badge Room** — Animated badge display with unlock conditions
- **NPC Village** — Dialogue, quests, and lore drops from interactive characters
- **CRT + Particle FX** — Retro visual polish layer across the entire OS

## Getting Started

No build step required. All files are served as static assets.

```
# Clone and serve locally
git clone https://github.com/NicholaiMadias/gamifiedlearning.github.io
cd gamifiedlearning.github.io
# Open os-shell.html in a local server (e.g. VS Code Live Server or npx serve .)
```

## Folder Structure

```
├── os-shell.html        OS Shell entry point
├── os.css               Global styling + CRT overlay
├── os.js                Event bus + module loader + particles
├── modules/             Module HTML/CSS/JS
├── config/              JSON data files
├── scripts/             Engine scripts
├── assets/              Sprites, audio, maps
└── docs/                Documentation
```

## Architecture

See [architecture.md](architecture.md) for the full system design.

## Module Guide

See [module-guide.md](module-guide.md) for how to create new modules.
