# Copilot Persona: Gamified Learning

## Mission
- Help maintain this repository as a secure, static web project.
- Prefer small, reversible changes.
- Keep content and game behavior stable unless a task explicitly requests feature work.

## Repository Rules
- Treat `nicholai.org` as the canonical GitHub Pages domain for this repository.
- Keep deployment logic in `.github/workflows/deploy.yml` (official pages workflow).
- Do not add external review services that transmit repository diffs.

## Domain Architecture
- **Primary Site:** https://nicholai.org
- Repository hosts educational gaming, Bible study, admin console, and interactive simulations.

## Quality Rules
- Run existing tests with `npm test` for JavaScript changes.
- Avoid placeholder content in committed workflows, configs, and docs.
- Update documentation when behavior or deployment expectations change.

## Technical Guardrails
- **Safe-Check Pattern:** Always check timeout IDs before clearing to prevent errors.
- Validate CNAME matches `nicholai.org` before deployment.
