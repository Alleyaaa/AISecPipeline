import { useState } from "react";
import { Shield, Search, AlertTriangle, CheckCircle, AlertCircle, Clock, ArrowUpRight, Download } from "lucide-react";

const agents = [
  { id: 1, name: "WIN-LAP-01", ip: "10.0.1.42", os: "Windows 11", status: "active", lastSeen: "2s ago", version: "4.9.0", group: "default" },
  { id: 2, name: "DC-01", ip: "10.0.0.10", os: "Windows Server 2022", status: "active", lastSeen: "1s ago", version: "4.9.0", group: "domain-controllers" },
  { id: 3, name: "SRV-WEB-02", ip: "10.0.2.15", os: "Ubuntu 24.04", status: "active", lastSeen: "3s ago", version: "4.9.0", group: "web-servers" },
  { id: 4, name: "DB-MAIN", ip: "10.0.3.5", os: "Rocky Linux 9", status: "active", lastSeen: "5s ago", version: "4.8.1", group: "databases" },
  { id: 5, name: "FIN-LAP-03", ip: "10.0.1.77", os: "Windows 10", status: "disconnected", lastSeen: "12m ago", version: "4.9.0", group: "finance" },
  { id: 6, name: "SRV-MAIL-01", ip: "10.0.2.22", os: "Ubuntu 22.04", status: "active", lastSeen: "4s ago", version: "4.9.0", group: "mail-servers" },
];

const events = [
  { id: 1, rule: "PowerShell Suspicious Script", level: 15, agent: "WIN-LAP-01", time: "2m ago", mitre: "T1059.001", status: "open" },
  { id: 2, rule: "Windows Registry Modification", level: 12, agent: "DC-01", time: "4m ago", mitre: "T1112", status: "open" },
  { id: 3, rule: "Sysmon - Process Create", level: 5, agent: "SRV-WEB-02", time: "6m ago", mitre: "T1059", status: "closed" },
  { id: 4, rule: "Authentication Failure > 5", level: 10, agent: "DC-01", time: "8m ago", mitre: "T1110", status: "open" },
  { id: 5, rule: "File Integrity Scan", level: 3, agent: "DB-MAIN", time: "10m ago", mitre: "T1078", status: "closed" },
  { id: 6, rule: "USB Device Connected", level: 7, agent: "FIN-LAP-03", time: "15m ago", mitre: "T1091", status: "open" },
];

const levelColors: Record<string, string> = {
  "15": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "12": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "10": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "7":  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "5":  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "3":  "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default function Wazuh() {
  const [tab, setTab] = useState<"agents" | "events">("agents");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Wazuh</h1>
            <p className="text-xs text-[hsl(222,12%,52%)]">Security agent monitoring & event correlation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-[hsl(222,12%,52%)]">{agents.filter(a => a.status === "active").length} agents online</span>
        </div>
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Agents", value: agents.length, sub: `${agents.filter(a => a.status === "active").length} online`, color: "from-cyan-500 to-blue-600" },
          { label: "Active Alerts", value: events.filter(e => e.status === "open").length, sub: `${events.length} total`, color: "from-rose-500 to-pink-600" },
          { label: "Rules Triggered", value: new Set(events.map(e => e.rule)).size, sub: "Last 24h", color: "from-amber-500 to-orange-600" },
          { label: "MITRE Mapped", value: new Set(events.map(e => e.mitre).filter(Boolean)).size, sub: "Techniques", color: "from-violet-500 to-purple-600" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
            <p className="text-[10px] text-[hsl(222,12%,52%)] uppercase tracking-wider font-medium">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
            <p className="text-[10px] text-[hsl(222,12%,45%)] mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[hsl(222,20%,5%)] w-fit">
        <button onClick={() => setTab("agents")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === "agents" ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400' : 'text-[hsl(222,12%,52%)] hover:text-white'}`}>
          <Shield className="h-3.5 w-3.5 inline mr-1.5" />Agents
        </button>
        <button onClick={() => setTab("events")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === "events" ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400' : 'text-[hsl(222,12%,52%)] hover:text-white'}`}>
          <AlertCircle className="h-3.5 w-3.5 inline mr-1.5" />Events
        </button>
      </div>

      {tab === "agents" ? (
        <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 overflow-hidden">
          <div className="grid grid-cols-7 gap-2 px-5 py-2.5 bg-[hsl(222,20%,5%)] text-[10px] font-bold text-[hsl(222,12%,45%)] uppercase tracking-wider">
            <span>Agent</span><span>IP</span><span>OS</span><span>Status</span><span>Version</span><span>Group</span><span>Last Seen</span>
          </div>
          <div className="divide-y divide-[hsl(222,16%,12%)]">
            {agents.map(a => (
              <div key={a.id} className="grid grid-cols-7 gap-2 px-5 py-3 text-sm items-center hover:bg-[hsl(222,20%,6%)] transition-colors group">
                <span className="text-white font-medium">{a.name}</span>
                <span className="text-[hsl(222,12%,52%)] font-mono text-xs">{a.ip}</span>
                <span className="text-[hsl(222,12%,52%)] text-xs">{a.os}</span>
                <span className={`flex items-center gap-1.5 text-xs ${a.status === "active" ? 'text-emerald-400' : 'text-[hsl(222,12%,35%)]'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${a.status === "active" ? 'bg-emerald-400' : 'bg-[hsl(222,12%,35%)]'}`} />
                  {a.status}
                </span>
                <span className="text-[hsl(222,12%,52%)] text-xs">{a.version}</span>
                <span className="text-[hsl(222,12%,52%)] text-xs">{a.group}</span>
                <span className="text-[hsl(222,12%,45%)] text-xs">{a.lastSeen}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 overflow-hidden">
          <div className="grid grid-cols-7 gap-2 px-5 py-2.5 bg-[hsl(222,20%,5%)] text-[10px] font-bold text-[hsl(222,12%,45%)] uppercase tracking-wider">
            <span>Rule</span><span>Level</span><span>Agent</span><span>MITRE</span><span>Time</span><span>Status</span><span />
          </div>
          <div className="divide-y divide-[hsl(222,16%,12%)]">
            {events.map(e => (
              <div key={e.id} className="grid grid-cols-7 gap-2 px-5 py-3 text-sm items-center hover:bg-[hsl(222,20%,6%)] transition-colors group">
                <span className="text-white text-xs truncate">{e.rule}</span>
                <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border w-fit ${levelColors[e.level.toString()] || 'bg-slate-500/10 text-slate-400'}`}>{e.level}</span>
                <span className="text-[hsl(222,12%,52%)] text-xs">{e.agent}</span>
                <span className="text-[10px] font-mono text-cyan-400">{e.mitre}</span>
                <span className="text-[hsl(222,12%,45%)] text-xs flex items-center gap-1"><Clock className="h-3 w-3" />{e.time}</span>
                <span className={`text-[10px] font-bold uppercase ${e.status === "open" ? 'text-amber-400' : 'text-emerald-400'}`}>{e.status}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-[hsl(222,12%,30%)] group-hover:text-cyan-400 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
