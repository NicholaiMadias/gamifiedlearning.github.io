/**
 * diagnostics.js
 * Browser & DNS diagnostics for the Sovereign Matrix Diagnostics Console.
 */

/**
 * Collect synchronous browser / environment data.
 *
 * @returns {Record<string, string|boolean|number>}
 */
export function runBrowserDiagnostics() {
  const nav = window.navigator;
  return {
    userAgent:        nav.userAgent,
    platform:         nav.platform,
    language:         nav.language,
    cookiesEnabled:   nav.cookieEnabled,
    onLine:           nav.onLine,
    doNotTrack:       nav.doNotTrack === '1' || nav.doNotTrack === 'yes',
    hardwareConcurrency: nav.hardwareConcurrency ?? 'unknown',
    deviceMemoryGB:   nav.deviceMemory ?? 'unknown',
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth:       `${screen.colorDepth}-bit`,
    pixelRatio:       window.devicePixelRatio,
    viewportWidth:    window.innerWidth,
    viewportHeight:   window.innerHeight,
    timeZone:         Intl.DateTimeFormat().resolvedOptions().timeZone,
    connectionType:   nav.connection?.effectiveType ?? 'unknown',
    webGL: (() => {
      try {
        const c = document.createElement('canvas');
        return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
      } catch { return false; }
    })(),
    serviceWorker:   'serviceWorker' in nav,
    localStorage:    (() => { try { localStorage.setItem('_t','1'); localStorage.removeItem('_t'); return true; } catch { return false; } })(),
    indexedDB:       'indexedDB' in window,
    timestamp:       new Date().toISOString(),
  };
}

/**
 * Create an AbortSignal that fires after `ms` milliseconds.
 * Uses AbortSignal.timeout() when available, falls back to AbortController + setTimeout.
 *
 * @param {number} ms
 * @returns {AbortSignal}
 */
function timeoutSignal(ms) {
  if (typeof AbortSignal.timeout === 'function') return AbortSignal.timeout(ms);
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

/** Well-known hostnames to probe */
const DNS_TARGETS = [
  { host: 'amazinggracehl.org',    label: 'Main site' },
  { host: 'pages.github.com',      label: 'GitHub Pages' },
  { host: 'dns.google',            label: 'Google DNS' },
  { host: '8.8.8.8',               label: 'Google DNS (IP)' },
  { host: 'raw.githubusercontent.com', label: 'GitHub CDN' },
];

/**
 * Probe reachability of several hosts using fetch HEAD requests.
 * Because browsers block direct DNS lookups, we test HTTP reachability
 * as a practical proxy for DNS resolution.
 *
 * @returns {Promise<Array<{ host: string, label: string, reachable: boolean, latencyMs: number|null, error: string|null }>>}
 */
export async function runDnsTests() {
  const results = await Promise.all(
    DNS_TARGETS.map(async ({ host, label }) => {
      const url = `https://${host}/`;
      const t0  = performance.now();
      try {
        await fetch(url, {
          method: 'HEAD',
          mode:   'no-cors',
          cache:  'no-store',
          signal: timeoutSignal(5000),
        });
        return { host, label, reachable: true, latencyMs: Math.round(performance.now() - t0), error: null };
      } catch (err) {
        return { host, label, reachable: false, latencyMs: null, error: err.message };
      }
    })
  );
  return results;
}
