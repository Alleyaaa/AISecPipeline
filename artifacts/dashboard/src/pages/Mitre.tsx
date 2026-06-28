import { useState } from "react";
import { Target, Search, ChevronDown, AlertTriangle, Shield, ShieldAlert, ExternalLink, Filter } from "lucide-react";

// MITRE ATT&CK Matrix v14 - simplified
const tactics = [
  { id: "TA0043", name: "Reconnaissance", techs: ["T1595", "T1592", "T1590", "T1589"] },
  { id: "TA0001", name: "Initial Access", techs: ["T1566", "T1078", "T1133", "T1190", "T1091"] },
  { id: "TA0002", name: "Execution", techs: ["T1059", "T1204", "T1047", "T1053", "T1106"] },
  { id: "TA0003", name: "Persistence", techs: ["T1547", "T1053", "T1505", "T1136", "T1098"] },
  { id: "TA0004", name: "Priv Esc", techs: ["T1548", "T1068", "T1055", "T1078", "T1134"] },
  { id: "TA0005", name: "Defense Evasion", techs: ["T1562", "T1070", "T1055", "T1036", "T1027"] },
  { id: "TA0006", name: "Cred Access", techs: ["T1003", "T1110", "T1555", "T1056", "T1552"] },
  { id: "TA0007", name: "Discovery", techs: ["T1087", "T1069", "T1082", "T1016", "T1049"] },
  { id: "TA0008", name: "Lateral Move", techs: ["T1021", "T1570", "T1550", "T1091", "T1210"] },
  { id: "TA0009", name: "Collection", techs: ["T1005", "T1056", "T1114", "T1213", "T1560"] },
  { id: "TA0011", name: "C2", techs: ["T1071", "T1573", "T1572", "T1095", "T1102"] },
  { id: "TA0040", name: "Impact", techs: ["T1486", "T1565", "T1490", "T1489", "T1499"] },
];

const techniqueData: Record<string, { name: string; alerts: number; severity: string; hunt: boolean }> = {
  "T1566": { name: "Phishing", alerts: 12, severity: "high", hunt: true },
  "T1078": { name: "Valid Accounts", alerts: 8, severity: "medium", hunt: false },
  "T1059": { name: "Command & Scripting", alerts: 23, severity: "critical", hunt: true },
  "T1003": { name: "OS Credential Dumping", alerts: 4, severity: "critical", hunt: true },
  "T1110": { name: "Brute Force", alerts: 15, severity: "high", hunt: false },
  "T1021": { name: "Remote Services", alerts: 7, severity: "medium", hunt: true },
  "T1486": { name: "Data Encrypted for Impact", alerts: 2, severity: "critical", hunt: true },
  "T1547": { name: "Boot/Logon Autostart", alerts: 6, severity: "medium", hunt: true },
  "T1562": { name: "Impair Defenses", alerts: 9, severity: "high", hunt: true },
  "T1071": { name: "Application Layer Protocol", alerts: 11, severity: "medium", hunt: false },
  "T1091": { name: "Replication Through Removable Media", alerts: 3, severity: "medium", hunt: true },
  "T1190": { name: "Exploit Public-Facing Application", alerts: 5, severity: "high", hunt: false },
  "T1133": { name: "External Remote Services", alerts: 4, severity: "medium", hunt: false },
  "T1047": { name: "WMI", alerts: 8, severity: "medium", hunt: true },
  "T1204": { name: "User Execution", alerts: 14, severity: "medium", hunt: false },
};

const sevColors: Record<string, string> = {
  critical: "bg-rose-500/15 text-rose-400 border-rose-500/25",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
};

