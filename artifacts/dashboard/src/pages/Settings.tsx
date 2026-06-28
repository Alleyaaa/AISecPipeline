import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { KeyRound, Bot, Eye, EyeOff, CheckCircle, Shield, Gauge, Info, Clock, Lock, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

const TABS = ["AI Model", "Analysis", "Security", "Rate Limits"] as const;
type Tab = typeof TABS[number];

const AI_MODELS = [
  { id: "gemini-2.5-flash",          label: "Gemini 2.5 Flash",          badge: "Default",   desc: "Speed & quality balanced — recommended" },
  { id: "gemini-2.5-pro",            label: "Gemini 2.5 Pro",            badge: "Powerful",  desc: "Most capable, slower & more expensive" },
  { id: "gemini-2.5-flash-lite",     label: "Gemini 2.5 Flash Lite",     badge: "Fast",      desc: "Fastest & cheapest, lower quality" },
];

const SETTINGS_KEY = "soc_ai_settings";
const ANALYSIS_SETTINGS_KEY = "soc_analysis_settings";

function loadAiSettings() {
  try {
    const r = localStorage.getItem(SETTINGS_KEY);
    return r ? JSON.parse(r) : { model: "gemini-2.5-flash" };
  } catch { return { model: "gemini-2.5-flash" }; }
}

function loadAnalysisSettings() {
  try {
    const r = localStorage.getItem(ANALYSIS_SETTINGS_KEY);
    return r ? JSON.parse(r) : {
      maskIpsByDefault: true,
      autoDetectSource: true,
      maxLogsPerSession: 500,
      threatScoreThresholdCritical: 80,
      threatScoreThresholdHigh: 55,
      threatScoreThresholdMedium: 30,
      defaultVerdictOnManual: "need_investigation",
    };
  } catch {
    return {
      maskIpsByDefault: true,
      autoDetectSource: true,
      maxLogsPerSession: 500,
      threatScoreThresholdCritical: 80,
      threatScoreThresholdHigh: 55,
      threatScoreThresholdMedium: 30,
      defaultVerdictOnManual: "need_investigation",
    };
  }
}

export default function Settings() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab]     = useState<Tab>("AI Model");
  const [aiSettings, setAiSettings]   = useState(loadAiSettings);
  const [analysisSettings, setAnalysisSettings] = useState(loadAnalysisSettings);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass]         = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [n8nUrl, setN8nUrl]           = useState("");
  const [n8nLoading, setN8nLoading]   = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    analyze: { remaining: number | null; resetAt: string | null };
    general: { remaining: number | null; resetAt: string | null };
  }>({ analyze: { remaining: null, resetAt: null }, general: { remaining: null, resetAt: null } });

  // Load n8n webhook URL from server
  useEffect(() => {
    if (activeTab !== "Security") return;
    fetch("/api/n8n-config", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d?.webhookUrl) setN8nUrl(d.webhookUrl); })
      .catch(() => {});
  }, [activeTab, token]);

  // Probe rate limit headers
  useEffect(() => {
    if (activeTab !== "Rate Limits") return;
    fetch("/api/health", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        const remaining = r.headers.get("RateLimit-Remaining");
        const reset = r.headers.get("RateLimit-Reset");
        setRateLimitInfo((prev) => ({
          ...prev,
          general: {
            remaining: remaining ? Number(remaining) : null,
            resetAt: reset ? new Date(Number(reset) * 1000).toLocaleTimeString() : null,
          },
        }));
      })
      .catch(() => {});
  }, [activeTab, token]);

  const handleSaveAi = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(aiSettings));
    toast.success("AI settings saved");
  };

  const handleSaveAnalysis = () => {
    localStorage.setItem(ANALYSIS_SETTINGS_KEY, JSON.stringify(analysisSettings));
    toast.success("Analysis settings saved");
  };

  const handleSaveN8n = async () => {
    setN8nLoading(true);
    try {
      const res = await fetch("/api/n8n-config", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ webhookUrl: n8nUrl || null }),
      });
      if (!res.ok) throw new Error("Failed to save n8n config");
      toast.success("n8n webhook URL saved");
    } catch {
      toast.error("Failed to save n8n webhook URL");
    } finally {
      setN8nLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPass || !newPass || !confirmPass) { toast.error("All fields required"); return; }
    if (newPass !== confirmPass) { toast.error("Passwords don't match"); return; }
    if (newPass.length < 8) { toast.error("Min 8 characters"); return; }
    setPassLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ current_password: currentPass, new_password: newPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Password changed successfully");
      setCurrentPass(""); setNewPass(""); setConfirmPass("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally { setPassLoading(false); }
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-mono uppercase text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Preferences, security, and system configuration</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/40 p-1 rounded-lg flex-wrap border border-border">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── AI MODEL TAB ── */}
      {activeTab === "AI Model" && (
        <Card className="bg-card border-card-border">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" /> AI Model
            </CardTitle>
            <CardDescription>
              Model used for log analysis and threat detection.
              Set your Gemini API key in <strong>Connectors</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {AI_MODELS.map((model) => (
              <button key={model.id}
                onClick={() => setAiSettings((s: Record<string, unknown>) => ({ ...s, model: model.id }))}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                  aiSettings.model === model.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-muted-foreground hover:bg-muted/30"
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    aiSettings.model === model.id ? "bg-primary" : "bg-muted-foreground/30"
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{model.label}</p>
                    <p className="text-xs text-muted-foreground">{model.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px]">{model.badge}</Badge>
                  {aiSettings.model === model.id && <CheckCircle className="h-4 w-4 text-primary" />}
                </div>
              </button>
            ))}
          </CardContent>
          <CardFooter className="border-t border-border pt-4">
            <Button size="sm" onClick={handleSaveAi}>Save</Button>
          </CardFooter>
        </Card>
      )}

      {/* ── ANALYSIS SETTINGS TAB ── */}
      {activeTab === "Analysis" && (
        <div className="space-y-4">
          <Card className="bg-card border-card-border">
            <CardHeader>
              <CardTitle className="text-sm font-mono uppercase flex items-center gap-2">
                <Gauge className="h-4 w-4 text-primary" /> Analysis Defaults
              </CardTitle>
              <CardDescription>Configure default behavior when analyzing sessions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Mask IPs by Default</Label>
                  <p className="text-xs text-muted-foreground">Automatically mask IP addresses before sending to AI</p>
                </div>
                <Switch
                  checked={analysisSettings.maskIpsByDefault}
                  onCheckedChange={(v) => setAnalysisSettings((s: Record<string, unknown>) => ({ ...s, maskIpsByDefault: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Auto-Detect Log Source</Label>
                  <p className="text-xs text-muted-foreground">Automatically detect FortiGate/WatchGuard/Agent from log structure</p>
                </div>
                <Switch
                  checked={analysisSettings.autoDetectSource}
                  onCheckedChange={(v) => setAnalysisSettings((s: Record<string, unknown>) => ({ ...s, autoDetectSource: v }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-card-border">
            <CardHeader>
              <CardTitle className="text-sm font-mono uppercase flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" /> Threat Score Thresholds
              </CardTitle>
              <CardDescription>Configure risk level boundaries for IP correlation scoring (0–100).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Critical threshold (≥)", key: "threatScoreThresholdCritical", color: "text-red-400", min: 1, max: 100 },
                { label: "High threshold (≥)", key: "threatScoreThresholdHigh", color: "text-orange-400", min: 1, max: 99 },
                { label: "Medium threshold (≥)", key: "threatScoreThresholdMedium", color: "text-yellow-400", min: 1, max: 98 },
              ].map(({ label, key, color, min, max }) => (
                <div key={key} className="flex items-center gap-4">
                  <Label className={`text-xs w-44 shrink-0 ${color}`}>{label}</Label>
                  <Input
                    type="number"
                    min={min}
                    max={max}
                    value={analysisSettings[key] ?? 0}
                    onChange={(e) => setAnalysisSettings((s: Record<string, unknown>) => ({ ...s, [key]: Number(e.target.value) }))}
                    className="h-8 w-24 text-sm bg-background font-mono"
                  />
                  <span className="text-xs text-muted-foreground font-mono">/ 100</span>
                </div>
              ))}
              <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground flex items-start gap-2">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                These thresholds are visual only — actual scoring logic is computed server-side. This setting is for display reference.
              </div>
            </CardContent>
          </Card>



          <Card className="bg-card border-card-border mt-4">
            <CardHeader>
              <CardTitle className="text-sm font-mono uppercase flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" /> Data Masking Policy
              </CardTitle>
              <CardDescription>Fields automatically masked before sending logs to AI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">Fields masked before sending to AI:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Passwords, tokens, API keys, credentials — <span className="text-red-400 font-mono">[REDACTED]</span></li>
                  <li>NTLM/Kerberos hashes, cookies, JWT tokens — <span className="text-red-400 font-mono">[REDACTED]</span></li>
                  <li>Hostnames/computer names — <span className="text-yellow-400 font-mono">[HOST]**</span></li>
                  <li>Usernames / account names — <span className="text-yellow-400 font-mono">[USERNAME_REDACTED]</span></li>
                  <li>MAC addresses — <span className="text-yellow-400 font-mono">AA:BB:CC:**:**:**</span></li>
                  <li>Internal domain emails — <span className="text-yellow-400 font-mono">[USER]@[INTERNAL-DOMAIN]</span></li>
                  <li>IP addresses (when Mask IPs enabled) — <span className="text-yellow-400 font-mono">1.2.*.*</span></li>
                </ul>
              </div>
            </CardContent>
          </Card>
          <div className="pt-2">
            <Button size="sm" onClick={handleSaveAnalysis}>Save Analysis Settings</Button>
          </div>
        </div>
      )}

      {/* ── SECURITY TAB ── */}
      {activeTab === "Security" && (
        <div className="space-y-4">
          <Card className="bg-card border-card-border">
            <CardHeader>
              <CardTitle className="text-sm font-mono uppercase flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary text-sm font-bold">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-medium">{user?.username}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                </div>
                <Badge variant="outline" className="ml-auto text-[10px] text-green-500 border-green-500/30">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-card-border">
            <CardHeader>
              <CardTitle className="text-sm font-mono uppercase flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" /> Change Password
              </CardTitle>
              <CardDescription>
                Changing password for <strong>{user?.username}</strong>. Minimum 8 characters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {([
                { label: "Current Password", val: currentPass, set: setCurrentPass, show: showCurrent, toggle: () => setShowCurrent(s => !s) },
                { label: "New Password",     val: newPass,     set: setNewPass,     show: showNew,     toggle: () => setShowNew(s => !s) },
                { label: "Confirm Password", val: confirmPass, set: setConfirmPass, show: showConfirm, toggle: () => setShowConfirm(s => !s) },
              ] as const).map(({ label, val, set, show, toggle }) => (
                <div key={label} className="space-y-1.5">
                  <Label className="text-xs">{label}</Label>
                  <div className="relative">
                    <Input type={show ? "text" : "password"} value={val}
                      onChange={(e) => (set as (v: string) => void)(e.target.value)}
                      placeholder="••••••••" className="h-8 text-sm bg-background pr-8" />
                    <button type="button" onClick={toggle}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="border-t border-border pt-4">
              <Button size="sm" onClick={handleChangePassword} disabled={passLoading}>
                {passLoading ? "Saving..." : "Update Password"}
              </Button>
            </CardFooter>
          </Card>


        </div>
      )}

      {/* ── RATE LIMITS TAB ── */}
      {activeTab === "Rate Limits" && (
        <div className="space-y-4">
          <Card className="bg-card border-card-border">
            <CardHeader>
              <CardTitle className="text-sm font-mono uppercase flex items-center gap-2">
                <Gauge className="h-4 w-4 text-primary" /> API Rate Limits
              </CardTitle>
              <CardDescription>
                Server-enforced limits per IP address to prevent abuse.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  label: "General API",
                  limit: "120 req / 15 min",
                  desc: "All /api/* endpoints",
                  icon: <Clock className="h-4 w-4 text-blue-400" />,
                  color: "border-blue-500/30 bg-blue-500/5",
                  remaining: rateLimitInfo.general.remaining,
                  resetAt: rateLimitInfo.general.resetAt,
                },
                {
                  label: "AI Analysis",
                  limit: "100 req / hour",
                  desc: "/api/sessions/:id/analyze — expensive AI call",
                  icon: <Bot className="h-4 w-4 text-purple-400" />,
                  color: "border-purple-500/30 bg-purple-500/5",
                  remaining: rateLimitInfo.analyze.remaining,
                  resetAt: rateLimitInfo.analyze.resetAt,
                },
                {
                  label: "Authentication",
                  limit: "10 req / 15 min",
                  desc: "/api/auth/login — brute-force protection",
                  icon: <Lock className="h-4 w-4 text-green-400" />,
                  color: "border-green-500/30 bg-green-500/5",
                  remaining: null,
                  resetAt: null,
                },
                {
                  label: "Log Ingestion",
                  limit: "300 req / 15 min",
                  desc: "/api/sessions/:id/logs — log upload throttle",
                  icon: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
                  color: "border-yellow-500/30 bg-yellow-500/5",
                  remaining: null,
                  resetAt: null,
                },
              ].map((item) => (
                <div key={item.label} className={`p-3 rounded-lg border ${item.color} flex items-start justify-between gap-3`}>
                  <div className="flex items-start gap-3">
                    {item.icon}
                    <div>
                      <p className="text-sm font-medium font-mono">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                      {item.remaining !== null && (
                        <p className="text-xs font-mono mt-1 text-foreground">
                          Remaining: <span className="font-bold">{item.remaining}</span>
                          {item.resetAt && <span className="text-muted-foreground"> · resets {item.resetAt}</span>}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono shrink-0">{item.limit}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-card-border">
            <CardHeader>
              <CardTitle className="text-sm font-mono uppercase flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" /> Rate Limit Headers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs font-mono text-muted-foreground space-y-1">
                <p>RateLimit-Limit: &lt;max-requests&gt;</p>
                <p>RateLimit-Remaining: &lt;remaining&gt;</p>
                <p>RateLimit-Reset: &lt;unix-timestamp&gt;</p>
                <p>Retry-After: &lt;seconds&gt; (on 429)</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                All rate-limited endpoints return <code className="font-mono bg-muted px-1 rounded">429 Too Many Requests</code> with a <code className="font-mono bg-muted px-1 rounded">Retry-After</code> header when limits are exceeded.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
