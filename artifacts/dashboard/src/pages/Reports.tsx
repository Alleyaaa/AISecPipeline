import { useState, useEffect } from "react";
import { FileText, Search, BrainCircuit, AlertTriangle, Shield, ArrowUpRight, Target } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/api";

export default function Reports() {
  const [, navigate] = useLocation();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/sessions")
      .then(r => r.json())
      .then(data => { setSessions(data.filter((s: any) => s.hasReport)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><FileText className="h-5 w-5 text-purple-400" /> AI Analysis Reports</h1>
          <p className="text-xs text-[hsl(222,12%,52%)]">Reports generated from analyzed sessions</p>
        </div>
        {sessions.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <BrainCircuit className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-semibold text-purple-300">{sessions.length} Reports</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {loading && <p className="text-xs text-center py-8 text-[hsl(222,12%,35%)]">Loading reports...</p>}
        {!loading && sessions.length === 0 && (
          <div className="text-center py-12 text-[hsl(222,12%,35%)] text-sm">No reports yet. Run AI analysis on a session first.</div>
        )}
        {sessions.map(s => (
          <div key={s.id} onClick={() => navigate(`/reports/${s.id}`)} className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-5 hover:border-[hsl(222,16%,20%)] cursor-pointer transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-white text-sm">{s.title}</h3>
                <p className="text-[10px] text-[hsl(222,12,45%)]">ID {s.id} · {new Date(s.updatedAt || s.createdAt).toLocaleString()}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-[hsl(222,12%,30%)]" />
            </div>
            <div className="flex items-center gap-2 text-xs text-[hsl(222,12%,45%)]">
              <span>{s.logCount} log entries</span>
              <span>·</span>
              <span className="flex items-center gap-1"><BrainCircuit className="h-3 w-3 text-purple-400" /> Analyzed</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
