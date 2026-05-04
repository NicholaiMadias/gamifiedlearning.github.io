// diagnostics.js — network / DNS health checks

/**
 * Returns an AbortSignal that fires after `ms` milliseconds.
 * The underlying timer is cleared automatically once the signal aborts,
 * preventing orphaned timer handles.
 *
 * @param {number} ms
 * @returns {AbortSignal}
 */
function timeoutSignal(ms) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);

  // Cleanup to prevent orphan timers; { once: true } removes the listener after it fires
  controller.signal.addEventListener("abort", () => clearTimeout(id), { once: true });

  return controller.signal;
}

/**
 * Probe a hostname via the Google DNS-over-HTTPS API.
 *
 * @param {string} hostname
 * @returns {Promise<{host: string, ok: boolean, addresses: string[]}>}
 */
async function probeDns(hostname) {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`;
  try {
    const res = await fetch(url, { signal: timeoutSignal(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const addresses = (json.Answer || [])
      .filter(r => r.type === 1)
      .map(r => r.data);
    return { host: hostname, ok: true, addresses };
  } catch (err) {
    return { host: hostname, ok: false, addresses: [], error: err.message };
  }
}

const DNS_HOSTS = [
  "gamifiedlearning.org",
  "amazinggracehomeliving.com",
  "github.com"
];

/**
 * Run DNS reachability tests for all configured hosts and render results
 * into the element with id="dnsResults".
 */
async function runDnsTests() {
  const container = document.getElementById("dnsResults");
  if (container) {
    container.innerHTML = "<p>Running DNS tests…</p>";
  }

  const results = await Promise.all(DNS_HOSTS.map(probeDns));

  if (!container) return;

  container.innerHTML = results
    .map(r => {
      const status = r.ok ? "✅" : "❌";
      const detail = r.ok
        ? r.addresses.length ? r.addresses.join(", ") : "resolved (no A records)"
        : r.error || "failed";
      return `<p>${status} <strong>${r.host}</strong> — ${detail}</p>`;
    })
    .join("");
}
