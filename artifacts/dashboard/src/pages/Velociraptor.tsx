import { useState } from "react";
import { Search, Terminal, Download, AlertTriangle, CheckCircle, Clock, Activity, FileText, ArrowUpRight } from "lucide-react";

const hunts = [
  { id: 1, name: "Suspicious Process Scan", query: "select * from processes where name like '%powershell%' or name like '%cmd%'", status: "completed", artifacts: 124, hits: 7, created: "2h ago", agent: "All" },
  { id: 2, name: "Persistence Check", query: "select * from startup_items", status: "running", artifacts: 89, hits: 3, created: "5m ago", agent: "Windows*" },
  { id: 3, name: "Network Connections", query: "select * from netstat where state = 'LISTEN'", status: "completed", artifacts: 256, hits: 23, created: "6h ago", agent: "All" },
  { id: 4, name: "Registry Anomalies", query: "select * from registry where path like '%Run%'", status: "pending", artifacts: 0, hits: 0, created: "1m ago", agent: "Windows*" },
  { id: 5, name: "Linux Rootkit Detection", query: "select * from kernel_modules", status: "completed", artifacts: 45, hits: 1, created: "1d ago", agent: "Linux*" },
];

const artifacts = [
  { id: 1, name: "powershell_encoded_command.ps1", type: "File", size: "12KB", host: "WIN-LAP-01", hunt: 1, hash: "a1b2c3d4..." },
  { id: 2, name: "svchost_network_connections.json", type: "JSON", size: "4KB", host: "DC-01", hunt: 3, hash: "e5f6g7h8..." },
  { id: 3, name: "startup_items.csv", type: "CSV", size: "2KB", host: "SERVER-03", hunt: 2, hash: "i9j0k1l2..." },
  { id: 4, name: "registry_run_entries.txt", type: "Text", size: "1KB", host: "WIN-LAP-01", hunt: 4, hash: "m3n4o5p6..." },
  { id: 5, name: "kernel_module_list.csv", type: "CSV", size: "8KB", host: "UBUNTU-SRV", hunt: 5, hash: "q7r8s9t0..." },
  { id: 6, name: "dns_queries_export.json", type: "JSON", size: "24KB", host: "DC-01", hunt: 3, hash: "u1v2w3x4..." },
];

export default function Velociraptor() {
  const [tab, setTab] = useState<"hunts" | "artifacts">("hunts");
  const [search, setSearch] = useState("");

  const filteredHunts = hunts.filter(h => h.name.toLowerCase().includes(search.toLowerCase()));
  const filteredArtifacts = artifacts.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
            <Terminal className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Velociraptor</h1>
            <p className="text-xs text-[hsl(222,12%,52%)]">Endpoint visibility & hunt artifacts</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(222,12%,35%)]" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[hsl(222,16%,14%)] bg-[hsl(222,20%,5%)] text-sm text-white placeholder:text-[hsl(222,12%,35%)] focus:outline-none focus:ring-1 focus:ring-cyan-500"
          placeholder="Search hunts & artifacts..." />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active Hunts", value: hunts.filter(h => h.status === "running").length, color: "text-cyan-400", desc: "In progress" },
          { label: "Artifacts Collected", value: artifacts.reduce((a, h) => a + h.hits, 0), color: "text-emerald-400", desc: "Suspicious" },
          { label: "Total Artifacts", value: artifacts.length, color: "text-white", desc: "All time" },
          { label: "Coverage", value: "78%", color: "text-violet-400", desc: "12 endpoints" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
            <p className="text-[10px] text-[hsl(222,12%,52%)] uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-[hsl(222,12%,45%)] mt-0.5">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[hsl(222,20%,5%)] w-fit">
        <button onClick={() => setTab("hunts")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === "hunts" ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400' : 'text-[hsl(222,12%,52%)] hover:text-white'}`}>
          <Terminal className="h-3.5 w-3.5 inline mr-1.5" />Hunts
        </button>
        <button onClick={() => setTab("artifacts")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === "artifacts" ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400' : 'text-[hsl(222,12%,52%)] hover:text-white'}`}>
          <FileText className="h-3.5 w-3.5 inline mr-1.5" />Artifacts
        </button>
      </div>

      {tab === "hunts" ? (
        <div className="space-y-3">
          {filteredHunts.map(h => (
            <div key={h.id} className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4 hover:border-[hsl(195,100%,50%)]/20 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-md ${h.status === 'completed' ? 'bg-emerald-500/10' : h.status === 'running' ? 'bg-cyan-500/10' : 'bg-[hsl(222,16%,12%)]'}`}>
                    {h.status === 'completed' ? <CheckCircle className="h-4 w-4 text-emerald-400" /> :
                     h.status === 'running' ? <Activity className="h-4 w-4 text-cyan-400 animate-spin" /> :
                     <Clock className="h-4 w-4 text-[hsl(222,12%,35%)]" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{h.name}</p>
                    <p className="text-xs text-[hsl(222,12%,45%)] mt-0.5 font-mono">{h.query.slice(0, 80)}...</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                  h.status === 'completed' ? 'text-emerald-400 bg-emerald-500/10' :
                  h.status === 'running' ? 'text-cyan-400 bg-cyan-500/10' : 'text-[hsl(222,12%,35%)] bg-[hsl(222,16%,12%)]'
                }`}>{h.status}</span>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-[hsl(222,12%,45%)]">
                <span>{h.artifacts} artifacts</span>
                <span>{h.hits} hits</span>
                <span>{h.agent}</span>
                <span className="ml-auto">{h.created}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 overflow-hidden">
          <div className="grid grid-cols-7 gap-2 px-5 py-2.5 bg-[hsl(222,20%,5%)] text-[10px] font-bold text-[hsl(222,12%,45%)] uppercase tracking-wider">
            <span>Name</span><span>Type</span><span>Size</span><span>Host</span><span>Hash</span><span>Hunt</span><span />
          </div>
          <div className="divide-y divide-[hsl(222,16%,12%)]">
            {filteredArtifacts.map(a => (
              <div key={a.id} className="grid grid-cols-7 gap-2 px-5 py-3 text-sm items-center hover:bg-[hsl(222,20%,6%)] transition-colors group">
                <span className="text-white text-xs truncate">{a.name}</span>
                <span className="text-[hsl(222,12%,52%)] text-xs">{a.type}</span>
                <span className="text-[hsl(222,12%,52%)] text-xs">{a.size}</span>
                <span className="text-[hsl(222,12%,52%)] text-xs">{a.host}</span>
                <span className="text-[hsl(222,12%,45%)] text-xs font-mono">{a.hash}</span>
                <span className="text-xs text-cyan-400">#{a.hunt}</span>
                <div className="flex items-center gap-1 justify-end">
                  <Download className="h-3.5 w-3.5 text-[hsl(222,12%,30%)] hover:text-cyan-400 transition-colors cursor-pointer" />
                  <ArrowUpRight className="h-3.5 w-3.5 text-[hsl(222,12%,30%)] group-hover:text-cyan-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
