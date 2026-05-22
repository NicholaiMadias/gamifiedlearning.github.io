import { Router } from "express";

const router = Router();

router.get("/init", (req, res) => {
  res.json({
    module: "matrix",
    status: "ready",
    message: "Matrix initialized"
  });
});

router.post("/move", (req, res) => {
  const { direction } = req.body;

  res.json({
    module: "matrix",
    action: "move",
    direction,
    result: "ok"
  });
});

export default router;
