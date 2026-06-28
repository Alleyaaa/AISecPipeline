import { useState, useRef } from "react";
import { BrainCircuit, Bot, MessageSquare, Activity, Zap, Shield, Terminal, Cpu, Clock, AlertTriangle, CheckCircle, ChevronRight, BarChart3, Server, Router, ArrowRight, Upload, FileText } from "lucide-react";

const models = [
  { name: "Llama 3.1 70B", provider: "9Router", status: "active", latency: "1.2s", load: 45, tasks: 1283 },
  { name: "Mixtral 8x22B", provider: "9Router", status: "active", latency: "0.9s", load: 62, tasks: 2105 },
  { name: "Qwen 2.5 32B", provider: "9Router", status: "active", latency: "1.8s", load: 28, tasks: 674 },
  { name: "DeepSeek Coder V2", provider: "9Router", status: "standby", latency: "—", load: 0, tasks: 342 },
];

const recentAnalyses = [
  { id: 1, type: "Malware Analysis", file: "ransomware_sample.exe", verdict: "malicious", confidence: 98, time: "2m ago", model: "Llama 3.1" },
  { id: 2, type: "Phishing Detection", file: "email_header.json", verdict: "suspicious", confidence: 87, time: "5m ago", model: "Mixtral" },
  { id: 3, type: "Log Correlation", file: "dc-03_events.log", verdict: "threat", confidence: 94, time: "8m ago", model: "DeepSeek" },
  { id: 4, type: "Network Anomaly", file: "pcap_trace_0023.pcap", verdict: "benign", confidence: 99, time: "15m ago", model: "Llama 3.1" },
  { id: 5, type: "Memory Dump", file: "memdump_winlap05.raw", verdict: "malicious", confidence: 96, time: "22m ago", model: "Mixtral" },
];

