import { Router } from "express";
import { db } from "@workspace/db";
import { reportsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { GetReportParams, DeleteReportParams } from "@workspace/api-zod";

export const reportsRouter = Router();

function serializeReport(r: typeof reportsTable.$inferSelect) {
  return {
    id: r.id,
    sessionId: r.sessionId,
    summary: r.summary,
    severity: r.severity,
    verdict: r.verdict ?? "need_investigation",
    detailedFindings: r.detailedFindings ?? null,
    technicalAnalysis: r.technicalAnalysis ?? null,
    actionTaken: r.actionTaken ?? null,
    iocs: r.iocs,
    recommendations: r.recommendations,
    attackVector: r.attackVector ?? null,
    affectedSystems: r.affectedSystems,
    mitreAttackTechniques: r.mitreAttackTechniques ?? [],
    rawAiResponse: r.rawAiResponse,
    n8nExecutionId: r.n8nExecutionId ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

reportsRouter.get("/", async (req, res): Promise<void> => {
  const reports = await db
    .select()
    .from(reportsTable)
    .orderBy(sql`${reportsTable.createdAt} desc`);
  res.json(reports.map(serializeReport));
});

reportsRouter.get("/:id", async (req, res): Promise<void> => {
  const parsed = GetReportParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [report] = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.id, parsed.data.id));

  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json(serializeReport(report));
});

reportsRouter.patch("/:id/verdict", async (req, res): Promise<void> => {
  const parsed = GetReportParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { verdict } = req.body as { verdict?: string };
  const validVerdicts = ["true_positive", "false_positive", "need_investigation"];
  if (!verdict || !validVerdicts.includes(verdict)) {
    res.status(400).json({ error: "Invalid verdict. Must be true_positive, false_positive, or need_investigation" });
    return;
  }

  const [report] = await db
    .update(reportsTable)
    .set({ verdict })
    .where(eq(reportsTable.id, parsed.data.id))
    .returning();

  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json(serializeReport(report));
});

reportsRouter.delete("/:id", async (req, res): Promise<void> => {
  const parsed = DeleteReportParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(reportsTable).where(eq(reportsTable.id, parsed.data.id));
  res.status(204).send();
});
