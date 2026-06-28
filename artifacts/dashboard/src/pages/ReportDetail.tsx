import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, AlertTriangle, Shield, CheckCircle, Download, BrainCircuit, Clock, Target, ChevronRight, FileText, Server, Activity, AlertCircle, Terminal } from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function ReportDetail() {
  const [, params] = useRoute("/reports/:id");
  const [, navigate] = useLocation();
  const [report, setReport] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sessionId = params?.id;

  useEffect(() => {
    if (!sessionId) return;
    apiRequest(`/sessions/${sessionId}`)
      .then(r => r.json())
      .then(data => {
        setSession(data);
        setReport(data.report);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [sessionId]);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center space-y-3">
        <div className="h-10 w-10 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin mx-auto" />
        <p className="text-sm text-[hsl(222,12%,45%)]">Loading AI analysis report...</p>
      </div>
    </div>
  );

  if (error) return <div className="p-6 text-rose-400">{error}</div>;
  if (!report) return (
    <div className="p-6 text-center">
      <FileText className="h-12 w-12 text-[hsl(222,12%,25%)] mx-auto mb-3" />
      <p className="text-sm text-[hsl(222,12%,35%)]">No report yet for this session.</p>
      <p className="text-xs text-[hsl(222,12%,25%)] mt-1">Run AI analysis from the session page first.</p>
      <button onClick={() => navigate('/sessions')} className="mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold">Back to Sessions</button>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <button onClick={() => navigate('/sessions')} className="flex items-center gap-1 text-[hsl(222,12%,45%)] hover:text-white text-xs">
        <ArrowLeft className="h-3 w-3" /> Back to Sessions
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><FileText className="h-5 w-5 text-purple-400" /> AI Analysis Report</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-xs text-[hsl(222,12%,52%)]">{session?.title} (ID {sessionId})</p>
            <span className="text-[9px] text-[hsl(222,12%,35%)]">·</span>
            <p className="text-xs text-[hsl(222,12%,52%)]">{session?.logs?.length || 0} log entries</p>
          </div>
        </div>
      </div>

      {/* Verdict */}
      <div className={`rounded-xl border p-5 flex items-start gap-4 ${report.severity === 'critical' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
        {report.severity === 'critical' ? <AlertTriangle className="h-7 w-7 text-rose-400 shrink-0 mt-0.5" /> : <Shield className="h-7 w-7 text-orange-400 shrink-0 mt-0.5" />}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-white">Verdict: {report.verdict?.replace(/_/g, ' ') || 'N/A'}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${report.severity === 'critical' ? 'text-rose-400 bg-rose-500/10' : 'text-orange-400 bg-orange-500/10'}`}>{report.severity}</span>
          </div>
          <p className="text-xs text-[hsl(222,12,52%)] mt-1.5 leading-relaxed">{report.summary}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* MITRE */}
        <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-cyan-400" />MITRE ATT&amp;CK</h3>
          <div className="space-y-2">
            {(report.mitreAttackTechniques || []).map((m: string) => (
              <div key={m} className="flex items-center gap-2 p-2.5 rounded-lg bg-[hsl(222,20%,5%)] border border-[hsl(222,16%,8%)]">
                <span className="text-xs font-mono text-cyan-400 font-bold">{m}</span>
              </div>
            ))}
            {(!report.mitreAttackTechniques || report.mitreAttackTechniques.length === 0) &&
              <p className="text-xs text-[hsl(222,12%,30%)]">None mapped</p>}
          </div>
        </div>

        {/* Details */}
        <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Clock className="h-4 w-4 text-cyan-400" />Analysis Details</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[hsl(222,16%,8%)]">
              <span className="text-[hsl(222,12%,45%)]">Generated</span>
              <span className="text-white">{new Date(report.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[hsl(222,16%,8%)]">
              <span className="text-[hsl(222,12%,45%)]">Verdict</span>
              <span className="text-white capitalize">{report.verdict?.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[hsl(222,12%,45%)]">Severity</span>
              <span className={`font-bold uppercase ${report.severity === 'critical' ? 'text-rose-400' : 'text-orange-400'}`}>{report.severity}</span>
            </div>
          </div>
        </div>
      </div>

      {/* IOC */}
      {report.iocs && report.iocs.length > 0 && (
        <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-rose-400" />IOCs</h3>
          <div className="flex flex-wrap gap-2">
            {report.iocs.map((ioc: string, i: number) => (
              <span key={i} className="px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-[10px] font-mono text-rose-300">{ioc}</span>
            ))}
          </div>
        </div>
      )}

      {/* Findings & Analysis */}
      <div className="grid grid-cols-2 gap-6">
        {report.detailedFindings && (
          <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Activity className="h-4 w-4 text-purple-400" />Findings</h3>
            <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{report.detailedFindings}</p>
          </div>
        )}
        {report.technicalAnalysis && (
          <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Terminal className="h-4 w-4 text-cyan-400" />Technical Analysis</h3>
            <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{report.technicalAnalysis}</p>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-400" />Recommendations</h3>
          <div className="grid grid-cols-2 gap-2">
            {report.recommendations.map((rec: string, i: number) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-[hsl(222,20%,5%)] border border-[hsl(222,16%,8%)]">
                <span className="text-emerald-400 font-bold text-xs mt-0.5">{i + 1}.</span>
                <span className="text-xs text-white">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Affected Systems */}
      {report.affectedSystems && report.affectedSystems.length > 0 && (
        <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Server className="h-4 w-4 text-rose-400" />Affected Systems</h3>
          <div className="flex flex-wrap gap-2">
            {report.affectedSystems.map((sys: string, i: number) => (
              <span key={i} className="px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300">{sys}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