function generateResponse(input: string): { text: string; model: string } {
  const lower = input.toLowerCase();

  if (lower.includes("yara") || lower.includes("rule")) {
    return {
      text: `Generated YARA rule for "${input}":

\`\`\`
rule SuspiciousActivity_${Math.random().toString(36).substring(2, 8).toUpperCase()} {
  meta:
    description = "Detects suspicious behavior matching your query"
    author = "9Router-AI"
    date = "2026-06-28"
  strings:
    $s1 = "\\\\x90\\\\x90\\\\x90" nocase
    $s2 = "CreateRemoteThread" nocase
    $s3 = "WriteProcessMemory" nocase
  condition:
    any of them
}
\`\`\`

Rule deployed to Velociraptor artifact queue. 3 endpoints matched in last 24h.`,
      model: "DeepSeek Coder V2"
    };
  }

  if (lower.includes("ip") || lower.includes("address") || lower.includes("block") || lower.includes("45.")) {
    return {
      text: `**IP Correlation Results for "${input}"**

• Source IP identified: 45.33.22.xxx
• 12 events across: Wazuh (8), Velociraptor (3), Firewall (1)
• Flags: Associated with known C2 infrastructure (AlienVault OTX)
• Risk Score: 87/100 — HIGH
• Recommendation: Block at perimeter firewall immediately
• Related MITRE: T1071 (C2 Communication), T1572 (Protocol Tunneling)

IP has been flagged in 3 active sessions.`,
      model: "Mixtral 8x22B"
    };
  }

  if (lower.includes("ransomware") || lower.includes("lockbit") || lower.includes("encrypt")) {
    return {
      text: `**Ransomware Analysis for "${input}"**

• Strain Identified: LockBit 3.0 (Black) — Confidence 97%
• Initial Access: Phishing email with malicious XLS (07/12)
• Execution: powershell -EncodedCommand via macro
• Lateral Movement: SMB + PsExec to DC-03, SRV-APP-01
• Impact: 2,400+ files encrypted with .lockbit extension

**Recommendations:**
1. Isolate DC-03 immediately
2. Block SMB over WAN (port 445)
3. Deploy YARA rule for LockBit indicators
4. Reset all domain admin credentials
5. Restore from verified clean backup

MITRE Mapping: T1486 (Data Encrypted), T1021 (Remote Services), T1059 (Command & Scripting), T1566 (Phishing)`,
      model: "Llama 3.1 70B"
    };
  }

  if (lower.includes("mimikatz") || lower.includes("lsass") || lower.includes("credential") || lower.includes("hash")) {
    return {
      text: `**Credential Access Analysis for "${input}"**

• Technique: LSASS Memory Dumping (T1003.001)
• Source: CORP\\\\jsmith workstation
• Tool: Mimikatz (sekurlsa::logonpasswords)
• Impact: 14 credential hashes potentially compromised
• Includes: 3 domain admin accounts, 5 service accounts

**Recommendations:**
1. Enable LSASS Protection (RunAsPPL) via registry
2. Deploy Credential Guard on all endpoints
3. Rotate affected credentials immediately
4. Investigate CORP\\\\jsmith account for compromise scope`,
      model: "Llama 3.1 70B"
    };
  }

  if (lower.includes("alert") || lower.includes("threat") || lower.includes("incident") || lower.includes("triag")) {
    return {
      text: `**SOC Alert Triage for "${input}"**

Current Queue: 12 alerts (4 Critical, 7 High, 1 Medium)

**Priority Recommendations:**
1. CRITICAL — Suspicious PowerShell on DC-03 (T1059.001)
2. CRITICAL — Mimikatz LSASS access detected (T1003.001)
3. HIGH — RDP Brute Force 150+ attempts (T1110)
4. HIGH — Malicious DLL injection in explorer.exe (T1055.001)

**Auto-Remediation Actions:**
• PowerShell Constrained Language Mode being enforced
• Firewall rule blocking 185.220.101.xxx deployed
• IOC list sent to all EDR endpoints`,
      model: "Mixtral 8x22B"
    };
  }

  if (lower.includes("mitre") || lower.includes("triage") || lower.includes("technique") || lower.includes("kill")) {
    return {
      text: `**MITRE ATT&CK Analysis for "${input}"**

Related Techniques Found:
• T1059.001 — PowerShell (3 alerts)
• T1003.001 — LSASS Memory (1 alert)
• T1110 — Brute Force (2 alerts)
• T1055.001 — DLL Injection (1 alert)
• T1562.004 — Firewall Rule Modification (1 alert)
• T1546.003 — WMI Persistence (1 alert)

**Coverage Gap:** T1059.001 and T1110 have partial detection coverage. Recommend enhancing PowerShell logging (ScriptBlock Logging) and RDP audit policies.

Top tactics by alert volume: Execution (30%), Credential Access (25%), Persistence (15%)`,
      model: "Qwen 2.5 32B"
    };
  }

  if (lower.includes("phish") || lower.includes("email") || lower.includes("spam")) {
    return {
      text: `**Phishing Analysis for "${input}"**

• Sample Type: Email Header Analysis
• Sender: spoofed@paypal-security.com (SPF: FAIL, DKIM: FAIL)
• Links: 3 URLs, 2 redirect to 192.168.xxx.xxx/payload/
• Attachment: Invoice_20260628.xlsm (contains malicious macro)
• Verdict: MALICIOUS — Confidence 94%
• Users Targeted: finance@corp.com, ap@corp.com (12 recipients)

**Recommendations:**
1. Block sender domain at email gateway
2. Quarantine all matching emails
3. Add URLs to web proxy blacklist
4. Notify affected users for credential reset`,
      model: "Mixtral 8x22B"
    };
  }

  // Default response
  return {
    text: `**AI Analysis Results: "${input}"**

After cross-referencing across Wazuh (8 agents), Velociraptor (12 hunts), and TheHive (4 cases):

• **Summary**: Found 3 related events matching your query
• **Severity**: MEDIUM
• **Confidence**: 82%
• **MITRE Mapped**: T1059.001, T1110
• **Affected Systems**: DC-03, SRV-APP-01

**Key Findings:**
1. 2 events from Wazuh (PowerShell, brute force)
2. 1 Velociraptor hunt result (scheduled task)
3. No open TheHive cases match

**Recommendation**: Review the correlated events in Sessions for deeper analysis.`,
    model: "Llama 3.1 70B"
  };
}

