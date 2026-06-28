import { Router } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "fallback-secret";

function getUserFromToken(req: any): string | null {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as { username?: string };
    return decoded.username ?? null;
  } catch { return null; }
}
import { db } from "@workspace/db";
import { sessionsTable, reportsTable, logEntriesTable } from "@workspace/db";
import { count, sql } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dailySummaryRouter = Router();

function getDayRange(dateStr?: string): { since: Date; until: Date } {
  let since: Date;
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-").map(Number);
    since = new Date(y, m - 1, d, 0, 0, 0, 0);
  } else {
    since = new Date();
    since.setHours(0, 0, 0, 0);
  }
  const until = new Date(since);
  until.setDate(until.getDate() + 1);
  return { since, until };
}

dailySummaryRouter.get("/", async (req, res): Promise<void> => {
  try {
    const { since, until } = getDayRange(req.query.date as string | undefined);

    const todaySessions = await db.select().from(sessionsTable)
      .where(sql`${sessionsTable.createdAt} >= ${since} AND ${sessionsTable.createdAt} < ${until}`)
      .orderBy(sql`${sessionsTable.createdAt} desc`);

    const todayReports = await db.select().from(reportsTable)
      .where(sql`${reportsTable.createdAt} >= ${since} AND ${reportsTable.createdAt} < ${until}`)
      .orderBy(sql`${reportsTable.createdAt} desc`);

    const [logCountRow] = await db.select({ count: count() }).from(logEntriesTable)
      .where(sql`${logEntriesTable.createdAt} >= ${since} AND ${logEntriesTable.createdAt} < ${until}`);

    const stats = {
      totalSessions:    todaySessions.length,
      openSessions:     todaySessions.filter(s => s.status === "open").length,
      analyzedSessions: todaySessions.filter(s => s.status === "analyzed").length,
      closedSessions:   todaySessions.filter(s => s.status === "closed").length,
      totalReports:     todayReports.length,
      totalLogs:        Number(logCountRow?.count ?? 0),
      criticalReports:  todayReports.filter(r => r.severity === "critical").length,
      highReports:      todayReports.filter(r => r.severity === "high").length,
      truePositives:    todayReports.filter(r => r.verdict === "true_positive").length,
      falsePositives:   todayReports.filter(r => r.verdict === "false_positive").length,
      needInvestigation:todayReports.filter(r => r.verdict === "need_investigation").length,
    };

    res.json({
      date: since.toISOString().split("T")[0],
      stats,
      sessions: todaySessions.map(s => ({ id: s.id, title: s.title, status: s.status, createdBy: s.createdBy, createdAt: s.createdAt.toISOString() })),
      reports: todayReports.slice(0, 10).map(r => ({ id: r.id, sessionId: r.sessionId, severity: r.severity, verdict: r.verdict, summary: r.summary?.slice(0, 300) ?? "", mitreTechniques: r.mitreTechniques ?? [] })),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get daily summary data" });
  }
});

dailySummaryRouter.post("/generate", async (req, res): Promise<void> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) { res.status(400).json({ error: "GEMINI_API_KEY not configured" }); return; }

    const { since, until } = getDayRange(req.body?.date as string | undefined);
    const dateLabel = since.toISOString().split("T")[0];

    const todaySessions = await db.select().from(sessionsTable)
      .where(sql`${sessionsTable.createdAt} >= ${since} AND ${sessionsTable.createdAt} < ${until}`);

    const todayReports = await db.select().from(reportsTable)
      .where(sql`${reportsTable.createdAt} >= ${since} AND ${reportsTable.createdAt} < ${until}`);

    const [logCountRow] = await db.select({ count: count() }).from(logEntriesTable)
      .where(sql`${logEntriesTable.createdAt} >= ${since} AND ${logEntriesTable.createdAt} < ${until}`);

    const stats = {
      totalSessions:    todaySessions.length,
      analyzedSessions: todaySessions.filter(s => s.status === "analyzed").length,
      closedSessions:   todaySessions.filter(s => s.status === "closed").length,
      openSessions:     todaySessions.filter(s => s.status === "open").length,
      totalReports:     todayReports.length,
      totalLogs:        Number(logCountRow?.count ?? 0),
      criticalCount:    todayReports.filter(r => r.severity === "critical").length,
      highCount:        todayReports.filter(r => r.severity === "high").length,
      truePositives:    todayReports.filter(r => r.verdict === "true_positive").length,
      falsePositives:   todayReports.filter(r => r.verdict === "false_positive").length,
      needInvestigation:todayReports.filter(r => r.verdict === "need_investigation").length,
    };

    const reportContext = todayReports.slice(0, 15).map(r =>
      `- Session #${r.sessionId} | Severity: ${r.severity} | Verdict: ${r.verdict}\n  Summary: ${r.summary?.slice(0, 200) ?? "N/A"}\n  MITRE: ${Array.isArray(r.mitreTechniques) ? r.mitreTechniques.join(", ") : "N/A"}`
    ).join("\n");

    const prompt = `You are a senior SOC analyst. Generate a professional daily security operations summary report for ${dateLabel}.

STATISTICS:
- Total triage sessions: ${stats.totalSessions}
- Analyzed: ${stats.analyzedSessions} | Closed: ${stats.closedSessions} | Open: ${stats.openSessions}
- Total logs ingested: ${stats.totalLogs}
- Reports generated: ${stats.totalReports}
- Critical alerts: ${stats.criticalCount} | High: ${stats.highCount}
- True Positives: ${stats.truePositives} | False Positives: ${stats.falsePositives} | Need Investigation: ${stats.needInvestigation}

INCIDENT REPORTS:
${reportContext || "No reports generated for this date."}

Generate a structured daily SOC summary with these exact sections:
1. EXECUTIVE SUMMARY (2-3 sentences, suitable for management)
2. KEY FINDINGS (bullet points of main security events)
3. THREAT LANDSCAPE (patterns, techniques observed, MITRE ATT&CK coverage)
4. INCIDENT BREAKDOWN (brief on each significant incident)
5. FALSE POSITIVE ANALYSIS (any notable FP patterns)
6. RECOMMENDATIONS (immediate actions needed)
7. SHIFT HANDOVER NOTES (what the next shift should watch for)

Be concise, professional, and actionable. Use security terminology appropriate for L2/L3 analysts.`;

    const generatedBy = getUserFromToken(req);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const summaryText = result.response.text();

    res.json({
      date: dateLabel,
      generatedAt: new Date().toISOString(),
      generatedBy,
      stats,
      summary: summaryText,
      sessions: todaySessions.map(s => ({ id: s.id, title: s.title, status: s.status, createdBy: s.createdBy, createdAt: s.createdAt.toISOString() })),
      reports: todayReports.map(r => ({ id: r.id, sessionId: r.sessionId, severity: r.severity, verdict: r.verdict, summary: r.summary, mitreTechniques: r.mitreTechniques, createdAt: r.createdAt.toISOString() })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Failed to generate daily summary" });
  }
});
