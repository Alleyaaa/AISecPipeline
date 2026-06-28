import { useState } from "react";
import { Bug, AlertTriangle, CheckCircle, AlertCircle, Clock, User, Tag, ArrowUpRight, MessageSquare } from "lucide-react";

const cases = [
  { id: "INC-2026-001", title: "Ransomware Detected on WIN-LAP-01", severity: "critical", status: "in_progress", assignee: "Admin", source: "Wazuh", created: "10m ago", tlp: "RED", comments: 3 },
  { id: "INC-2026-002", title: "Data Exfiltration via DNS", severity: "high", status: "open", assignee: "—", source: "Velociraptor", created: "25m ago", tlp: "AMBER", comments: 1 },
  { id: "INC-2026-003", title: "Phishing Campaign - Invoice Theme", severity: "medium", status: "open", assignee: "Analyst-2", source: "Email", created: "1h ago", tlp: "GREEN", comments: 5 },
  { id: "INC-2026-004", title: "Privilege Escalation on DC-01", severity: "high", status: "in_progress", assignee: "Admin", source: "Wazuh", created: "2h ago", tlp: "AMBER", comments: 2 },
  { id: "INC-2026-005", title: "Unusual Outbound Traffic", severity: "medium", status: "open", assignee: "—", source: "Custom SIEM", created: "3h ago", tlp: "GREEN", comments: 0 },
  { id: "INC-2026-006", title: "USB Malware Transfer", severity: "low", status: "resolved", assignee: "Admin", source: "Velociraptor", created: "6h ago", tlp: "WHITE", comments: 4 },
  { id: "INC-2026-007", title: "Brute Force - SSH on SRV-WEB-02", severity: "high", status: "in_progress", assignee: "Analyst-1", source: "Wazuh", created: "30m ago", tlp: "RED", comments: 2 },
  { id: "INC-2026-008", title: "Malware Detected - Trojan.Generic", severity: "critical", status: "open", assignee: "—", source: "Wazuh", created: "5m ago", tlp: "RED", comments: 0 },
];

const sevColors: Record<string, string> = {
  critical: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const tlpColors: Record<string, string> = {
  RED: "bg-red-500/20 text-red-300",
  AMBER: "bg-amber-500/20 text-amber-300",
  GREEN: "bg-emerald-500/20 text-emerald-300",
  WHITE: "bg-slate-500/20 text-slate-300",
};

export default function TheHive() {
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? cases : cases.filter(c => c.severity === filter);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/20">
            <Bug className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">TheHive</h1>
            <p className="text-xs text-[hsl(222,12%,52%)]">Incident response & case management</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {["all", "critical", "high", "medium", "low"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              filter === s 
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/20'
                : 'text-[hsl(222,12%,52%)] hover:text-white bg-[hsl(222,20%,5%)] border border-transparent'
            }`}>
            {s}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Open", value: cases.filter(c => c.status === "open").length, color: "text-amber-400" },
          { label: "In Progress", value: cases.filter(c => c.status === "in_progress").length, color: "text-cyan-400" },
          { label: "Resolved", value: cases.filter(c => c.status === "resolved").length, color: "text-emerald-400" },
          { label: "Critical", value: cases.filter(c => c.severity === "critical").length, color: "text-rose-400" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
            <p className="text-[10px] text-[hsl(222,12%,52%)] uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Cases Table */}
      <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 overflow-hidden">
        <div className="grid grid-cols-9 gap-2 px-5 py-2.5 bg-[hsl(222,20%,5%)] text-[10px] font-bold text-[hsl(222,12%,45%)] uppercase tracking-wider">
          <span>ID</span><span>Title</span><span>Severity</span><span>Status</span><span>Assignee</span><span>Source</span><span>TLP</span><span>Created</span><span />
        </div>
        <div className="divide-y divide-[hsl(222,16%,12%)]">
          {filtered.map(c => (
            <div key={c.id} className="grid grid-cols-9 gap-2 px-5 py-3 text-sm items-center hover:bg-[hsl(222,20%,6%)] transition-colors group">
              <span className="text-cyan-400 font-mono text-xs font-medium">{c.id}</span>
              <span className="text-white truncate">{c.title}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border w-fit ${sevColors[c.severity]}`}>{c.severity}</span>
              <span className={`text-[10px] font-bold uppercase ${
                c.status === 'open' ? 'text-amber-400' : c.status === 'in_progress' ? 'text-cyan-400' : 'text-emerald-400'
              }`}>{c.status.replace('_', ' ')}</span>
              <span className="text-[hsl(222,12%,52%)] text-xs flex items-center gap-1">
                {c.assignee !== "—" && <User className="h-3 w-3" />}{c.assignee}
              </span>
              <span className="text-[hsl(222,12%,52%)] text-xs">{c.source}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${tlpColors[c.tlp]}`}>{c.tlp}</span>
              <span className="text-[hsl(222,12%,45%)] text-xs flex items-center gap-1"><Clock className="h-3 w-3" />{c.created}</span>
              <div className="flex items-center gap-1">
                {c.comments > 0 && <span className="text-[10px] text-[hsl(222,12%,45%)] flex items-center gap-0.5"><MessageSquare className="h-3 w-3" />{c.comments}</span>}
                <ArrowUpRight className="h-3.5 w-3.5 text-[hsl(222,12%,30%)] group-hover:text-cyan-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