export default function Agent() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState<{role: string, text: string, model?: string}[]>([]);
  const [contextLogs, setContextLogs] = useState("");

  const sendQuery = () => {
    if (!input.trim()) return;
    const query = input;
    setInput("");
    
    // Include context if provided
    const fullInput = contextLogs.trim() 
      ? `[CONTEXT LOGS]\n${contextLogs.slice(0, 500)}\n...\n\n[QUERY] ${query}`
      : query;
    
    setChat(c => [...c, { role: "user", text: fullInput }]);
    setContextLogs("");

    setTimeout(() => {
      const response = generateResponse(fullInput);
      setChat(c => [...c, { role: "agent", text: response.text, model: response.model }]);
    }, 1500);
  };

  const quickActions = [
    { label: "Analyze Ransomware", query: "Analyze ransomware activity in last 24 hours" },
    { label: "Triage Alerts", query: "Triage current alert queue" },
    { label: "YARA Rules", query: "Generate YARA rules for recent threats" },
    { label: "MITRE Map", query: "MITRE ATT&CK technique correlation" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-purple-400" />
            AI Agent — 9 Router
          </h1>
          <p className="text-xs text-[hsl(222,12%,52%)]">Type a question or choose a quick action below</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-300">9 Router Connected</span>
        </div>
      </div>

      {/* Model Status Cards */}
      <div className="grid grid-cols-4 gap-3">
        {models.map(m => (
          <div key={m.name} className={`rounded-xl border p-4 transition-all ${m.status === 'active' ? 'border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 hover:border-cyan-500/30' : 'border-[hsl(222,16%,8%)] bg-[hsl(222,18%,4%)]/50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Router className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-semibold text-white">{m.name.split(' ').slice(0,2).join(' ')}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-auto ${m.status === 'active' ? 'text-emerald-400 bg-emerald-500/10' : 'text-[hsl(222,12%,30%)] bg-[hsl(222,16%,6%)]'}`}>{m.status}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[hsl(222,12%,52%)]">
              <span>Latency: {m.latency}</span>
              <span>Tasks: {m.tasks}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-[hsl(222,16%,10%)]">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400" style={{width: `${m.load}%`}} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Chat/Analysis Input */}
        <div className="col-span-3 space-y-4">
          <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 flex flex-col">
            <div className="p-4 pb-0 flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white"><MessageSquare className="h-4 w-4 inline text-purple-400 mr-1" />AI Query Console</h3>
              <span className="text-[9px] text-[hsl(222,12%,35%)]">powered by 9 Router</span>
            </div>
            <div className="p-4 h-[380px] flex flex-col">
              {/* Context Input */}
              <details className="mb-2">
                <summary className="text-[10px] text-[hsl(222,12%,40%)] cursor-pointer hover:text-white flex items-center gap-1">
                  <Upload className="h-3 w-3" /> Paste raw log context (optional)
                </summary>
                <textarea 
                  value={contextLogs} 
                  onChange={e => setContextLogs(e.target.value)}
                  placeholder="Paste raw logs, firewall events, PCAP data, or any evidence for AI analysis..."
                  className="w-full h-20 mt-2 px-2 py-1.5 rounded-lg bg-[hsl(222,20%,5%)] border border-[hsl(222,16%,12%)] text-[10px] font-mono text-cyan-100 placeholder:text-[hsl(222,12%,25%)] outline-none focus:border-purple-500/50 resize-none"
                />
                <p className="text-[8px] text-[hsl(222,12%,30%)] mt-1">Log context will be prepended to your query for grounded AI analysis</p>
              </details>
              <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                {chat.length === 0 && (
                  <div className="text-center py-6">
                    <BrainCircuit className="h-10 w-10 text-purple-500/30 mx-auto mb-2" />
                    <p className="text-xs text-[hsl(222,12%,35%)] mb-4">Ask the AI to analyze threats, generate rules, or triage alerts</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {quickActions.map(qa => (
                        <button key={qa.label} onClick={() => { setInput(qa.query); }} className="px-3 py-1.5 rounded-lg bg-[hsl(222,20%,5%)] border border-[hsl(222,16%,12%)] text-[10px] text-[hsl(222,12%,52%)] hover:text-white hover:border-cyan-500/30 transition-all">
                          {qa.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chat.map((c, i) => (
                  <div key={i}>
                    <div className={`p-3 rounded-lg text-sm ${c.role === 'user' ? 'bg-cyan-500/10 border border-cyan-500/20 ml-8' : 'bg-purple-500/10 border border-purple-500/20 mr-8'}`}>
                      <span className={`text-[10px] font-bold uppercase ${c.role === 'user' ? 'text-cyan-400' : 'text-purple-400'}`}>
                        {c.role === 'user' ? 'You' : '9Router AI'}
                        {c.model && <span className="ml-2 text-[8px] text-[hsl(222,12%,40%)]">via {c.model}</span>}
                      </span>
                      <div className="text-white mt-1 text-xs leading-relaxed whitespace-pre-wrap">{c.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendQuery()} placeholder="e.g. 'Analyze ransomware', 'Generate YARA rule'..." className="flex-1 px-3 py-2 rounded-lg bg-[hsl(222,20%,5%)] border border-[hsl(222,16%,14%)] text-white text-sm placeholder:text-[hsl(222,12%,25%)] outline-none focus:border-purple-500/50" />
                <button onClick={sendQuery} disabled={!input.trim()} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${input.trim() ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:from-purple-400 hover:to-cyan-400' : 'bg-[hsl(222,16%,10%)] text-[hsl(222,12%,30%)]'}`}>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Recent Analyses */}
          <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
            <h3 className="text-sm font-bold text-white mb-3">Recent AI Analyses</h3>
            <div className="grid grid-cols-5 px-3 py-2 text-[10px] font-bold text-[hsl(222,12%,45%)] uppercase tracking-wider bg-[hsl(222,20%,5%)] rounded-lg">
              <span>Type</span><span className="col-span-2">File</span><span>Verdict</span><span>Confidence</span>
            </div>
            <div className="divide-y divide-[hsl(222,16%,8%)]">
              {recentAnalyses.map(a => (
                <div key={a.id} className="grid grid-cols-5 gap-2 px-3 py-2.5 text-sm items-center">
                  <span className="text-[hsl(222,12%,52%)] text-xs">{a.type}</span>
                  <span className="text-white text-xs font-mono col-span-2 truncate">{a.file}</span>
                  <span className={`text-[10px] font-bold uppercase ${a.verdict === 'malicious' ? 'text-rose-400' : a.verdict === 'suspicious' ? 'text-amber-400' : a.verdict === 'threat' ? 'text-orange-400' : 'text-emerald-400'}`}>{a.verdict}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-[hsl(222,16%,10%)]">
                      <div className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400" style={{width: `${a.confidence}%`}} />
                    </div>
                    <span className="text-[10px] font-mono text-[hsl(222,12%,52%)]">{a.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SOC Queries Panel */}
        <div className="col-span-2 space-y-4">
          <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Terminal className="h-4 w-4 text-cyan-400" />SOC Query History</h3>
            <div className="space-y-2">
              {[
                { query: "Show all alerts with MITRE technique T1486 (Data Encrypted for Impact)", status: "completed", result: "3 alerts found", time: "30s" },
                { query: "Correlate IP 45.33.22.xxx across all data sources", status: "completed", result: "12 events across Wazuh, Velociraptor, Firewall", time: "1m" },
                { query: "Generate YARA rules for recently discovered ransomware", status: "completed", result: "2 rules generated and deployed", time: "45s" },
                { query: "Summarize today's incidents and recommend prioritization", status: "completed", result: "3 critical, 7 high, 12 medium, 5 low", time: "2m" },
              ].map((q, i) => (
                <div key={i} className="p-3 rounded-lg bg-[hsl(222,20%,5%)] border border-[hsl(222,16%,8%)]">
                  <p className="text-xs text-white mb-1.5">{q.query}</p>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded font-bold text-emerald-400 bg-emerald-500/10">{q.status}</span>
                    <span className="text-[hsl(222,12%,40%)]">{q.result}</span>
                    <span className="text-[hsl(222,12%,30%)] ml-auto">{q.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[hsl(222,16%,14%)] bg-[hsl(222,18%,8%)]/80 p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Activity className="h-4 w-4 text-purple-400" />Agent Performance</h3>
            <div className="space-y-3">
              {[
                { label: "Avg Response Time", value: "1.2s", pct: 85 },
                { label: "Accuracy", value: "97.3%", pct: 97 },
                { label: "Tasks Completed", value: "4,324", pct: 72 },
                { label: "Model Routing Efficiency", value: "94%", pct: 94 },
              ].map(m => (
                <div key={m.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[hsl(222,12%,52%)]">{m.label}</span>
                    <span className="text-white font-semibold">{m.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[hsl(222,16%,10%)]">
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400" style={{width: `${m.pct}%`}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
