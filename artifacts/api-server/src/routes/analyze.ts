import { Router } from "express";
import { db, pool } from "@workspace/db";
import {
  sessionsTable,
  logEntriesTable,
  reportsTable,
  n8nConfigTable,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { AnalyzeSessionParams, AnalyzeSessionBody } from "@workspace/api-zod";
import { logger } from "../lib/logger.js";
import { maskIp, classifyIp, sanitizeLogForAi, HIGH_RISK_PORTS } from "../lib/ip-utils.js";
import { computeThreatScore, threatScoreToRisk } from "../lib/log-parser.js";
import { buildRestoreMap, restoreAiResult } from "../lib/restore-utils.js";
import { analyzeLimiter } from "../middlewares/rateLimiter.js";

export const analyzeRouter = Router();

type Verdict = "true_positive" | "false_positive" | "need_investigation";

interface AiReportResult {
  summary: string;
  severity: string;
  iocs: string[];
  recommendations: string[];
  attackVector?: string;
  affectedSystems: string[];
  mitreAttackTechniques: string[];
  verdict: Verdict;
  detailedFindings: string;
  technicalAnalysis: string;
  actionTaken: string;
}

/**
 * Build a sanitized, structured log payload to send to AI.
 * Masks IPs, redacts sensitive fields, masks internal identifiers.
 */
function buildSanitizedPayload(
  logs: (typeof logEntriesTable.$inferSelect)[],
  maskIps: boolean
) {
  return logs.map((l) => {
    let parsedObj: unknown;
    try {
      parsedObj = JSON.parse(l.rawJson);
    } catch {
      parsedObj = l.rawJson;
    }

    const sanitized = sanitizeLogForAi(parsedObj, maskIps);
    const srcIpDisplay = maskIps && l.extractedIp ? maskIp(l.extractedIp) : (l.extractedIp ?? "unknown");
    const dstIpDisplay = maskIps && l.dstIp ? maskIp(l.dstIp) : (l.dstIp ?? null);

    return {
      source: l.source,
      src_ip: srcIpDisplay,
      src_ip_type: l.ipType ?? classifyIp(l.extractedIp ?? ""),
      dst_ip: dstIpDisplay,
      dst_port: l.dstPort ?? null,
      dst_port_service: l.dstPort ? (HIGH_RISK_PORTS[l.dstPort] ?? null) : null,
      protocol: l.protocol ?? null,
      action: l.actionTaken ?? null,
      log_timestamp: l.logTimestamp ?? null,
      raw_log: sanitized,
    };
  });
}

/**
 * Build correlated IP threat context for the AI prompt.
 */
function buildCorrelationContext(
  logs: (typeof logEntriesTable.$inferSelect)[],
  maskIps: boolean
): string {
  const ipMap = new Map<string, typeof logs>();
  for (const log of logs) {
    const ip = log.extractedIp ?? "unknown";
    if (!ipMap.has(ip)) ipMap.set(ip, []);
    ipMap.get(ip)!.push(log);
  }

  const lines: string[] = [];
  for (const [ip, ipLogs] of ipMap.entries()) {
    const displayIp = maskIps ? maskIp(ip) : ip;
    const ipType = classifyIp(ip);
    const sources = [...new Set(ipLogs.map((l) => l.source))];
    const actions = ipLogs.map((l) => l.actionTaken);
    const ports = ipLogs.map((l) => l.dstPort);

    const score = computeThreatScore({
      logCount: ipLogs.length,
      uniqueSources: sources,
      actions,
      dstPorts: ports,
      ipType,
    });

    const riskLevel = threatScoreToRisk(score);
    const uniquePorts = [...new Set(ports.filter(Boolean))];
    const portServices = uniquePorts.map((p) => `${p}/${HIGH_RISK_PORTS[p!] ?? "unknown"}`);
    const blockedCount = actions.filter((a) => a === "blocked").length;
    const allowedCount = actions.filter((a) => a === "allowed").length;
    const detectedCount = actions.filter((a) => a === "detected").length;

    lines.push(
      `  IP: ${displayIp} (${ipType}) — Risk: ${riskLevel.toUpperCase()} (score: ${score}/100)\n` +
      `    Sources: ${sources.join(", ")} | Log count: ${ipLogs.length}\n` +
      `    Actions: blocked=${blockedCount}, allowed=${allowedCount}, detected=${detectedCount}\n` +
      (uniquePorts.length ? `    Destination ports: ${portServices.join(", ")}\n` : "")
    );
  }

  return lines.join("\n");
}

async function callN8nWebhook(
  webhookUrl: string,
  payload: object
): Promise<{ result: AiReportResult; executionId?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`n8n webhook returned ${response.status}: ${await response.text()}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    return {
      result: {
        summary: String(data.summary ?? "No summary provided"),
        severity: String(data.severity ?? "informational"),
        iocs: Array.isArray(data.iocs) ? (data.iocs as string[]) : [],
        recommendations: Array.isArray(data.recommendations) ? (data.recommendations as string[]) : [],
        attackVector: data.attackVector ? String(data.attackVector) : undefined,
        affectedSystems: Array.isArray(data.affectedSystems) ? (data.affectedSystems as string[]) : [],
        mitreAttackTechniques: Array.isArray(data.mitreAttackTechniques) ? (data.mitreAttackTechniques as string[]) : [],
        verdict: (data.verdict as Verdict) ?? "need_investigation",
        detailedFindings: String(data.detailedFindings ?? ""),
        technicalAnalysis: String(data.technicalAnalysis ?? ""),
        actionTaken: String(data.actionTaken ?? ""),
      },
      executionId: data.executionId ? String(data.executionId) : undefined,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function callAiGateway(
  logs: (typeof logEntriesTable.$inferSelect)[],
  maskIps: boolean,
  additionalContext?: string,
  modelName?: string
): Promise<AiReportResult> {
  // Try DB connector config first, then env var, then default (host.docker.internal for Docker)
  let routerUrl = process.env.AI_GATEWAY_URL;
  let apiKey = process.env.AI_GATEWAY_API_KEY;

  if (!routerUrl || !apiKey) {
    try {
      const result = await pool.query(
        `SELECT config FROM connectors WHERE name = $1 LIMIT 1`,
        ["9router_ai_gateway"]
      );
      if (result.rows.length > 0) {
        const config = result.rows[0].config;
        if (!routerUrl && config.url) routerUrl = config.url;
        if (!apiKey && config.apiKey) apiKey = config.apiKey;
      }
    } catch { /* ignore DB fallback errors */ }
  }

  if (!routerUrl) routerUrl = "http://host.docker.internal:20128/v1";
  if (!apiKey) apiKey = "hermes-power";

  const sanitizedLogs = buildSanitizedPayload(logs, maskIps);
  const correlationContext = buildCorrelationContext(logs, maskIps);
  logger.info({ sessionId: "ai-gateway-payload", sanitizedSample: sanitizedLogs[0], correlationContext }, "=== PAYLOAD SENT TO AI GATEWAY ===");

  const prompt = `You are an expert SOC (Security Operations Center) analyst with deep knowledge of threat hunting, incident response, and MITRE ATT&CK framework.

Analyze the following correlated security log data and produce a comprehensive threat assessment report.

## IP CORRELATION SUMMARY
${correlationContext}

## DETAILED LOG DATA (${sanitizedLogs.length} events)
${sanitizedLogs.map((l, i) =>
  `### Event ${i + 1} — Source: ${l.source.toUpperCase()} | Action: ${l.action ?? "unknown"}\n` +
  `- Source IP: ${l.src_ip} (${l.src_ip_type})\n` +
  (l.dst_ip ? `- Destination IP: ${l.dst_ip}\n` : "") +
  (l.dst_port ? `- Destination Port: ${l.dst_port}${l.dst_port_service ? ` (${l.dst_port_service})` : ""}\n` : "") +
  (l.protocol ? `- Protocol: ${l.protocol.toUpperCase()}\n` : "") +
  (l.log_timestamp ? `- Timestamp: ${l.log_timestamp}\n` : "") +
  `- Raw Log:\n\`\`\`json\n${JSON.stringify(l.raw_log, null, 2)}\n\`\`\``
).join("\n\n")}

${additionalContext ? `## ANALYST CONTEXT\n${additionalContext}\n\n` : ""}

## INSTRUCTIONS
Based on the above data, provide a structured threat assessment. Consider:
- Multi-source correlation patterns (same IP in FortiGate + WatchGuard + Agent = high confidence TRUE POSITIVE)
- Lateral movement indicators (SMB/RDP/WMI traffic to internal hosts)
- Credential access techniques (lsass access, SAM dump, Kerberoasting)
- Command and control patterns (unusual outbound connections, beaconing)
- Defense evasion (disabled logging, unusual process parents)
- Privilege escalation patterns

For the verdict field, use these criteria:
- "true_positive": Clear evidence of malicious activity, multiple correlated indicators, high-confidence attack chain
- "false_positive": Activity explained by legitimate use, known admin tools, authorized scanning, patch management, etc.
- "need_investigation": Ambiguous or partial indicators, requires further analysis or additional context

Respond ONLY with this exact JSON structure (no markdown, no code blocks, no extra text):
{
  "summary": "3-5 paragraph detailed narrative of findings, attack chain, and timeline. Include PIC/asset/period details if present.",
  "severity": "critical|high|medium|low|informational",
  "verdict": "true_positive|false_positive|need_investigation",
  "detailedFindings": "Specific technical findings: source process paths, parent-child relationships, affected hosts, IOC details",
  "technicalAnalysis": "SIEM context, rule matches, detection logic, correlation chain, why this triggered",
  "actionTaken": "Analyst verification steps recommended, process tree validation, isolation recommendations",
  "iocs": ["IP addresses", "file paths", "process names", "registry keys", "domains", "hashes as IOCs"],
  "recommendations": ["Specific actionable remediation steps ordered by priority"],
  "attackVector": "Brief description of primary attack vector",
  "affectedSystems": ["Use actual hostname if available in logs, fallback to IP. Example: ubuntu-db-prod01 (192.168.55.21)"],
  "mitreAttackTechniques": ["T1078 - Valid Accounts", "T1003 - OS Credential Dumping"]
}`;

  const response = await fetch(`${routerUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName || 'unlimited-stack',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`AI Gateway request failed with status ${response.status}: ${errorBody}`);
  }

  const result = await response.json();
  const text = result.choices[0].message.content.trim();

  let parsed: AiReportResult;
  try {
    parsed = JSON.parse(text) as AiReportResult;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Failed to parse AI response as JSON from AI Gateway");
    parsed = JSON.parse(match[0]) as AiReportResult;
  }

  const validVerdicts: Verdict[] = ["true_positive", "false_positive", "need_investigation"];
  const verdict: Verdict = validVerdicts.includes(parsed.verdict as Verdict)
    ? (parsed.verdict as Verdict)
    : "need_investigation";

  return {
    summary: String(parsed.summary ?? ""),
    severity: String(parsed.severity ?? "informational"),
    verdict,
    detailedFindings: String(parsed.detailedFindings ?? ""),
    technicalAnalysis: String(parsed.technicalAnalysis ?? ""),
    actionTaken: String(parsed.actionTaken ?? ""),
    iocs: Array.isArray(parsed.iocs) ? parsed.iocs : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    attackVector: parsed.attackVector ?? undefined,
    affectedSystems: Array.isArray(parsed.affectedSystems) ? parsed.affectedSystems : [],
    mitreAttackTechniques: Array.isArray(parsed.mitreAttackTechniques) ? parsed.mitreAttackTechniques : [],
  };
}

