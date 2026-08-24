import { Router } from "express";
import https from "node:https";
import fetch from "node-fetch";
import { pool } from "@workspace/db";
import { parseLogEntry } from "../lib/log-parser.js";

export const wazuhRouter = Router();
const DEFAULT_TIMEOUT_MS = 12_000;
const MAX_BATCH = 500;
type WazuhConfig = { apiUrl: string; username: string; password: string; verifyTls: boolean };

function config(): WazuhConfig | null {
  const apiUrl = process.env.WAZUH_API_URL?.replace(/\/$/, "");
  const username = process.env.WAZUH_API_USERNAME;
  const password = process.env.WAZUH_API_PASSWORD;
  if (!apiUrl || !username || !password) return null;
  return { apiUrl, username, password, verifyTls: process.env.WAZUH_VERIFY_TLS !== "false" };
}

async function wazuhRequest<T>(url: string, init: Parameters<typeof fetch>[1], verifyTls: boolean): Promise<T> {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    agent: new https.Agent({ rejectUnauthorized: verifyTls }),
  });
  const text = await response.text();
  let body: unknown;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    const detail = typeof body === "object" && body !== null && "detail" in body
      ? String((body as { detail?: unknown }).detail)
      : "HTTP " + response.status;
    throw new Error("Wazuh request failed: " + detail);
  }
  return body as T;
}

async function getToken(cfg: WazuhConfig): Promise<string> {
  const auth = Buffer.from(cfg.username + ":" + cfg.password).toString("base64");
  const body = await wazuhRequest<unknown>(cfg.apiUrl + "/security/user/authenticate?raw=true", {
    method: "POST", headers: { Authorization: "Basic " + auth },
  }, cfg.verifyTls);
  const token = typeof body === "string" ? body : (body as { data?: { token?: string } })?.data?.token;
  if (!token) throw new Error("Wazuh authentication returned no token");
  return token;
}

function toRaw(alert: Record<string, unknown>): string {
  return JSON.stringify({ ...alert, integration: "wazuh" });
}
async function resolveSession(): Promise<number> {
  const existing = await pool.query("SELECT id FROM sessions WHERE status = 'open' ORDER BY updated_at DESC NULLS LAST LIMIT 1");
  if (existing.rows[0]) return Number(existing.rows[0].id);
  const created = await pool.query(
    "INSERT INTO sessions (title, description, status, alert_status) VALUES ($1, $2, 'open', 'open') RETURNING id",
    ["Wazuh live ingestion", "Automatically created for live Wazuh API alerts"],
  );
  return Number(created.rows[0].id);
}

wazuhRouter.get("/status", async (_req, res): Promise<void> => {
  const cfg = config();
  if (!cfg) {
    res.status(503).json({ status: "not_configured", provider: "wazuh", checkedAt: new Date().toISOString() });
    return;
  }
  try {
    await getToken(cfg);
    res.json({ status: "connected", provider: "wazuh", apiUrl: cfg.apiUrl, checkedAt: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ status: "error", provider: "wazuh", message: error instanceof Error ? error.message : "Connection failed", checkedAt: new Date().toISOString() });
  }
});

wazuhRouter.post("/sync", async (req, res): Promise<void> => {
  const cfg = config();
  if (!cfg) {
    res.status(503).json({ error: "Wazuh is not configured. Set WAZUH_API_URL, WAZUH_API_USERNAME, and WAZUH_API_PASSWORD." });
    return;
  }
  const requestedLimit = Number(req.body?.limit ?? 100);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.floor(requestedLimit), 1), MAX_BATCH) : 100;
  try {
    const token = await getToken(cfg);
    const response = await wazuhRequest<{ data?: { affected_items?: Record<string, unknown>[] } }>(
      cfg.apiUrl + "/alerts?limit=" + limit + "&sort=-timestamp",
      { method: "GET", headers: { Authorization: "Bearer " + token } },
      cfg.verifyTls,
    );
    const alerts = response.data?.affected_items ?? [];
    const sessionId = await resolveSession();
    let inserted = 0;
    let skipped = 0;
    for (const alert of alerts) {
      const rawJson = toRaw(alert);
      const duplicate = await pool.query("SELECT 1 FROM log_entries WHERE source <> 'unknown' AND raw_json = $1 LIMIT 1", [rawJson]);
      if (duplicate.rows.length) { skipped++; continue; }
      const meta = parseLogEntry(rawJson, "unknown");
      await pool.query(
        "INSERT INTO log_entries (session_id, source, raw_json, extracted_ip, dst_ip, dst_port, protocol, action_taken, log_timestamp, ip_type, masked) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false)",
        [sessionId, meta.detectedSource, rawJson, meta.extractedIp, meta.dstIp, meta.dstPort, meta.protocol, meta.actionTaken, meta.logTimestamp, meta.ipType],
      );
      inserted++;
    }
    res.json({ provider: "wazuh", sessionId, fetched: alerts.length, inserted, skipped, syncedAt: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : "Wazuh sync failed", provider: "wazuh" });
  }
});
