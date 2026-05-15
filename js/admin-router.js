// admin-router.js — Vue Router guards for the admin dashboard

// Routes that are accessible without authentication
const PUBLIC_PATHS = [
  "/",
  "/index",
  "/index.html",
  "/games",
  "/games.html",
  "/listings",
  "/listings.html"
];

/**
 * Require the current user to have `role` before proceeding.
 * Redirects to /login if the session is missing or the role doesn't match.
 *
 * @param {string} role
 * @param {Function} next — Vue Router `next` callback
 */
function requireRole(role, next) {
  try {
    const user = JSON.parse(localStorage.getItem("adminUser") || "null");
    if (user && user.role === role) {
      return next();
    }
  } catch { /* ignore parse errors */ }

  return next({ path: "/login" });
}

// Attach guards only when Vue Router is available
if (typeof router !== "undefined") {
  router.beforeEach((to, from, next) => {
    if (PUBLIC_PATHS.includes(to.path)) {
      return next();
    }

    if (to.path.startsWith("/admin")) {
      return requireRole("admin", next);
    }

    // All other authenticated routes require any logged-in user
    try {
      const user = JSON.parse(localStorage.getItem("adminUser") || "null");
      if (user && user.token) {
        return next();
      }
    } catch { /* ignore */ }

    return next({ path: "/login" });
  });
}
