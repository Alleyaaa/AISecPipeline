import { useParams, Link } from "wouter";
import { useGetReport, getGetReportQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/ui/badges";
import { ArrowLeft, Target, Shield, Server, FileText, Crosshair, CheckCircle2, XCircle, HelpCircle, ClipboardList, Microscope, Cpu, Wrench, Download } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

const MITRE_TACTIC_COLORS: Record<string, string> = {
  "T1078": "bg-red-500/10 text-red-400 border-red-500/30",
  "T1003": "bg-red-500/10 text-red-400 border-red-500/30",
  "T1059": "bg-orange-500/10 text-orange-400 border-orange-500/30",
  "T1055": "bg-orange-500/10 text-orange-400 border-orange-500/30",
  "T1021": "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  "T1110": "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
};

function getMitreColor(technique: string): string {
  const tid = technique.match(/T\d{4}/)?.[0];
  return tid && MITRE_TACTIC_COLORS[tid]
    ? MITRE_TACTIC_COLORS[tid]
    : "bg-primary/10 text-primary border-primary/20";
}

type Verdict = "true_positive" | "false_positive" | "need_investigation";

const VERDICT_CONFIG: Record<Verdict, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  true_positive: {
    label: "TRUE POSITIVE",
    color: "text-red-400 border-red-500/50",
    bg: "bg-red-500/10",
    icon: <XCircle className="h-4 w-4 text-red-400" />,
  },
  false_positive: {
    label: "FALSE POSITIVE",
    color: "text-green-400 border-green-500/50",
    bg: "bg-green-500/10",
    icon: <CheckCircle2 className="h-4 w-4 text-green-400" />,
  },
  need_investigation: {
    label: "NEED INVESTIGATION",
    color: "text-yellow-400 border-yellow-500/50",
    bg: "bg-yellow-500/10",
    icon: <HelpCircle className="h-4 w-4 text-yellow-400" />,
  },
};

