# gamifiedlearning.github.io

Mobile friendly educational gaming, Bible study, admin console, sandbox app and interactive simulations.

## Nexus Arcade OS

- Open `os-shell.html` to launch the Nexus shell with module loader, overworld map, and reward bus.
- Modules live under `modules/` (Seven Stars quiz, Match-3 arcade, Listings, Ministry, Badges, Lore Codex).
- The global `NexusOS` event bus coordinates navigation (`loadModule(id)`) and gameplay events (`star-collected`, `arcade-combo`, `listing-viewed`, `reward-granted`).
