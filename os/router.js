import { Router } from "express";
import exampleModule from "./example.js";
import { getHUDState } from "./hud.js";

const router = Router();

router.get("/status", (req, res) => {
  res.json({
    os: "Nexus",
    status: "operational",
    modules: ["example"]
  });
});

router.get("/hud", (req, res) => {
  res.json(getHUDState());
});

router.use("/example", exampleModule);

export default router;
