import { useState } from "react";
import { Link } from "wouter";
import { Plus, Search, Calendar, Filter, Clock, MoreVertical, Terminal, Shield } from "lucide-react";

const sessions = [
  { id: "SESS-2026-001", name: "Ransomware Cleanup", status: "analyzing", date: "2026-06-28 14:00", progress: 65, logs: 1245 },
  { id: "SESS-2026-002", name: "Phishing Hunt", status: "open", date: "2026-06-28 12:30", progress: 0, logs: 0 },
  { id: "SESS-2026-003", name: "Brute Force Response", status: "analyzed", date: "2026-06-27 09:00", progress: 100, logs: 5600 },
  { id: "SESS-2026-004", name: "DLP Investigation", status: "closed", date: "2026-06-25 15:45", progress: 100, logs: 890 },
];

export default function Sessions() {
  const [filter, setFilter] = useState("all");
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Triage Sessions</h1>
          <p className="text-xs text-[hsl(222,12%,52%)]">Manage ongoing and completed investigations</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20">
          <Plus className="h-4 w-4" /> New Session
        </button>
      </div>
      <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 overflow-hidden">
        <div className="grid grid-cols-6 gap-2 px-5 py-2.5 bg-[hsl(222,20%,5%)] text-[10px] font-bold text-[hsl(222,12%,45%)] uppercase tracking-wider">
          <span>Session ID</span><span>Name</span><span>Status</span><span>Date</span><span>Progress</span><span>Logs</span><span />
        </div>
        <div className="divide-y divide-[hsl(222,16%,12%)]">
          {sessions.map(s => (
            <div key={s.id} className="grid grid-cols-6 gap-2 px-5 py-3 text-sm items-center hover:bg-[hsl(222,20%,6%)] transition-colors group">
              <span className="text-cyan-400 font-mono text-xs">{s.id}</span>
              <span className="text-white font-medium">{s.name}</span>
              <span className={`text-[10px] font-bold uppercase ${s.status === 'open' ? 'text-amber-400' : s.status === 'analyzing' ? 'text-cyan-400' : 'text-emerald-400'}`}>{s.status}</span>
              <span className="text-[hsl(222,12%,52%)] text-xs flex items-center gap-1"><Calendar className="h-3 w-3" />{s.date}</span>
              <div className="w-24 h-1.5 rounded-full bg-[hsl(222,16%,12%)] relative">
                <div className="absolute top-0 left-0 h-1.5 rounded-full bg-cyan-500" style={{width: `${s.progress}%`}} />
              </div>
              <span className="text-[hsl(222,12%,52%)] text-xs font-mono">{s.logs.toLocaleString()}</span>
              <MoreVertical className="h-4 w-4 text-[hsl(222,12%,30%)] cursor-pointer hover:text-white" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
