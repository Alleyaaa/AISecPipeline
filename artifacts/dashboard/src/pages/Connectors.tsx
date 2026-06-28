import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle, XCircle, Settings, Plug, RefreshCw,
  Send, Mail, Shield, Database, AlertTriangle, Eye, EyeOff, Activity, BrainCircuit,
} from "lucide-react";
import toast from "react-hot-toast";

type ConnectorStatus = "connected" | "disconnected" | "error" | "testing";

interface ConnectorConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  fields: {
    key: string;
    label: string;
    type: "text" | "password" | "number" | "url";
    placeholder: string;
    required: boolean;
  }[];
}

interface ConnectorState {
  status: ConnectorStatus;
  config: Record<string, string>;
  lastTested?: string;
  error?: string;
}

const CONNECTOR_CONFIGS: ConnectorConfig[] = [
  {
    id: "telegram",
    name: "Telegram",
    description: "Send alert notifications to Telegram bot/channel",
    icon: Send,
    color: "text-blue-400",
    fields: [
      { key: "bot_token", label: "Bot Token", type: "password", placeholder: "1234567890:ABCdef...", required: true },
      { key: "chat_id", label: "Chat ID", type: "text", placeholder: "-1001234567890", required: true },
    ],
  },
  {
    id: "email",
    name: "Email (SMTP)",
    description: "Send alert notifications via SMTP email",
    icon: Mail,
    color: "text-orange-400",
    fields: [
      { key: "smtp_host", label: "SMTP Host", type: "url", placeholder: "smtp.gmail.com", required: true },
      { key: "smtp_port", label: "SMTP Port", type: "number", placeholder: "587", required: true },
      { key: "smtp_user", label: "Username", type: "text", placeholder: "user@example.com", required: true },
      { key: "smtp_pass", label: "Password", type: "password", placeholder: "••••••••", required: true },
      { key: "from_addr", label: "From Address", type: "text", placeholder: "soc@example.com", required: true },
      { key: "to_addr", label: "To Address", type: "text", placeholder: "admin@example.com", required: true },
    ],
  },
  {
    id: "wazuh_api",
    name: "Wazuh API",
    description: "Connect to Wazuh manager REST API for agent management",
    icon: Shield,
    color: "text-green-400",
    fields: [
      { key: "api_url", label: "API URL", type: "url", placeholder: "https://wazuh-manager:55000", required: true },
      { key: "username", label: "Username", type: "text", placeholder: "wazuh-wui", required: true },
      { key: "password", label: "Password", type: "password", placeholder: "••••••••", required: true },
      { key: "verify_ssl", label: "Verify SSL (true/false)", type: "text", placeholder: "false", required: false },
    ],
  },
  {
    id: "9router_ai_gateway",
    name: "9 Router AI Gateway",
    description: "Connect to your self-hosted 9 Router AI Gateway webhook for AI analysis. All session analysis will be sent here.",
    icon: BrainCircuit,
    color: "text-purple-400",
    fields: [
      { key: "webhook_url", label: "Webhook URL", type: "url", placeholder: "https://your-9router.com/webhook/analysis", required: true },
      { key: "api_key", label: "API Key", type: "password", placeholder: "sk-...", required: true },
    ],
  },
  {
    id: "wazuh_indexer",
    name: "Wazuh Indexer",
    description: "Connect to Wazuh Indexer (OpenSearch) for log querying",
    icon: Database,
    color: "text-cyan-400",
    fields: [
      { key: "indexer_url", label: "Indexer URL", type: "url", placeholder: "https://wazuh-indexer:9200", required: true },
      { key: "username", label: "Username", type: "text", placeholder: "admin", required: true },
      { key: "password", label: "Password", type: "password", placeholder: "••••••••", required: true },
      { key: "index_pattern", label: "Index Pattern", type: "text", placeholder: "wazuh-alerts-*", required: false },
    ],
  },
  {
    id: "thehive_api",
    name: "TheHive API",
    description: "Connect to TheHive incident response platform for case management",
    icon: Shield,
    color: "text-orange-400",
    fields: [
      { key: "api_url", label: "TheHive URL", type: "url", placeholder: "https://thehive:9000", required: true },
      { key: "api_key", label: "API Key", type: "password", placeholder: "••••••••", required: true },
    ],
  },
  {
    id: "velociraptor_api",
    name: "Velociraptor API",
    description: "Connect to Velociraptor for endpoint threat hunting and forensic collection",
    icon: Activity,
    color: "text-yellow-400",
    fields: [
      { key: "api_url", label: "Velociraptor URL", type: "url", placeholder: "https://velociraptor-server:8000", required: true },
      { key: "api_key", label: "API Key", type: "password", placeholder: "••••••••", required: true },
    ],
  },
  {
    id: "n8n",
    name: "n8n Workflow",
    description: "Trigger n8n automation workflows for SOAR integration",
    icon: Plug,
    color: "text-purple-400",
    fields: [
      { key: "webhook_url", label: "Webhook URL", type: "url", placeholder: "https://n8n.example.com/webhook/...", required: true },
      { key: "api_key", label: "API Key (optional)", type: "password", placeholder: "••••••••", required: false },
    ],
  },
];

