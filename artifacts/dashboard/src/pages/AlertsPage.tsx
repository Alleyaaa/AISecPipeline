import { useState } from "react";
import { Bell, Search, Filter, CheckCircle, XCircle, AlertTriangle, AlertCircle, Clock, ArrowUpRight, Eye, MoreHorizontal } from "lucide-react";

const alerts = [
  { id: 1, title: "Suspicious PowerShell Execution - Encoded Command", severity: "critical", source: "Wazuh", agent: "WIN-LAP-01", time: "2m ago", status: "new", mitre: "T1059.001", score: 95 },
  { id: 2, title: "Mimikatz LSASS Access Detected", severity: "critical", source: "Velociraptor", agent: "DC-01", time: "5m ago", status: "acknowledged", mitre: "T1003.001", score: 98 },
  { id: 3, title: "RDP Brute Force - 150+ Failed Attempts", severity: "high", source: "Wazuh", agent: "SRV-WEB-02", time: "8m ago", status: "new", mitre: "T1110", score: 85 },
  { id: 4, title: "Service Installation - Unknown Publisher", severity: "medium", source: "TheHive", agent: "DB-MAIN", time: "12m ago", status: "new", mitre: "T1543", score: 62 },
  { id: 5, title: "USB Device Mounted - Critical System", severity: "low", source: "Velociraptor", agent: "WIN-LAP-01", time: "15m ago", status: "resolved", mitre: "T1091", score: 35 },
  { id: 6, title: "Data Exfiltration - Large Outbound Transfer", severity: "critical", source: "Custom SIEM", agent: "SRV-WEB-02", time: "18m ago", status: "new", mitre: "T1048", score: 92 },
  { id: 7, title: "DNS Query for Known Malicious Domain", severity: "high", source: "Wazuh", agent: "DC-01", time: "25m ago", status: "acknowledged", mitre: "T1071", score: 78 },
  { id: 8, title: "Scheduled Task Created - Suspicious Path", severity: "medium", source: "Velociraptor", agent: "FIN-LAP-03", time: "30m ago", status: "new", mitre: "T1053", score: 55 },
  { id: 9, title: "Phishing URL Detected in Email", severity: "high", source: "TheHive", agent: "All Users", time: "35m ago", status: "new", mitre: "T1566", score: 82 },
  { id: 10, title: "Windows Registry Persistence Added", severity: "medium", source: "Wazuh", agent: "WIN-LAP-01", time: "40m ago", status: "resolved", mitre: "T1547", score: 58 },
  { id: 11, title: "Unusual Outbound Traffic to Unknown IP", severity: "high", source: "Custom SIEM", agent: "DB-MAIN", time: "45m ago", status: "acknowledged", mitre: "T1571", score: 74 },
  { id: 12, title: "WMI Subscription Created - Lateral Movement", severity: "critical", source: "Velociraptor", agent: "DC-01", time: "50m ago", status: "new", mitre: "T1047", score: 91 },
];

const sevConfig: Record<string, { color: string; bg: string; icon: any }> = {
  critical: { color: "text-rose-400", bg: "bg-rose-500/10", icon: XCircle },
  high:     { color: "text-orange-400", bg: "bg-orange-500/10", icon: AlertTriangle },
  medium:   { color: "text-yellow-400", bg: "bg-yellow-500/10", icon: AlertCircle },
  low:      { color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle },
};

export default function AlertsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = alerts.filter(a => {
    if (filter !== "all" && a.severity !== filter && a.status !== filter) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.agent.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    new: alerts.filter(a => a.status === "new").length,
    critical: alerts.filter(a => a.severity === "critical").length,
    high: alerts.filter(a => a.severity === "high").length,
    total: alerts.length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Alerts</h1>
            <p className="text-xs text-[hsl(222,12%,52%)]">Security alert queue & triage center</p>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(222,12%,35%)]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[hsl(222,16%,14%)] bg-[hsl(222,20%,5%)] text-sm text-white placeholder:text-[hsl(222,12%,35%)] focus:outline-none focus:ring-1 focus:ring-cyan-500"
            placeholder="Search alerts..." />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[hsl(222,20%,5%)]">
          {["all", "new", "critical", "high", "medium", "low"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-2.5 py-1.5 rounded-md text-[10px] font-medium capitalize transition-all ${
                filter === s 
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400'
                  : 'text-[hsl(222,12%,52%)] hover:text-white'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
          <p className="text-[10px] text-[hsl(222,12%,52%)] uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold text-white mt-1">{counts.total}</p>
        </div>
        <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
          <p className="text-[10px] text-[hsl(222,12%,52%)] uppercase tracking-wider">New</p>
          <p className="text-2xl font-bold text-cyan-400 mt-1">{counts.new}</p>
        </div>
        <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
          <p className="text-[10px] text-[hsl(222,12%,52%)] uppercase tracking-wider">Critical</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{counts.critical}</p>
        </div>
        <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
          <p className="text-[10px] text-[hsl(222,12%,52%)] uppercase tracking-wider">High</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">{counts.high}</p>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 overflow-hidden">
        <div className="grid grid-cols-8 gap-2 px-5 py-2.5 bg-[hsl(222,20%,5%)] text-[10px] font-bold text-[hsl(222,12%,45%)] uppercase tracking-wider">
          <span className="col-span-2">Alert</span><span>Severity</span><span>Source</span><span>MITRE</span><span>Score</span><span>Time</span><span />
        </div>
        <div className="divide-y divide-[hsl(222,16%,12%)]">
          {filtered.map(a => {
            const cfg = sevConfig[a.severity];
            const Icon = cfg.icon;
            return (
              <div key={a.id} className="grid grid-cols-8 gap-2 px-5 py-3 text-sm items-center hover:bg-[hsl(222,20%,6%)] transition-colors group">
                <div className="col-span-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded-md ${cfg.bg}`}>
                      <Icon className={`h-3 w-3 ${cfg.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white truncate">{a.title}</p>
                      <p className="text-[10px] text-[hsl(222,12%,45%)]">{a.agent}</p>
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border w-fit ${cfg.bg} ${cfg.color} border-current`}>{a.severity}</span>
                <span className="text-[hsl(222,12%,52%)] text-xs">{a.source}</span>
                <span className="text-[10px] font-mono text-cyan-400">{a.mitre}</span>
                <span className={`text-xs font-bold font-mono ${a.score >= 90 ? 'text-rose-400' : a.score >= 70 ? 'text-orange-400' : 'text-yellow-400'}`}>{a.score}</span>
                <span className="text-[hsl(222,12%,45%)] text-xs flex items-center gap-1"><Clock className="h-3 w-3" />{a.time}</span>
                <div className="flex items-center gap-1 justify-end">
                  {a.status === "new" && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                  <Eye className="h-3.5 w-3.5 text-[hsl(222,12%,30%)] hover:text-cyan-400 transition-colors cursor-pointer" />
                  <MoreHorizontal className="h-3.5 w-3.5 text-[hsl(222,12%,30%)] hover:text-cyan-400 transition-colors cursor-pointer" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
