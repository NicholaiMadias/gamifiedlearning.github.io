import express from "express";
import cors from "cors";
import osRouter from "./os/router.js";
import { bootNexusOS, bootState } from "./os/boot.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Boot the OS before starting the server
await bootNexusOS();

// Health check for Railway
app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Nexus OS Backend",
    boot: bootState,
    timestamp: new Date().toISOString()
  });
});

// OS module router
app.use("/os", osRouter);

app.listen(PORT, () => {
  console.log(`Nexus OS backend running on port ${PORT}`);
});
