import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    module: "example",
    message: "Example module is online"
  });
});

export default router;
