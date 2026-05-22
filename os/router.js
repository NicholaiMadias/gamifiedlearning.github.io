import { Router } from "express";
import exampleModule from "./modules/example.js";

const router = Router();

router.get("/status", (req, res) => {
  res.json({
    os: "Nexus",
    status: "operational",
    modules: ["example"]
  });
});

router.use("/example", exampleModule);

export default router;