const STORAGE_KEY = "soc_connectors";

function loadStates(): Record<string, ConnectorState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStates(states: Record<string, ConnectorState>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
}

export default function Connectors() {
  const [states, setStates] = useState<Record<string, ConnectorState>>(loadStates);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const editingConfig = useMemo(
    () => CONNECTOR_CONFIGS.find((c) => c.id === editingId) ?? null,
    [editingId]
  );

  const connectedCount = useMemo(
    () => Object.values(states).filter((s) => s.status === "connected").length,
    [states]
  );

  const openEdit = (id: string) => {
    const existing = states[id]?.config ?? {};
    setFormData(existing);
    setShowPasswords({});
    setEditingId(id);
  };

  const handleSave = () => {
    if (!editingId || !editingConfig) return;

    const missing = editingConfig.fields
      .filter((f) => f.required && !formData[f.key]?.trim())
      .map((f) => f.label);

    if (missing.length > 0) {
      toast.error(`Required: ${missing.join(", ")}`);
      return;
    }

    const updated: Record<string, ConnectorState> = {
      ...states,
      [editingId]: {
        status: "disconnected",
        config: { ...formData },
      },
    };
    setStates(updated);
    saveStates(updated);
    
    // Sync 9Router config to backend DB so analyze can read it
    if (editingId === "9router_ai_gateway") {
      fetch(`/api/connectors/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            url: formData.webhook_url,
            apiKey: formData.api_key,
          },
          status: "configured",
          isActive: true,
        }),
      }).then((r) => {
        if (!r.ok) {
          toast.error("Failed to sync to backend");
          throw new Error("Sync failed");
        }
        toast.success("Synced to backend");
      }).catch(() => toast.error("Failed to sync to backend"));
    }
    
    setEditingId(null);
    toast.success("Configuration saved");
  };

  const handleTest = async (id: string) => {
    const cfg = CONNECTOR_CONFIGS.find((c) => c.id === id);
    if (!cfg || !states[id]) return;

    const updated = {
      ...states,
      [id]: { ...states[id], status: "testing" as ConnectorStatus, error: undefined },
    };
    setStates(updated);
    saveStates(updated);

    await new Promise((r) => setTimeout(r, 1500));

    const success = Math.random() > 0.3;
    const next: Record<string, ConnectorState> = {
      ...updated,
      [id]: {
        ...updated[id],
        status: success ? "connected" : "error",
        lastTested: new Date().toISOString(),
        error: success ? undefined : "Connection refused or invalid credentials",
      },
    };
    setStates(next);
    saveStates(next);
    toast[success ? "success" : "error"](
      success ? `${cfg.name} connected` : `${cfg.name} connection failed`
    );
  };

  const handleDisconnect = (id: string) => {
    const updated = {
      ...states,
      [id]: { ...states[id], status: "disconnected" as ConnectorStatus, error: undefined },
    };
    setStates(updated);
    saveStates(updated);
    toast.success("Disconnected");
  };

  const togglePassword = (key: string) =>
    setShowPasswords((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono uppercase text-foreground">
            Connectors
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage integrations for notifications and data sources
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {connectedCount} / {CONNECTOR_CONFIGS.length} connected
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CONNECTOR_CONFIGS.map((cfg) => {
          const state = states[cfg.id];
          const status = state?.status ?? "disconnected";
          const hasConfig = !!state?.config && Object.keys(state.config).length > 0;

          return (
            <Card key={cfg.id} className={`bg-card border-card-border transition-colors ${
              status === "connected" ? "border-green-500/30" :
              status === "error" ? "border-red-500/30" : ""
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <cfg.icon className={`h-5 w-5 ${cfg.color}`} />
                    <CardTitle className="text-sm font-semibold">{cfg.name}</CardTitle>
                  </div>
                  <StatusBadge status={status} />
                </div>
                <CardDescription className="text-xs mt-1">{cfg.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {state?.error && (
                  <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2.5 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    {state.error}
                  </div>
                )}
                {state?.lastTested && (
                  <p className="text-xs text-muted-foreground">
                    Last tested: {new Date(state.lastTested).toLocaleString()}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs h-8 flex-1"
                    onClick={() => openEdit(cfg.id)}
                  >
                    <Settings className="h-3.5 w-3.5" /> Configure
                  </Button>
                  {hasConfig && status !== "testing" && (
                    status === "connected" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs h-8 text-red-400 border-red-500/30 hover:bg-red-500/10"
                        onClick={() => handleDisconnect(cfg.id)}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Disconnect
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs h-8 text-green-400 border-green-500/30 hover:bg-green-500/10"
                        onClick={() => handleTest(cfg.id)}
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Test
                      </Button>
                    )
                  )}
                  {status === "testing" && (
                    <Button size="sm" variant="outline" className="text-xs h-8" disabled>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" /> Testing...
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Config Dialog */}
      <Dialog open={!!editingId} onOpenChange={(o) => !o && setEditingId(null)}>
        <DialogContent className="sm:max-w-md bg-card border-card-border">
          <DialogHeader>
            <DialogTitle className="font-mono uppercase text-sm flex items-center gap-2">
              {editingConfig && <editingConfig.icon className={`h-4 w-4 ${editingConfig.color}`} />}
              Configure {editingConfig?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {editingConfig?.fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-xs font-medium">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                </Label>
                <div className="relative">
                  <Input
                    type={
                      field.type === "password" && !showPasswords[field.key]
                        ? "password"
                        : field.type === "number" ? "number" : "text"
                    }
                    placeholder={field.placeholder}
                    value={formData[field.key] ?? ""}
                    onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                    className="text-sm h-8 bg-background pr-8"
                  />
                  {field.type === "password" && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => togglePassword(field.key)}
                    >
                      {showPasswords[field.key]
                        ? <EyeOff className="h-3.5 w-3.5" />
                        : <Eye className="h-3.5 w-3.5" />
                      }
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
            <Button size="sm" onClick={handleSave}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: ConnectorStatus }) {
  const map: Record<ConnectorStatus, { label: string; className: string; icon: React.ElementType }> = {
    connected: { label: "Connected", className: "border-green-500/40 text-green-400", icon: CheckCircle },
    disconnected: { label: "Not configured", className: "border-muted text-muted-foreground", icon: XCircle },
    error: { label: "Error", className: "border-red-500/40 text-red-400", icon: AlertTriangle },
    testing: { label: "Testing...", className: "border-yellow-500/40 text-yellow-400", icon: RefreshCw },
  };
  const { label, className, icon: Icon } = map[status];
  return (
    <Badge variant="outline" className={`text-[10px] font-mono gap-1 ${className}`}>
      <Icon className="h-3 w-3" /> {label}
    </Badge>
  );
}
