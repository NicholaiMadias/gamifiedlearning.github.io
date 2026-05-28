import { Router } from "express";

const router = Router();

router.get("/listings", (req, res) => {
  res.json({
    module: "housing",
    listings: [
      {
        id: "1144",
        address: "1144 (example)",
        price: 950,
        status: "available"
      }
    ]
  });
});

export default router;
