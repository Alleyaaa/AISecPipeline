import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Plus, FileText, Terminal, Trash2, BrainCircuit, X, Upload, RefreshCw, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { apiRequest } from "@/lib/api";

type LogEntry = {
  id: number;
  source: string;
  rawJson: string;
  createdAt: string;
};

type Session = {
  id: number;
  title: string;
  status: string;
  logCount: number;
  hasReport: boolean;
  createdAt: string;
};

export default function Sessions() {
  const [, navigate] = useLocation();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newLogs, setNewLogs] = useState<string[]>([""]);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    apiRequest("/sessions")
      .then(r => r.json())
      .then(data => { setSessions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeId) return;
    apiRequest(`/sessions/${activeId}`)
      .then(r => r.json())
      .then(data => { setLogs(data.logs || []); setError(""); })
      .catch(e => setError(e.message));
  }, [activeId]);

  const createSession = async () => {
    const title = newTitle.trim() || `Triage Session #${sessions.length + 1}`;
    const res = await apiRequest("/sessions", {
      method: "POST",
      body: JSON.stringify({ title, description: "" }),
    });
    const session = await res.json();
    // Add log entries if any
    for (const raw of newLogs) {
      if (!raw.trim()) continue;
      await apiRequest(`/sessions/${session.id}/logs`, {
        method: "POST",
        body: JSON.stringify({
          source: "unknown",
          rawJson: raw,
          extractedIp: null,
        }),
      });
    }
    setSessions(prev => [session, ...prev]);
    setActiveId(session.id);
    // Refresh session detail to get logs & correct logCount
    const updated = await apiRequest(`/sessions/${session.id}`).then(r => r.json());
    setSessions(prev => [{ ...updated, logCount: updated.logs?.length || 0 }, ...prev.filter(s => s.id !== session.id)]);
    setLogs(updated.logs || []);
    setShowNew(false);
    setNewTitle("");
    setNewLogs([""]);
  };

  const analyzeSession = async () => {
    if (!activeId) return;
    setAnalyzing(true);
    try {
      await apiRequest(`/sessions/${activeId}/analyze`, {
        method: "POST",
        body: JSON.stringify({ maskIps: false }),
      });
      navigate(`/reports/${activeId}`);
    } catch (e: any) {
      setError(e.message);
      setAnalyzing(false);
    }
  };

  const active = sessions.find(s => s.id === activeId);

  return (
    <div className="p-6 flex gap-6 h-[calc(100vh-80px)]">
      <div className="w-80 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">Sessions</h1>
          <div className="flex gap-1">
            <button onClick={() => setShowNew(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold">
              <Plus className="h-3.5 w-3.5" /> New
            </button>
            <button onClick={() => window.location.reload()} className="p-1.5 rounded-lg border border-[hsl(222,16%,14%)] text-[hsl(222,12%,45%)] hover:text-white">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-1.5 max-h-[calc(100vh-180px)] overflow-y-auto">
          {loading && <p className="text-xs text-center py-8 text-[hsl(222,12%,35%)]">Loading sessions...</p>}
          {!loading && sessions.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-10 w-10 text-[hsl(222,12%,25%)] mx-auto mb-2" />
              <p className="text-xs text-[hsl(222,12%,35%)]">No sessions yet</p>
            </div>
          )}
          {sessions.map(s => (
            <button key={s.id} onClick={() => setActiveId(s.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                activeId === s.id 
                  ? 'bg-cyan-500/10 border-cyan-500/30' 
                  : 'bg-[hsl(222,18%,8%)]/50 border-[hsl(222,16%,12%)] hover:border-[hsl(222,16%,20%)]'
              }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white truncate mr-2">{s.title}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                  s.status === 'analyzed' ? 'text-emerald-400 bg-emerald-500/10' : 
                  s.status === 'analyzing' ? 'text-amber-400 bg-amber-500/10' : 
                  'text-[hsl(222,12%,30%)] bg-[hsl(222,16%,8%)]'
                }`}>{s.status}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-[hsl(222,12%,40%)]">
                <span>ID {s.id}</span>
                <span className="w-1 h-1 rounded-full bg-[hsl(222,12%,25%)]" />
                <span>{s.logCount} log{s.logCount !== 1 ? 's' : ''}</span>
                {s.hasReport && <span className="text-cyan-400">· report ✓</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 overflow-y-auto">
        {showNew && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">New Session</h2>
              <button onClick={() => setShowNew(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Session title (auto if empty)" className="w-full px-3 py-2 rounded-lg bg-[hsl(222,20%,5%)] border border-[hsl(222,16%,14%)] text-white text-sm outline-none focus:border-cyan-500/50" />
            <div className="space-y-2">
              <p className="text-xs font-semibold text-white">Raw Log Sources</p>
              {newLogs.map((log, i) => (
                <div key={i}>
                  <textarea value={log} onChange={e => {
                    const copy = [...newLogs];
                    copy[i] = e.target.value;
                    setNewLogs(copy);
                  }} placeholder={`Paste raw log source #${i + 1}...`} className="w-full h-28 p-3 rounded-lg bg-[hsl(222,20%,5%)] border border-[hsl(222,16%,14%)] text-xs font-mono text-cyan-100/80 outline-none resize-none" />
                </div>
              ))}
              <button onClick={() => setNewLogs([...newLogs, ""])} className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300">
                <Upload className="h-3 w-3" /> Add another log source
              </button>
            </div>
            <button onClick={createSession} className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-sm font-semibold">Create & Analyze</button>
          </div>
        )}

        {!showNew && !active && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Terminal className="h-12 w-12 text-[hsl(222,12%,25%)] mx-auto mb-3" />
              <p className="text-sm text-[hsl(222,12%,35%)]">Select or create a session</p>
            </div>
          </div>
        )}

        {!showNew && active && (
          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{active.title}</h2>
                <p className="text-xs text-[hsl(222,12%,40%)] mt-1">ID {active.id} · {active.logCount} log entries · {new Date(active.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {error && <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">{error}</div>}

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Terminal className="h-4 w-4 text-cyan-400" /> Raw Log Entries</h3>
              {logs.length === 0 && <p className="text-xs text-[hsl(222,12%,30%)]">No log entries. Analyze to generate report.</p>}
              {logs.map(l => (
                <div key={l.id} className="rounded-lg border border-[hsl(222,16%,14%)] bg-[hsl(222,20%,5%)] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-[hsl(222,12%,30%)]">#{l.id} · {l.source}</span>
                  </div>
                  <pre className="text-[10px] font-mono text-cyan-100/60 whitespace-pre-wrap line-clamp-4">{l.rawJson}</pre>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              {active.status !== "analyzed" && (
                <button onClick={analyzeSession} disabled={analyzing}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-sm font-semibold disabled:opacity-50">
                  {analyzing ? <><div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Analyzing...</> : <><BrainCircuit className="h-4 w-4" /> Analyze</>}
                </button>
              )}
              {active.hasReport && (
                <button onClick={() => navigate(`/reports/${active.id}`)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-cyan-500/30 text-cyan-300 text-sm font-semibold hover:bg-cyan-500/10">
                  <FileText className="h-4 w-4" /> View Report
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
