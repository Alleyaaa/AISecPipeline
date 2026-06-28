import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import healthRouter from "./routes/health.js";
import { sessionsRouter } from "./routes/sessions.js";
import { logsRouter } from "./routes/logs.js";
import { correlationsRouter } from "./routes/correlations.js";
import { analyzeRouter } from "./routes/analyze.js";
import { reportsRouter } from "./routes/reports.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { dailySummaryRouter } from "./routes/dailySummary.js";
import { n8nConfigRouter } from "./routes/n8nConfig.js";
import { generalLimiter, authLimiter, logIngestionLimiter } from "./middlewares/rateLimiter.js";
import { logger } from "./lib/logger.js";

dotenv.config();

const app = express();

// Trust proxy — required for rate limiting behind Docker/nginx
const trustProxy = process.env.TRUST_PROXY;
if (trustProxy) app.set("trust proxy", trustProxy === "1" ? 1 : trustProxy);
const PORT = process.env.PORT || 5000;

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "same-site" },
    contentSecurityPolicy: false,
  })
);

// CORS — allow configured origins or all in dev
const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(
  cors({
    origin: allowedOrigin ? allowedOrigin : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing — enforce reasonable size limit to prevent memory exhaustion
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// ─── Auth routes — dedicated auth rate limiter (brute-force protection) ───
app.use("/api/auth", authLimiter, authRouter);

// ─── Admin user management ───
app.use("/api/users", usersRouter);

// ─── Health (no rate limit) ───
app.use("/api/health", healthRouter);
app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Main API — general rate limiter applied to all routes below ───
app.use("/api", generalLimiter);

// Sessions
app.use("/api/sessions", sessionsRouter);

// Log ingestion — has its own stricter limiter inside
app.use("/api/sessions", logIngestionLimiter, logsRouter);

// Correlations, analysis, reports
app.use("/api/sessions", correlationsRouter);
app.use("/api/sessions", analyzeRouter); // analyze endpoint has its own limiter inside
app.use("/api/reports", reportsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/daily-summary", dailySummaryRouter);
app.use("/api/n8n-config", n8nConfigRouter);

// ─── 404 catch-all ───
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, "SOC Triage API server started");
});
