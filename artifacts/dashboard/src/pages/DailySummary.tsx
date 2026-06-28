import { TrendingUp, Activity, Bell, AlertTriangle, Shield, ShieldAlert, Server, Clock, BrainCircuit, ChevronUp, ChevronDown } from "lucide-react";

const metrics = [
  { label: "Total Threats", value: 247, change: +12, icon: ShieldAlert, color: "from-rose-500 to-pink-600" },
  { label: "Active Alerts", value: 18, change: -5, icon: Bell, color: "from-amber-500 to-orange-600" },
  { label: "Systems Scanned", value: 1248, change: +48, icon: Server, color: "from-cyan-500 to-blue-600" },
  { label: "Avg Response Time", value: "4.2s", change: -0.3, icon: Clock, color: "from-emerald-500 to-teal-600", suffix: "" },
];

const timeline = [
  { time: "06:00", event: "Ransomware variant detected on DC-03", severity: "critical", source: "Wazuh" },
  { time: "07:15", event: "Phishing campaign targeting finance dept", severity: "high", source: "TheHive" },
  { time: "08:30", event: "Brute force attempt from 45.33.22.xxx blocked", severity: "medium", source: "Velociraptor" },
  { time: "09:45", event: "Malicious DLL quarantined on WIN-LAP-05", severity: "critical", source: "Wazuh" },
  { time: "11:00", event: "DLP policy violation - USB mass storage", severity: "low", source: "Wazuh" },
  { time: "12:30", event: "Lateral movement detected via SMB", severity: "high", source: "Velociraptor" },
  { time: "14:00", event: "Incident INC-2026-012 escalated to SOC lead", severity: "medium", source: "TheHive" },
  { time: "15:20", event: "AI analysis complete: Brute Force Report generated", severity: "info", source: "9Router" },
];

const agentDecisions = [
  { id: 1, title: "Quarantine DLL on WIN-LAP-05", status: "executed", soc: "approved", time: "09:50" },
  { id: 2, title: "Block IP 45.33.22.xxx at firewall", status: "executed", soc: "approved", time: "08:32" },
  { id: 3, title: "Isolate DC-03 for ransomware scan", status: "pending_review", soc: "pending", time: "14:15" },
  { id: 4, title: "Reset credentials for phished users", status: "recommended", soc: "pending", time: "15:00" },
];

const severityColors: Record<string, string> = {
  critical: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  info: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
};

export default function DailySummary() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Daily Security Summary</h1>
          <p className="text-xs text-[hsl(222,12%,52%)]">June 28, 2026 — AI-powered threat & incident digest</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <BrainCircuit className="h-4 w-4 text-purple-400" />
          <span className="text-xs font-semibold text-purple-300">9 Router AI Analysis</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map(m => (
          <div key={m.label} className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4 hover:border-[hsl(222,16%,20%)] transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${m.color}`}><m.icon className="h-4 w-4 text-white" /></div>
              <span className="text-xs text-[hsl(222,12%,52%)]">{m.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{m.value}{m.suffix || ''}</div>
            <div className={`flex items-center gap-1 text-[10px] font-semibold mt-1 ${(m.change ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(m.change ?? 0) >= 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {Math.abs(m.change ?? 0)} vs yesterday
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="col-span-2 rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Clock className="h-4 w-4 text-cyan-400" />Today's Timeline</h3>
          <div className="space-y-0">
            {timeline.map((t, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5 border-b border-[hsl(222,16%,8%)] last:border-0">
                <span className="text-[10px] font-mono text-[hsl(222,12%,35%)] min-w-[3rem] pt-0.5">{t.time}</span>
                <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${severityColors[t.severity]}`}>{t.severity}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{t.event}</p>
                  <span className="text-[10px] text-[hsl(222,12%,40%)]">{t.source}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Decisions */}
        <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-purple-400" />AI Agent Decisions</h3>
          <div className="space-y-3">
            {agentDecisions.map(d => (
              <div key={d.id} className="p-3 rounded-lg bg-[hsl(222,20%,5%)] border border-[hsl(222,16%,10%)]">
                <p className="text-xs text-white font-medium mb-1.5">{d.title}</p>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${d.status === 'executed' ? 'text-emerald-400 bg-emerald-500/10' : d.status === 'pending_review' ? 'text-amber-400 bg-amber-500/10' : 'text-cyan-400 bg-cyan-500/10'}`}>{d.status.replace('_', ' ')}</span>
                  <span className="text-[hsl(222,12%,35%)]">{d.time}</span>
                  <span className={`ml-auto text-[10px] ${d.soc === 'approved' ? 'text-emerald-400' : 'text-amber-400'}`}>{d.soc === 'approved' ? '✓ SOC Approved' : '⏳ SOC Review'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Severity Breakdown */}
      <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
        <h3 className="text-sm font-bold text-white mb-3">Severity Breakdown</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Critical", count: 3, color: "from-rose-500 to-pink-600", pct: 30 },
            { label: "High", count: 7, color: "from-orange-500 to-red-600", pct: 35 },
            { label: "Medium", count: 12, color: "from-amber-500 to-yellow-600", pct: 25 },
            { label: "Low", count: 5, color: "from-emerald-500 to-teal-600", pct: 10 },
          ].map(b => (
            <div key={b.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[hsl(222,12%,52%)]">{b.label}</span>
                <span className="text-sm font-bold text-white">{b.count}</span>
              </div>
              <div className="h-2 rounded-full bg-[hsl(222,16%,10%)]">
                <div className={`h-2 rounded-full bg-gradient-to-r ${b.color}`} style={{width: `${b.pct}%`}} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
