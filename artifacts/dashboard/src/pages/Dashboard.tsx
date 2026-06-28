import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Shield, Activity, AlertTriangle, FileText, TrendingUp,
  Server, Terminal, ShieldAlert, ArrowUpRight, Clock,
  CheckCircle, XCircle, AlertCircle,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from "recharts";

// ── Mock ──
const statCards = [
  { label: "Active Threats", value: 7, change: "+3", icon: ShieldAlert, color: "from-rose-500 to-pink-600" },
  { label: "Open Sessions",  value: 24, change: "+12", icon: Activity,    color: "from-amber-500 to-orange-600" },
  { label: "Hunts Completed",value: 156, change: "+43", icon: Terminal,   color: "from-emerald-500 to-teal-600" },
  { label: "Alerts Today",   value: 89, change: "+5%", icon: AlertCircle,color: "from-cyan-500 to-blue-600" },
];

const pieData = [
  { name: "Critical", value: 7, color: "#f43f5e" },
  { name: "High",     value: 14,color: "#f97316" },
  { name: "Medium",   value: 28,color: "#eab308" },
  { name: "Low",      value: 41,color: "#22c55e" },
];

const barData = [
  { name: "Mon", alerts: 42, resolved: 28 },
  { name: "Tue", alerts: 38, resolved: 31 },
  { name: "Wed", alerts: 55, resolved: 44 },
  { name: "Thu", alerts: 29, resolved: 22 },
  { name: "Fri", alerts: 47, resolved: 39 },
  { name: "Sat", alerts: 18, resolved: 15 },
  { name: "Sun", alerts: 12, resolved: 10 },
];

const recentAlerts = [
  { id: 1, title: "Suspicious PowerShell Execution", severity: "critical", source: "Wazuh", time: "2m ago", agent: "WIN-LAP-01" },
  { id: 2, title: "Mimikatz Detection on DC-01", severity: "critical", source: "Velociraptor", time: "5m ago", agent: "DC-01" },
  { id: 3, title: "RDP Brute Force Attempt", severity: "high", source: "Wazuh", time: "8m ago", agent: "SRV-WEB-02" },
  { id: 4, title: "New Service Installed", severity: "medium", source: "TheHive", time: "12m ago", agent: "DB-MAIN" },
  { id: 5, title: "USB Device Connected", severity: "low", source: "Velociraptor", time: "15m ago", agent: "FIN-LAP-03" },
  { id: 6, title: "Phishing Email Reported", severity: "medium", source: "TheHive", time: "20m ago", agent: "All Users" },
];

const sevConfig: Record<string, { color: string; bg: string; icon: any }> = {
  critical: { color: "text-rose-400", bg: "bg-rose-500/10", icon: XCircle },
  high:     { color: "text-orange-400", bg: "bg-orange-500/10", icon: AlertTriangle },
  medium:   { color: "text-yellow-400", bg: "bg-yellow-500/10", icon: AlertCircle },
  low:      { color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle },
};

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Overview</h1>
          <p className="text-sm text-[hsl(222,12%,52%)] mt-0.5">Real-time security posture monitoring</p>
        </div>
        <Link href="/sessions">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition-all">
            <TrendingUp className="h-4 w-4" /> New Triage Session
          </button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="relative group">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity" style={{backgroundImage: `linear-gradient(to bottom right, ${s.color})`}} />
              <div className="relative rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4 flex items-start gap-3">
                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${s.color} shadow-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[hsl(222,12%,52%)] uppercase tracking-wider font-medium">{s.label}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-white">{s.value}</span>
                    <span className="text-xs font-semibold text-emerald-400">{s.change}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Pie */}
        <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[hsl(222,12%,52%)] mb-3">Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                {pieData.map((e,i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{background:'hsl(222,22%,10%)',border:'1px solid hsl(222,16%,18%)',borderRadius:'8px',color:'#fff'}} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            {pieData.map(e => (
              <div key={e.name} className="flex items-center gap-1.5 text-xs text-[hsl(222,12%,55%)]">
                <span className="w-2 h-2 rounded-full" style={{backgroundColor:e.color}} />
                {e.name}
              </div>
            ))}
          </div>
        </div>

        {/* Bar */}
        <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[hsl(222,12%,52%)] mb-3">Weekly Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{fill:'hsl(222,12%,45%)',fontSize:10}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:'hsl(222,12%,45%)',fontSize:10}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{background:'hsl(222,22%,10%)',border:'1px solid hsl(222,16%,18%)',borderRadius:'8px',color:'#fff'}} />
              <Bar dataKey="alerts" fill="#06b6d4" radius={[3,3,0,0]} />
              <Bar dataKey="resolved" fill="#10b981" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Area */}
        <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[hsl(222,12%,52%)] mb-3">Active Sources</h3>
          <div className="space-y-3 mt-2">
            {[
              { name: "Wazuh", active: true, alerts: 142, icon: Shield },
              { name: "Velociraptor", active: true, alerts: 87, icon: Terminal },
              { name: "TheHive", active: true, alerts: 53, icon: Activity },
              { name: "Custom SIEM", active: false, alerts: 0, icon: Server },
            ].map(src => (
              <div key={src.name} className="flex items-center justify-between p-2.5 rounded-lg bg-[hsl(222,20%,5%)]/50">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-md ${src.active ? 'bg-emerald-500/10' : 'bg-[hsl(222,16%,12%)]'}`}>
                    <src.icon className={`h-3.5 w-3.5 ${src.active ? 'text-emerald-400' : 'text-[hsl(222,12%,35%)]'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{src.name}</p>
                    <p className="text-[10px] text-[hsl(222,12%,45%)]">{src.active ? `${src.alerts} alerts` : 'Disconnected'}</p>
                  </div>
                </div>
                <span className={`w-1.5 h-1.5 rounded-full ${src.active ? 'bg-emerald-400' : 'bg-[hsl(222,12%,30%)]'}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[hsl(222,16%,14%)]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[hsl(222,12%,52%)]">Recent Alerts</h3>
          <Link href="/alerts" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">View all &rarr;</Link>
        </div>
        <div className="divide-y divide-[hsl(222,16%,12%)]">
          {recentAlerts.map(a => {
            const cfg = sevConfig[a.severity];
            const Icon = cfg.icon;
            return (
              <div key={a.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[hsl(222,20%,6%)] transition-colors group">
                <div className={`p-1.5 rounded-md ${cfg.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">{a.title}</p>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${cfg.color} ${cfg.bg}`}>{a.severity}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-[hsl(222,12%,45%)] mt-0.5">
                    <span>{a.source}</span>
                    <span className="w-1 h-1 rounded-full bg-[hsl(222,12%,30%)]" />
                    <span>{a.agent}</span>
                    <span className="w-1 h-1 rounded-full bg-[hsl(222,12%,30%)]" />
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{a.time}</span>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-[hsl(222,12%,30%)] group-hover:text-cyan-400 transition-colors" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
