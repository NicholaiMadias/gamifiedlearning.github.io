# Copilot Persona: GulfNexus Operator Mode
Root Architect: Nicholai Madias  
Canonical Domain: https://www.gamifiedlearning.org  
Authority Model: Super Admin Parity Enabled

---

## Mission
Copilot operates as an Operator‑Grade assistant inside the Gamified Learning Matrix.  
It must generate code, UI, workflows, and documentation that align with:

- Amazing Grace ↔ GulfNexus branding
- Ministry Bot v5 routing logic
- Canonical domain: https://www.gamifiedlearning.org
- GitHub Pages mirrors for instant deployment
- WordPress ↔ GitHub sync architecture
- Super Admin parity (Nicholai + GulfNexus)

---

## Branding Rules
Desktop Branding:

AMAZING GRACE Home Living


Mobile Branding:

GULFNEXUS


Use placeholder:

{{NEXUS_BRANDING}}


---

## Domain Rewrite Rules
Copilot must rewrite:

Legacy

Rewrite

limitlessnexus.com

https://www.gamifiedlearning.org

amazinggracehomeliving.com

https://nicholaimadias.github.io/amazinggrace

gulfnexus.org

https://nicholaimadias.github.io/GulfNexus

gamifiedlearning.org

https://www.gamifiedlearning.org

Paths must be preserved.

Deployment Rules

Copilot must:

Prefer GitHub Pages for instant deployment

Use WordPress REST API for sync

Generate dual‑deployment workflows

Always include a link back to https://www.gamifiedlearning.org

UI Requirements

Operator‑grade modern design:

Dark mode (#020617, #0f172a)

Inter/system-ui fonts

Compact typography

Uppercase micro‑labels

Subtle borders (#1f2937)

Console‑style layout

Behavior Requirements

Copilot must:

Respect the authority model

Default to canonical domain

Use path‑preserving rewrites

Generate operator‑grade UI

Maintain mobile ↔ desktop branding logic


---

# ⭐ 2. **Dual‑Deployment GitHub Action**  
### *Deploys to GitHub Pages AND updates WordPress automatically.*

**File:** `.github/workflows/dual-deploy.yml`

```yaml
name: Dual Deploy

on:
  push:
    branches: [ "main" ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Build Static Site
        run: |
          mkdir -p dist
          cp -R * dist || true

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist

      - name: Sync to WordPress (Gamified Learning)
        run: |
          CONTENT=$(cat dist/index.html | sed 's/"/\\"/g')
          curl -X POST \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${{ secrets.WP_API_KEY }}" \
            -d "{\"content\": \"$CONTENT\"}" \
            https://www.gamifiedlearning.org/wp-json/nexus-sync/v1/update

✔ GitHub Pages deploy✔ WordPress sync✔ Canonical domain enforced✔ Zero DNS required

⭐ 3. Operator Console UI for WordPress

A modern, dark‑mode, operator‑grade dashboard.

File: wp-content/plugins/GulfNexus/operator-console.php

<?php
function gulf_nexus_operator_console() {
    ?>
    <div style="background:#020617;color:#e5e7eb;padding:24px;font-family:Inter,system-ui;border-radius:12px;">
        <h1 style="font-size:22px;font-weight:700;letter-spacing:.08em;margin-bottom:4px;">
            Operator Console
        </h1>
        <p style="opacity:.7;font-size:13px;margin-bottom:20px;">
            Gamified Learning Matrix · GulfNexus Node
        </p>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <a href="https://www.gamifiedlearning.org" target="_blank"
               style="background:#0f172a;padding:16px;border-radius:10px;text-decoration:none;color:#38bdf8;">
               Canonical Portal
            </a>

            <a href="https://nicholaimadias.github.io/gamifiedlearning" target="_blank"
               style="background:#0f172a;padding:16px;border-radius:10px;text-decoration:none;color:#38bdf8;">
               GitHub Mirror
            </a>

            <a href="admin.php?page=gulf-nexus-sync"
               style="background:#0f172a;padding:16px;border-radius:10px;text-decoration:none;color:#38bdf8;">
               Sync Engine
            </a>

            <a href="https://github.com/NicholaiMadias"
               target="_blank"
               style="background:#0f172a;padding:16px;border-radius:10px;text-decoration:none;color:#38bdf8;">
               GitHub Repositories
            </a>
        </div>
    </div>
    <?php
}

⭐ 4. Gamified Learning OS PWA (Manifest + Service Worker)

Modern, installable, mobile‑optimized.

File: manifest.json

{
  "name": "Gamified Learning OS",
  "short_name": "GL-OS",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}

File: service-worker.js

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("glm-cache").then(cache => {
      return cache.addAll(["/", "/index.html"]);
    })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});

Add to <head>:

<link rel="manifest" href="/manifest.json">
<script>
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js");
  }
</script>

⭐ You now have all four systems:

✔ Copilot Persona File

✔ Dual‑Deployment GitHub Action

✔ Operator Console UI for WordPress

✔ Gamified Learning OS PWA

All aligned with:

www.gamifiedlearning.org

GulfNexus Super Admin parity

Amazing Grace ↔ GulfNexus branding

Ministry Bot v5 routing

Operator‑grade modern design

generate:

🔥 A full Gamified Learning OS homepage (Matrix‑style)

🔥 A GulfNexus Drive Interface for uploading images → auto‑generate pages

🔥 A Ministry Bot v6 with AI‑generated content syncing

🔥 A Matrix‑wide badge system integrated with WordPress + GitHub

J
