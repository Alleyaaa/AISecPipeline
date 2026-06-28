import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, BarChart3, Database, FileText, List, RefreshCw, ShieldAlert, Zap, DollarSign } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";

// Mock Data
const MOCK_SESSIONS = [
  { id: "SESS-001", title: "Ransomware Cleanup", status: "analyzed", logCount: 1245, createdAt: "2026-06-28T10:00:00Z" },
  { id: "SESS-002", title: "Brute Force Response", status: "analyzed", logCount: 5600, createdAt: "2026-06-27T09:00:00Z" },
  { id: "SESS-003", title: "Phishing Hunt", status: "open", logCount: 0, createdAt: "2026-06-28T12:30:00Z" },
];
const MOCK_REPORTS = [
  { id: "REP-001", sessionId: "SESS-001", summary: "LockBit 3.0 detected...", severity: "critical", createdAt: "2026-06-28T14:05:00Z" },
  { id: "REP-002", sessionId: "SESS-003", summary: "Brute force attack mitigated...", severity: "high", createdAt: "2026-06-27T09:15:00Z" },
];

export default function Usage() {
  const [activeTab, setActiveTab] = useState("overview");
  // Pakai mock data kalau API gagal/kosong
  const sessions = MOCK_SESSIONS;
  const reports = MOCK_REPORTS;

  const totalSessions = sessions.length;
  const totalReports = reports.length;
  const totalLogs = sessions.reduce((s, i) => s + i.logCount, 0);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono uppercase text-foreground">Usage Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">System performance & AI consumption metrics</p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard title="Sessions" value={totalSessions} icon={List} color="text-blue-400" />
        <StatCard title="Reports" value={totalReports} icon={FileText} color="text-purple-400" />
        <StatCard title="Log Entries" value={totalLogs} icon={Database} color="text-cyan-400" />
        <StatCard title="Est. Tokens" value="45,200" icon={Zap} color="text-yellow-400" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card className="h-[300px] p-6 bg-card border-card-border">
             <h3 className="text-sm font-semibold mb-4">Daily Activity (Mock)</h3>
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={[{date: "Jun 27", sessions: 2, logs: 5600}, {date: "Jun 28", sessions: 1, logs: 1245}]}>
                 <CartesianGrid strokeDasharray="3 3" />
                 <XAxis dataKey="date" />
                 <YAxis />
                 <Tooltip />
                 <Area type="monotone" dataKey="sessions" stroke="#3b82f6" fill="#3b82f6" />
               </AreaChart>
             </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <Card className="bg-card border-card-border">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <Icon className={`h-8 w-8 opacity-20 ${color}`} />
      </CardContent>
    </Card>
  );
}
