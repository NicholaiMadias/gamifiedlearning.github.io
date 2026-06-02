(function () {
  const allowedHosts = new Set([
    "amazinggracehl.org",
    "www.amazinggracehl.org",
    "nicholaimadias.github.io",
  ]);

  function isHostedEnvironment() {
    return (
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      allowedHosts.has(window.location.hostname)
    );
  }

  function loadScript(src, attributes) {
    if (!isHostedEnvironment()) return null;

    const script = document.createElement("script");
    script.src = src;

    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        if (value === true) script.setAttribute(key, "");
        else if (value !== false && value != null) script.setAttribute(key, String(value));
      }
    }

    document.head.appendChild(script);
    return script;
  }

  function loadStylesheet(href, attributes) {
    if (!isHostedEnvironment()) return null;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;

    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        if (value === true) link.setAttribute(key, "");
        else if (value !== false && value != null) link.setAttribute(key, String(value));
      }
    }

    document.head.appendChild(link);
    return link;
  }

  window.AmazingGraceHostedOnly = {
    isHostedEnvironment,
    loadScript,
    loadStylesheet,
  };
})();