export default function Mitre() {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const selectedTech = selected ? techniqueData[selected] : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/20">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">MITRE ATT&CK</h1>
            <p className="text-xs text-[hsl(222,12%,52%)]">Adversarial tactics, techniques & detection coverage</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(222,12%,35%)]" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[hsl(222,16%,14%)] bg-[hsl(222,20%,5%)] text-sm text-white placeholder:text-[hsl(222,12%,35%)] focus:outline-none focus:ring-1 focus:ring-cyan-500"
          placeholder="Search techniques..." />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Tactics", value: tactics.length, icon: Target, color: "text-red-400" },
          { label: "Techniques", value: Object.keys(techniqueData).length, icon: Shield, color: "text-cyan-400" },
          { label: "Alerts Mapped", value: Object.values(techniqueData).reduce((a, t) => a + t.alerts, 0), icon: AlertTriangle, color: "text-amber-400" },
          { label: "Huntable", value: Object.values(techniqueData).filter(t => t.hunt).length, icon: Search, color: "text-emerald-400" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
            <div className="flex items-center gap-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <p className="text-[10px] text-[hsl(222,12%,52%)] uppercase tracking-wider">{s.label}</p>
            </div>
            <p className={`text-2xl font-bold mt-2 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          <div className="grid grid-cols-12 gap-1">
            {tactics.map(t => (
              <div key={t.id} className="flex flex-col gap-1">
                <div className="bg-gradient-to-b from-[hsl(222,20%,8%)] to-[hsl(222,18%,6%)] border border-[hsl(222,16%,14%)] rounded-lg p-2 text-center">
                  <p className="text-[7px] text-[hsl(222,12%,35%)] font-mono">{t.id}</p>
                  <p className="text-[9px] font-bold text-[hsl(222,12%,60%)] uppercase leading-tight">{t.name}</p>
                </div>
                {t.techs.map(tid => {
                  const td = techniqueData[tid];
                  if (!td) return <div key={tid} className="rounded-lg border border-[hsl(222,16%,10%)] bg-[hsl(222,18%,5%)]/50 p-2 min-h-[48px] flex items-center justify-center"><span className="text-[7px] text-[hsl(222,12%,20%)] font-mono">{tid}</span></div>;
                  const sc = sevColors[td.severity] || sevColors.medium;
                  return (
                    <button key={tid} onClick={() => setSelected(tid === selected ? null : tid)}
                      className={`rounded-lg border p-2 text-left transition-all hover:scale-[1.02] ${selected === tid ? 'border-cyan-500/40 ring-1 ring-cyan-500/30' : 'border-[hsl(222,16%,14%)]'} ${sc}`}>
                      <p className="text-[7px] font-mono opacity-60">{tid}</p>
                      <p className="text-[9px] font-semibold text-white leading-tight mt-0.5">{td.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`text-[7px] font-bold px-1 rounded ${
                          td.severity === 'critical' ? 'bg-rose-500/20 text-rose-300' :
                          td.severity === 'high' ? 'bg-orange-500/20 text-orange-300' : 'bg-yellow-500/20 text-yellow-300'
                        }`}>{td.alerts}</span>
                        {td.hunt && <span className="text-[7px] text-emerald-400">🕵️Hunt</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selected && selectedTech && (
        <div className="rounded-xl border border-cyan-500/20 bg-[hsl(222,18%,8%)]/90 p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{selected}</h3>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${sevColors[selectedTech.severity]}`}>{selectedTech.severity}</span>
                {selectedTech.hunt && <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Velociraptor Hunt Available</span>}
              </div>
              <p className="text-base text-white mt-1">{selectedTech.name}</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20">
              <ExternalLink className="h-3.5 w-3.5" /> View in MITRE
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="p-3 rounded-lg bg-[hsl(222,20%,5%)]">
              <p className="text-[10px] text-[hsl(222,12%,52%)] uppercase tracking-wider">Total Alerts</p>
              <p className="text-xl font-bold text-white mt-1">{selectedTech.alerts}</p>
            </div>
            <div className="p-3 rounded-lg bg-[hsl(222,20%,5%)]">
              <p className="text-[10px] text-[hsl(222,12%,52%)] uppercase tracking-wider">Detection Coverage</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">{selectedTech.hunt ? 'Active' : 'Limited'}</p>
            </div>
            <div className="p-3 rounded-lg bg-[hsl(222,20%,5%)]">
              <p className="text-[10px] text-[hsl(222,12%,52%)] uppercase tracking-wider">Source</p>
              <p className="text-xl font-bold text-cyan-400 mt-1">{selectedTech.hunt ? 'Wazuh + Velociraptor' : 'Wazuh'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
