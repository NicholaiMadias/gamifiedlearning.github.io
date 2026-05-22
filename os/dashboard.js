// os/dashboard.js
import os from "os";
import { bootState } from "./boot.js";

export function getDashboardState() {
  return {
    nexus: {
      boot: bootState,
      timestamp: new Date().toISOString()
    },
    system: {
      platform: os.platform(),
      release: os.release(),
      uptime: os.uptime(),
      load: os.loadavg(),
      memory: {
        total: os.totalmem(),
        free: os.freemem()
      }
    },
    modules: bootState.modulesLoaded
  };
}