analyzeRouter.post("/:id/analyze", analyzeLimiter, async (req, res): Promise<void> => {
  const paramsParsed = AnalyzeSessionParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = AnalyzeSessionBody.safeParse(req.body);

  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const sessionId = paramsParsed.data.id;

  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, sessionId));

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  if (session.status === "analyzing") {
    res.status(409).json({ error: "Session is already being analyzed" });
    return;
  }

  const logs = await db
    .select()
    .from(logEntriesTable)
    .where(eq(logEntriesTable.sessionId, sessionId));

  if (logs.length === 0) {
    res.status(400).json({ error: "No logs in this session to analyze" });
    return;
  }

  await db
    .update(sessionsTable)
    .set({ status: "analyzing" })
    .where(eq(sessionsTable.id, sessionId));

  let aiResult: AiReportResult;
  let executionId: string | undefined;

  try {
    const [n8nRow] = await db
      .select()
      .from(n8nConfigTable)
      .orderBy(sql`${n8nConfigTable.id} desc`)
      .limit(1);
    const webhookUrl = n8nRow?.webhookUrl;

    if (webhookUrl) {
      logger.info({ sessionId, webhookUrl }, "Sending to n8n webhook for analysis");
      const sanitizedLogs = buildSanitizedPayload(logs, bodyParsed.data.maskIps);
      const n8nResult = await callN8nWebhook(webhookUrl, {
        sessionId,
        maskIps: bodyParsed.data.maskIps,
        additionalContext: bodyParsed.data.additionalContext,
        correlationContext: buildCorrelationContext(logs, bodyParsed.data.maskIps),
        logs: sanitizedLogs,
        logCount: logs.length,
        uniqueIps: [...new Set(logs.map((l) => l.extractedIp).filter(Boolean))].length,
      });
      aiResult = n8nResult.result;
      executionId = n8nResult.executionId;
    } else {
      logger.info({ sessionId }, "No n8n webhook configured, calling AI Gateway (9Router)");
      aiResult = await callAiGateway(
        logs,
        bodyParsed.data.maskIps,
        bodyParsed.data.additionalContext,
        bodyParsed.data.model
      );
    }
  } catch (err) {
    logger.error({ err, sessionId }, "AI analysis failed");
    await db
      .update(sessionsTable)
      .set({ status: "open" })
      .where(eq(sessionsTable.id, sessionId));
    res.status(500).json({
      error: `Analysis failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
    return;
  }

    // Restore masked values → original dari DB
  if (bodyParsed.data.maskIps) {
    const restoreMap = buildRestoreMap(logs, bodyParsed.data.maskIps);
    logger.info({ sessionId, restoreKeys: Object.keys(restoreMap) }, "Restoring masked values in AI result");
    aiResult = restoreAiResult(aiResult, restoreMap);
  }

  await db.delete(reportsTable).where(eq(reportsTable.sessionId, sessionId));

  const [report] = await db
    .insert(reportsTable)
    .values({
      sessionId,
      summary: aiResult.summary,
      severity: aiResult.severity,
      verdict: aiResult.verdict,
      detailedFindings: aiResult.detailedFindings || null,
      technicalAnalysis: aiResult.technicalAnalysis || null,
      actionTaken: aiResult.actionTaken || null,
      iocs: aiResult.iocs,
      recommendations: aiResult.recommendations,
      attackVector: aiResult.attackVector ?? null,
      affectedSystems: aiResult.affectedSystems,
      mitreAttackTechniques: aiResult.mitreAttackTechniques ?? [],
      rawAiResponse: JSON.stringify(aiResult),
      n8nExecutionId: executionId ?? null,
    })
    .returning();

  await db
    .update(sessionsTable)
    .set({ status: "analyzed" })
    .where(eq(sessionsTable.id, sessionId));

  res.json({
    id: report.id,
    sessionId: report.sessionId,
    summary: report.summary,
    severity: report.severity,
    verdict: report.verdict ?? "need_investigation",
    detailedFindings: report.detailedFindings ?? null,
    technicalAnalysis: report.technicalAnalysis ?? null,
    actionTaken: report.actionTaken ?? null,
    iocs: report.iocs,
    recommendations: report.recommendations,
    attackVector: report.attackVector ?? null,
    affectedSystems: report.affectedSystems,
    mitreAttackTechniques: report.mitreAttackTechniques ?? [],
    rawAiResponse: report.rawAiResponse,
    n8nExecutionId: report.n8nExecutionId ?? null,
    createdAt: report.createdAt.toISOString(),
  });
});
