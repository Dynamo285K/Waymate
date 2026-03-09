import express from "express";
import { env } from "./config/env";
import { healthRouter } from "./modules/health/health.routes";

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
    res.json({ message: "Waymate API is running" });
});

app.use("/health", healthRouter);

app.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
});