function VerdictBadge({ verdict }: { verdict: string | null | undefined }) {
  const key = (verdict ?? "need_investigation") as Verdict;
  const cfg = VERDICT_CONFIG[key] ?? VERDICT_CONFIG.need_investigation;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold font-mono border px-2.5 py-1 rounded ${cfg.color} ${cfg.bg}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const reportId = parseInt(id || "0", 10);
  const { token } = useAuth();

  const { data: report, isLoading, refetch } = useGetReport(reportId, {
    query: { enabled: !!reportId, queryKey: getGetReportQueryKey(reportId) },
  });

  const [verdictLoading, setVerdictLoading] = useState(false);

  const handleVerdictChange = async (newVerdict: Verdict) => {
    if (!token) return;
    setVerdictLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/verdict`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ verdict: newVerdict }),
      });
      if (!res.ok) throw new Error("Failed to update verdict");
      toast.success("Verdict updated");
      refetch();
    } catch {
      toast.error("Failed to update verdict");
    } finally {
      setVerdictLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center text-muted-foreground">Report not found.</div>
    );
  }

  const mitreAttackTechniques = report.mitreAttackTechniques ?? [];
  const currentVerdict = (report.verdict ?? "need_investigation") as Verdict;
  const verdictCfg = VERDICT_CONFIG[currentVerdict] ?? VERDICT_CONFIG.need_investigation;

  const exportPDF = () => {
    if (!report) return;
    const sev = (report.severity ?? "unknown") as string;
    const sevBg: Record<string,string> = { critical:"#fee2e2", high:"#ffedd5", medium:"#fef9c3", low:"#dcfce7", informational:"#eff6ff" };
    const sevFg: Record<string,string> = { critical:"#dc2626", high:"#ea580c", medium:"#ca8a04", low:"#16a34a", informational:"#2563eb" };
    const verdictLabel = report.verdict === "true_positive" ? "TRUE POSITIVE"
      : report.verdict === "false_positive" ? "FALSE POSITIVE" : "NEED INVESTIGATION";
    const esc = (s: string) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const sect = (title: string, body?: string | null) => !body?.trim() ? "" :
      "<div class=\"sec\"><div class=\"sec-title\">" + title + "</div>"
      + "<div class=\"box\">" + esc(body) + "</div></div>";

    const mitreTags = Array.isArray(report.mitreTechniques) && report.mitreTechniques.length > 0
      ? "<div class=\"sec\"><div class=\"sec-title\">MITRE ATT&amp;CK</div><div class=\"tags\">"
        + (report.mitreTechniques as string[]).map(t => "<span>" + esc(t) + "</span>").join("") + "</div></div>"
      : "";
    const iocTags = Array.isArray((report as any).iocList) && (report as any).iocList.length > 0
      ? "<div class=\"sec\"><div class=\"sec-title\">IOCs</div><div class=\"iocs\">"
        + ((report as any).iocList as string[]).map((i: string) => "<span>" + esc(i) + "</span>").join("") + "</div></div>"
      : "";

    const css = [
      "*{margin:0;padding:0;box-sizing:border-box}",
      "body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#1a1a2e}",
      ".hdr{background:linear-gradient(135deg,#0f0f23,#1a1a3e);color:#fff;padding:28px 36px}",
      ".hdr h1{font-size:20px;font-weight:700;letter-spacing:1px;text-transform:uppercase}",
      ".hdr .meta{color:#a0aec0;font-size:11px;margin-top:6px;font-family:monospace}",
      ".body{padding:28px 36px}",
      ".badges{display:flex;gap:10px;align-items:center;margin-bottom:24px;flex-wrap:wrap}",
      ".badge{padding:3px 12px;border-radius:99px;font-size:11px;font-weight:700;font-family:monospace}",
      ".sec{margin-bottom:22px}",
      ".sec-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#475569;border-bottom:2px solid #e2e8f0;padding-bottom:6px;margin-bottom:12px}",
      ".box{background:#f8fafc;border-left:3px solid #6366f1;padding:14px;border-radius:0 6px 6px 0;line-height:1.7;color:#334155;white-space:pre-wrap;font-size:12px}",
      ".tags span,.iocs span{display:inline-block;font-family:monospace;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;margin:2px}",
      ".tags span{background:#e0e7ff;color:#4338ca}",
      ".iocs span{background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;font-weight:normal}",
      ".footer{margin-top:32px;padding-top:12px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:10px;text-align:center}",
      "@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}",
    ].join("");

    const html =
      "<!DOCTYPE html><html><head><meta charset=\"UTF-8\">"
      + "<title>SOC Report #" + report.id + "</title>"
      + "<style>" + css + "</style></head><body>"
      + "<div class=\"hdr\"><h1>SOC Incident Report #" + report.id + "</h1>"
      + "<div class=\"meta\">Session #" + report.sessionId
      + " &nbsp;|&nbsp; " + new Date(report.createdAt).toLocaleString()
      + " &nbsp;|&nbsp; INTERNAL USE ONLY</div></div>"
      + "<div class=\"body\">"
      + "<div class=\"badges\">"
      + "<span class=\"badge\" style=\"background:" + (sevBg[sev] ?? "#f1f5f9") + ";color:" + (sevFg[sev] ?? "#475569") + "\">" + sev.toUpperCase() + "</span>"
      + "<span class=\"badge\" style=\"background:#f1f5f9;color:#475569\">" + verdictLabel + "</span>"
      + "</div>"
      + sect("Executive Summary", report.summary)
      + sect("Detailed Findings", (report as any).detailedFindings)
      + sect("Technical Analysis", (report as any).technicalAnalysis)
      + sect("Action & Recommendations", (report as any).actionRecommendation)
      + mitreTags + iocTags
      + "<div class=\"footer\">SOC Triage Dashboard &nbsp;|&nbsp; Report #" + report.id + " &nbsp;|&nbsp; Session #" + report.sessionId + "</div>"
      + "</div></body></html>";

    // Inject ke iframe tersembunyi lalu print — hindari blob URL yg diblock browser
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 600);
  };


  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={exportPDF} className="gap-1.5 text-xs">
          <Download className="h-3.5 w-3.5" /> Export PDF
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-mono uppercase">Analysis Result</h1>
            <SeverityBadge severity={report.severity} />
            <VerdictBadge verdict={report.verdict} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Generated {format(new Date(report.createdAt), "PPP p")} •{" "}
            <Link
              href={`/sessions/${report.sessionId}`}
              className="hover:text-primary hover:underline"
            >
              View Source Session #{report.sessionId}
            </Link>
            {report.n8nExecutionId && (
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                n8n: {report.n8nExecutionId}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Verdict override — analyst can manually classify */}
      <Card className="bg-card border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono uppercase flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" /> Log Correlation Verdict
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            AI-determined verdict based on correlation analysis. Override manually if needed.
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(VERDICT_CONFIG) as [Verdict, typeof VERDICT_CONFIG[Verdict]][]).map(([v, cfg]) => (
              <button
                key={v}
                disabled={verdictLoading}
                onClick={() => handleVerdictChange(v)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold font-mono transition-all ${
                  currentVerdict === v
                    ? `${cfg.bg} ${cfg.color} ring-1 ring-current`
                    : "bg-muted/30 border-border text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                {cfg.icon}
                {cfg.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* INCIDENT SUMMARY */}
      <Card className="bg-card border-card-border shadow-lg">
        <CardHeader className="pb-2 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-sm font-mono uppercase">
            <FileText className="h-4 w-4 text-primary" /> Incident Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-sm leading-relaxed text-card-foreground whitespace-pre-line">
          {report.summary}
        </CardContent>
      </Card>

      {/* Structured Analysis Sections — matching screenshot layout */}
      <Accordion type="multiple" defaultValue={["detailed", "technical", "action", "recommendation"]} className="w-full space-y-2">

        {report.detailedFindings && (
          <AccordionItem value="detailed" className="bg-card border border-card-border rounded-lg px-4">
            <AccordionTrigger className="font-mono text-sm uppercase py-3">
              <div className="flex items-center gap-2">
                <Microscope className="h-4 w-4 text-primary" /> Detailed Findings
                <Badge variant="outline" className="text-[10px] ml-2">MEDIUM</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pb-4 text-sm leading-relaxed text-card-foreground whitespace-pre-line border-t border-border pt-3">
                {report.detailedFindings}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {report.technicalAnalysis && (
          <AccordionItem value="technical" className="bg-card border border-card-border rounded-lg px-4">
            <AccordionTrigger className="font-mono text-sm uppercase py-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" /> Technical Analysis
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pb-4 text-sm leading-relaxed text-card-foreground whitespace-pre-line border-t border-border pt-3">
                {report.technicalAnalysis}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {report.actionTaken && (
          <AccordionItem value="action" className="bg-card border border-card-border rounded-lg px-4">
            <AccordionTrigger className="font-mono text-sm uppercase py-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" /> Action
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pb-4 text-sm leading-relaxed text-card-foreground whitespace-pre-line border-t border-border pt-3">
                {report.actionTaken}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="recommendation" className="bg-card border border-card-border rounded-lg px-4">
          <AccordionTrigger className="font-mono text-sm uppercase py-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Recommendation
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pb-4 border-t border-border pt-3">
              {report.recommendations.length > 0 ? (
                <ol className="space-y-3">
                  {report.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm flex gap-3">
                      <span className="text-primary font-bold font-mono shrink-0 mt-0.5">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">No recommendations provided.</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* MITRE ATT&CK */}
      {mitreAttackTechniques.length > 0 && (
        <Card className="bg-card border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-mono uppercase">
              <Crosshair className="h-4 w-4" /> MITRE ATT&CK Techniques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {mitreAttackTechniques.map((technique, i) => (
                <span
                  key={i}
                  className={`text-xs font-mono border px-2.5 py-1.5 rounded ${getMitreColor(technique)}`}
                >
                  {technique}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* IOCs + Attack Vector / Affected Systems */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-card border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-mono uppercase">
              <Target className="h-4 w-4" /> Indicators of Compromise
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.iocs.length > 0 ? (
              <ul className="space-y-2">
                {report.iocs.map((ioc, i) => (
                  <li
                    key={i}
                    className="text-sm font-mono bg-muted/50 p-2 rounded border border-border break-all"
                  >
                    {ioc}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No IOCs identified.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-mono uppercase">
              <Server className="h-4 w-4" /> Attack Vector & Affected Systems
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
                Attack Vector
              </h4>
              <p className="text-sm bg-muted/30 p-3 rounded border border-border">
                {report.attackVector || "Not identified"}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
                Affected Systems
              </h4>
              {report.affectedSystems && report.affectedSystems.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {report.affectedSystems.map((sys, i) => (
                    <span
                      key={i}
                      className="text-xs font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded"
                    >
                      {sys}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">None identified.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status bar matching screenshot */}
      <div className="flex items-center gap-4 p-4 bg-card border border-card-border rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono uppercase">Status Alert</span>
          <Badge
            variant="outline"
            className={`text-xs font-mono font-bold ${
              currentVerdict === "true_positive"
                ? "border-red-500/50 text-red-400 bg-red-500/10"
                : currentVerdict === "false_positive"
                ? "border-green-500/50 text-green-400 bg-green-500/10"
                : "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
            }`}
          >
            {currentVerdict === "true_positive" ? "CONFIRMED" : currentVerdict === "false_positive" ? "CLOSED" : "OPEN"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-muted-foreground font-mono uppercase">Analysis Time</span>
          <span className="text-xs font-mono font-bold text-foreground">
            {format(new Date(report.createdAt), "HH:mm:ss")}
          </span>
        </div>
      </div>

      {/* Raw AI Response */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="raw">
          <AccordionTrigger className="font-mono text-sm uppercase">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Raw AI Response
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <pre className="p-4 bg-muted/50 rounded-md text-xs font-mono overflow-x-auto border border-border whitespace-pre-wrap">
              {report.rawAiResponse}
            </pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
