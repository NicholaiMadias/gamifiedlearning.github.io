// os/hud.js
import os from "os";
import { bootState } from "./boot.js";

export function getHUDState() {
  return {
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
    nexus: {
      boot: bootState,
      timestamp: new Date().toISOString()
    }
  };
}
