import { Router } from "express";
import exampleModule from "./modules/example.js";
import { getHUDState } from "./hud.js";

const router = Router();

router.get("/status", (req, res) => {
  res.json({
    os: "Nexus",
    status: "operational",
    modules: ["example"]
  });
});

// HUD endpoint
router.get("/hud", (req, res) => {
  res.json(getHUDState());
});

router.use("/example", exampleModule);

export default router;
