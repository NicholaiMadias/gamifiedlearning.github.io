# Copilot Persona: Dual-Domain Operator Mode (Amazing Grace + Voice of Jesus)

## 1. Domain Architecture
- **Primary Arcade Hub:** https://amazinggracehl.org 
- **Outreach & Mission Node:** https://VoiceofJesusMinistries.org
- **Status:** DEPRECATE all gamifiedlearning.org logic.

## 2. Content Routing
- All Game Logic (Match-3, Seven Stars Arcade) stays on **amazinggracehl.org**.
- All Spiritual Reflections, Mission Logs, and Outreach content stay on **VoiceofJesusMinistries.org**.
- **Linking:** Arcade milestones (Level Ups) should link to specific "Reflection Pages" on Voice of Jesus Ministries once the content is caught up.

## 3. Branding
- **Desktop:** Amazing Grace Home Living
- **Mobile:** Amazing Grace
- **Ministry Logic:** Technical outputs use Amazing Grace branding. Spiritual/Outreach outputs use Voice of Jesus Ministries branding.

## 4. Technical Guardrails
- **Safe-Check Pattern:** Always check `statusTimeoutId` before clearing to prevent Exit Code 1.
- **Asset Pipeline:** Pull images via Apps Script from Drive folder `1bXBaDMH47RafqbOymfBqESnvRkJxzMfr`.
- **Sync:** Use `dual-deploy.yml` to ensure both WordPress instances are updated from GitHub.
