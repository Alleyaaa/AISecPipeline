import { useState } from "react";
import { BookOpen, Plug, Shield, Terminal, Bell, Settings, CheckCircle, XCircle, AlertCircle, ArrowUpRight, Zap, Search } from "lucide-react";

const playbooks = [
  {
    id: 1, name: "Ransomware Response", status: "active", triggers: 7, lastRun: "10m ago",
    steps: [
      { action: "Isolate affected endpoints", type: "automated", status: "success" },
      { action: "Run Velociraptor hunt for ransomware artifacts", type: "automated", status: "success" },
      { action: "Create TheHive incident case", type: "automated", status: "success" },
      { action: "Notify SOC team via alert", type: "notification", status: "success" },
    ],
  },
  {
    id: 2, name: "Phishing Investigation", status: "active", triggers: 23, lastRun: "5m ago",
    steps: [
      { action: "Extract URLs from email", type: "automated", status: "success" },
      { action: "Check Wazuh logs for related alerts", type: "automated", status: "success" },
      { action: "Verify against MITRE T1566", type: "automated", status: "success" },
      { action: "Alert affected users", type: "notification", status: "success" },
    ],
  },
  {
    id: 3, name: "Brute Force Mitigation", status: "inactive", triggers: 0, lastRun: "2d ago",
    steps: [
      { action: "Block source IP via API", type: "automated", status: "success" },
      { action: "Audit account logs", type: "automated", status: "success" },
      { action: "Create TheHive case", type: "automated", status: "pending" },
    ],
  },
];

const connectors = [
  { name: "Wazuh API", icon: Shield, status: "connected", endpoint: "https://wazuh:55000" },
  { name: "TheHive API", icon: Terminal, status: "connected", endpoint: "https://thehive:9000" },
  { name: "Velociraptor API", icon: Search, status: "disconnected", endpoint: "https://velociraptor:8000" },
  { name: "Email Notifier", icon: Bell, status: "connected", endpoint: "SMTP configured" },
];

export default function Playbooks() {
  const [tab, setTab] = useState<"playbooks" | "setup">("playbooks");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">SOAR Playbooks</h1>
            <p className="text-xs text-[hsl(222,12%,52%)]">Automated incident response & connector setup</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[hsl(222,20%,5%)] w-fit">
        <button onClick={() => setTab("playbooks")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === "playbooks" ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400' : 'text-[hsl(222,12%,52%)] hover:text-white'}`}>
          <BookOpen className="h-3.5 w-3.5 inline mr-1.5" />Playbooks
        </button>
        <button onClick={() => setTab("setup")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === "setup" ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400' : 'text-[hsl(222,12%,52%)] hover:text-white'}`}>
          <Plug className="h-3.5 w-3.5 inline mr-1.5" />Connector Setup
        </button>
      </div>

      {tab === "playbooks" ? (
        <div className="grid grid-cols-2 gap-4">
          {playbooks.map(p => (
            <div key={p.id} className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4 hover:border-[hsl(195,100%,50%)]/20 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${p.status === 'active' ? 'bg-emerald-500/10' : 'bg-[hsl(222,16%,12%)]'}`}>
                    {p.status === 'active' ? <Zap className="h-4 w-4 text-emerald-400" /> : <Settings className="h-4 w-4 text-[hsl(222,12%,35%)]" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{p.name}</p>
                    <p className="text-[10px] text-[hsl(222,12%,45%)]">{p.triggers} triggers · last {p.lastRun}</p>
                  </div>
                </div>
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${p.status === 'active' ? 'text-emerald-400 bg-emerald-500/10' : 'text-[hsl(222,12%,35%)] bg-[hsl(222,16%,12%)]'}`}>{p.status}</span>
              </div>
              <div className="flex items-center gap-1 mb-3">
                {p.steps.map((s, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full ${s.status === 'success' ? 'bg-emerald-500' : s.status === 'failed' ? 'bg-rose-500' : 'bg-[hsl(222,16%,15%)]'}`} />
                ))}
              </div>
              <div className="space-y-1">
                {p.steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[hsl(222,20%,5%)]">
                    {s.status === 'success' ? <CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" /> :
                     s.status === 'failed' ? <AlertCircle className="h-3 w-3 text-rose-400 shrink-0" /> :
                     <AlertCircle className="h-3 w-3 text-amber-400 shrink-0" />}
                    <span className="text-xs text-white flex-1">{s.action}</span>
                    <span className={`text-[8px] font-bold uppercase px-1 py-0.5 rounded ${s.type === 'automated' ? 'text-cyan-400 bg-cyan-500/10' : 'text-amber-400 bg-amber-500/10'}`}>{s.type}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Connector Status</h2>
            <div className="space-y-3">
              {connectors.map(c => (
                <div key={c.name} className="flex items-center justify-between p-3 rounded-lg bg-[hsl(222,20%,5%)]">
                  <div className="flex items-center gap-2.5">
                    <c.icon className="h-4 w-4 text-cyan-400" />
                    <div>
                      <p className="text-sm font-medium text-white">{c.name}</p>
                      <p className="text-[10px] text-[hsl(222,12%,45%)] font-mono">{c.endpoint}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${c.status === 'connected' ? 'text-emerald-400' : 'text-[hsl(222,12%,35%)]'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'connected' ? 'bg-emerald-400' : 'bg-[hsl(222,12%,35%)]'}`} />
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Setup Guide</h2>
            <div className="space-y-3 text-xs text-[hsl(222,12%,52%)]">
              <div className="p-3 rounded-lg bg-[hsl(222,20%,5%)] space-y-1">
                <p className="font-medium text-white">1. Configure Wazuh API</p>
                <p>Update <code className="text-cyan-400 font-mono">/settings</code> with your Wazuh manager URL and credentials.</p>
              </div>
              <div className="p-3 rounded-lg bg-[hsl(222,20%,5%)] space-y-1">
                <p className="font-medium text-white">2. Connect Velociraptor</p>
                <p>Add your Velociraptor server URL and API key in Connectors page. Hunts will auto-sync.</p>
              </div>
              <div className="p-3 rounded-lg bg-[hsl(222,20%,5%)] space-y-1">
                <p className="font-medium text-white">3. Enable SOAR Automation</p>
                <p>Playbooks will trigger automatically when specific alerts are detected. Configure trigger rules in Settings.</p>
              </div>
              <div className="p-3 rounded-lg bg-[hsl(222,20%,5%)] space-y-1">
                <p className="font-medium text-white">4. MITRE Mapping</p>
                <p>Detections are automatically mapped to MITRE ATT&CK techniques. Verify mapping in the MITRE page.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
