import { useState, useMemo } from "react";
import {
  useListSessions,
  useListReports,
  getListSessionsQueryKey,
  getListReportsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity, BarChart3, Clock, Database, FileText,
  Layers, List, RefreshCw, ShieldAlert, TrendingUp, Zap, DollarSign,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import { format, subDays, startOfDay, isAfter } from "date-fns";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
  informational: "#3b82f6",
};

const STATUS_COLORS: Record<string, string> = {
  open: "#3b82f6",
  analyzing: "#eab308",
  analyzed: "#22c55e",
  closed: "#6b7280",
};

export default function Usage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [activeTab, setActiveTab] = useState("overview");

  const { data: sessions, isLoading: sessionsLoading, refetch: refetchSessions } = useListSessions({
    query: { queryKey: getListSessionsQueryKey() },
  });
  const { data: reports, isLoading: reportsLoading, refetch: refetchReports } = useListReports({
    query: { queryKey: getListReportsQueryKey() },
  });

  const isLoading = sessionsLoading || reportsLoading;

  const cutoffDate = useMemo(() => {
    if (timeRange === "all") return new Date(0);
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    return subDays(new Date(), days);
  }, [timeRange]);

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions.filter((s) => isAfter(new Date(s.createdAt), cutoffDate));
  }, [sessions, cutoffDate]);

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    return reports.filter((r) => isAfter(new Date(r.createdAt), cutoffDate));
  }, [reports, cutoffDate]);

  const totalSessions = filteredSessions.length;
  const totalReports = filteredReports.length;
  const totalLogs = filteredSessions.reduce((sum, s) => sum + (s.logCount || 0), 0);
  const avgLogsPerSession = totalSessions > 0 ? Math.round(totalLogs / totalSessions) : 0;

  // Hitung active sources dari session logs (unique sources)
  const activeSources = useMemo(() => {
    const sources = new Set<string>();
    filteredSessions.forEach((s) => {
      if (s.sources && Array.isArray(s.sources)) {
        s.sources.forEach((src: string) => { if (src && src !== "unknown") sources.add(src); });
      }
    });
    return sources.size;
  }, [filteredSessions]);

  // Estimasi token & cost (gemini-2.5-flash pricing)
  // ~2000 tokens input + ~1500 tokens output per analysis
  // Input: $0.075/1M tokens, Output: $0.30/1M tokens (gemini-2.5-flash)
  const totalAnalyses = filteredSessions.filter((s) => s.status === "analyzed").length;
  const estimatedInputTokens = totalAnalyses * 2000;
  const estimatedOutputTokens = totalAnalyses * 1500;
  const estimatedTotalTokens = estimatedInputTokens + estimatedOutputTokens;
  // Cost in USD
  const costUsd = (estimatedInputTokens / 1_000_000 * 0.075) + (estimatedOutputTokens / 1_000_000 * 0.30);
  // Convert to IDR (approx rate)
  const USD_TO_IDR = 16200;
  const costIdr = costUsd * USD_TO_IDR;
  const formatIdr = (val: number) => val < 1 
    ? "< Rp 1" 
    : `Rp ${Math.ceil(val).toLocaleString("id-ID")}`;

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSessions.forEach((s) => {
      counts[s.status] = (counts[s.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      status, count, fill: STATUS_COLORS[status] || "#6b7280",
    }));
  }, [filteredSessions]);

  const severityBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredReports.forEach((r) => {
      counts[r.severity] = (counts[r.severity] || 0) + 1;
    });
    return Object.entries(counts).map(([severity, count]) => ({
      severity, count, fill: SEVERITY_COLORS[severity] || "#6b7280",
    }));
  }, [filteredReports]);

  const dailyActivity = useMemo(() => {
    const days = timeRange === "all" ? 30 : timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const data: { date: string; sessions: number; logs: number; reports: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      const dayStr = format(day, "MMM dd");
      const daySessions = filteredSessions.filter((s) => format(new Date(s.createdAt), "MMM dd") === dayStr);
      data.push({
        date: dayStr,
        sessions: daySessions.length,
        logs: daySessions.reduce((sum, s) => sum + (s.logCount || 0), 0),
        reports: filteredReports.filter((r) => format(new Date(r.createdAt), "MMM dd") === dayStr).length,
      });
    }
    return data;
  }, [filteredSessions, filteredReports, timeRange]);

  const handleRefresh = () => {
    refetchSessions();
    refetchReports();
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono uppercase text-foreground">
            Usage Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            System usage metrics and performance analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted rounded-md p-1">
            {(["7d", "30d", "90d", "all"] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "secondary" : "ghost"}
                size="sm"
                className="text-xs h-7 px-3"
                onClick={() => setTimeRange(range)}
              >
                {range === "all" ? "All Time" : range}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-2 h-7" onClick={handleRefresh}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Sessions" value={totalSessions} loading={isLoading} icon={List} color="text-blue-400"
          subtitle={`${filteredSessions.filter((s) => s.status === "analyzed").length} analyzed`} />
        <StatCard title="Reports" value={totalReports} loading={isLoading} icon={FileText} color="text-purple-400"
          subtitle={`${filteredReports.filter((r) => r.severity === "critical" || r.severity === "high").length} critical/high`} />
        <StatCard title="Log Entries" value={totalLogs} loading={isLoading} icon={Database} color="text-cyan-400"
          subtitle={`${avgLogsPerSession} avg/session`} />
        <StatCard title="Active Sources" value={activeSources} loading={isLoading} icon={Layers} color="text-orange-400"
          subtitle="from session logs" />
        <StatCard title="Est. Tokens Used" value={estimatedTotalTokens.toLocaleString()} loading={isLoading} icon={Zap} color="text-yellow-400"
          subtitle={`${totalAnalyses} AI analyses`} />
        <StatCard title="Est. AI Cost" value={formatIdr(costIdr)} loading={isLoading} icon={DollarSign} color="text-green-400"
          subtitle={`≈ $${costUsd.toFixed(4)} USD`} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview" className="gap-2 text-xs">
            <Activity className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2 text-xs">
            <List className="h-3.5 w-3.5" /> Sessions
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2 text-xs">
            <ShieldAlert className="h-3.5 w-3.5" /> Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="bg-card border-card-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono uppercase flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Daily Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoading ? <Skeleton className="w-full h-full" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorLogs" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="sessions" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSessions)" />
                      <Area type="monotone" dataKey="logs" stroke="#06b6d4" fillOpacity={1} fill="url(#colorLogs)" />
                      <Area type="monotone" dataKey="reports" stroke="#a855f7" fillOpacity={0.1} fill="#a855f7" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-card-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono uppercase flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-primary" /> Severity Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                {isLoading ? <Skeleton className="w-full h-full" /> : severityBreakdown.length === 0 ? (
                  <EmptyState message="No report data" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={severityBreakdown} dataKey="count" nameKey="severity" cx="40%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4}>
                        {severityBreakdown.map((entry) => <Cell key={entry.severity} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontSize: 12 }} />
                      <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" iconSize={8}
                        formatter={(value) => <span style={{ fontSize: 11, textTransform: "capitalize" }}>{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4 mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 bg-card border-card-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono uppercase flex items-center gap-2">
                  <List className="h-4 w-4 text-primary" /> Session Status Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[280px] flex items-center justify-center">
                {isLoading ? <Skeleton className="w-full h-full" /> : statusBreakdown.length === 0 ? (
                  <EmptyState message="No session data" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusBreakdown} dataKey="count" nameKey="status" cx="40%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4}>
                        {statusBreakdown.map((entry) => <Cell key={entry.status} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontSize: 12 }} />
                      <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" iconSize={8}
                        formatter={(value) => <span style={{ fontSize: 11, textTransform: "capitalize" }}>{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-card-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono uppercase flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : filteredSessions.length === 0 ? <EmptyState message="No sessions" /> : (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto">
                    {filteredSessions.slice(0, 10).map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted/30 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{session.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {session.logCount} logs · {format(new Date(session.createdAt), "MMM d, HH:mm")}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-mono uppercase shrink-0"
                          style={{ borderColor: STATUS_COLORS[session.status] || "#6b7280", color: STATUS_COLORS[session.status] || "#6b7280" }}>
                          {session.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4 mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 bg-card border-card-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono uppercase flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-primary" /> Severity Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                {isLoading ? <Skeleton className="w-full h-full" /> : severityBreakdown.length === 0 ? (
                  <EmptyState message="No report data" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={severityBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="severity" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontSize: 12 }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {severityBreakdown.map((entry) => <Cell key={entry.severity} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-card-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono uppercase flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Recent Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : filteredReports.length === 0 ? <EmptyState message="No reports" /> : (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto">
                    {filteredReports.slice(0, 10).map((report) => (
                      <div key={report.id} className="flex items-center gap-2 p-2.5 rounded-md hover:bg-muted/30 transition-colors">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SEVERITY_COLORS[report.severity] || "#6b7280" }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate">Session #{report.sessionId}</p>
                          <p className="text-xs text-muted-foreground truncate">{report.summary.slice(0, 40)}...</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(report.createdAt), "MMM d")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, loading, color = "text-foreground", subtitle }: {
  title: string; value: number; icon: React.ElementType; loading: boolean; color?: string; subtitle?: string;
}) {
  return (
    <Card className="bg-card border-card-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        {loading ? <Skeleton className="h-8 w-16" /> : (
          <>
            <div className={`text-3xl font-bold font-mono ${color}`}>{value}</div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
      <BarChart3 className="h-8 w-8 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
