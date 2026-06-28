/**
 * Log Parser — multi-source JSON log normalization
 * Supports: FortiGate Firewall, WatchGuard EDR, Windows Agent, Linux Agent
 * Handles Wazuh _source wrapper format
 */

import { normalizeIp, classifyIp, HIGH_RISK_PORTS, MEDIUM_RISK_PORTS, type IpType } from "./ip-utils.js";

export type LogSource = "fortigate" | "watchguard" | "agent_windows" | "agent_linux" | "unknown";

export interface ParsedLogMetadata {
  extractedIp: string | null;
  dstIp: string | null;
  dstPort: number | null;
  protocol: string | null;
  actionTaken: string | null;
  logTimestamp: string | null;
  ipType: IpType;
  detectedSource: LogSource;
}

/**
 * Unwrap Wazuh OpenSearch format — kalau ada _source, pakai itu sebagai root.
 */
function unwrapIfWazuh(obj: Record<string, unknown>): Record<string, unknown> {
  if (obj._source && typeof obj._source === "object") {
    return obj._source as Record<string, unknown>;
  }
  return obj;
}

export function detectSource(obj: Record<string, unknown>): LogSource {
  const root = unwrapIfWazuh(obj);
  const data = root?.data as Record<string, unknown> | undefined;
  const agent = root?.agent as Record<string, unknown> | undefined;

  // FortiGate
  if (data?.srcip || data?.logid || data?.type === "traffic" || data?.subtype === "forward") {
    return "fortigate";
  }
  // WatchGuard
  if ((data?.watchguard as Record<string, unknown>)?.ip_address) {
    return "watchguard";
  }
  // Windows/Linux Agent (Wazuh)
  if (agent?.ip || agent?.name) {
    // Cek dari data.win atau rule groups
    const hasWin = !!(data?.win);
    const groups = (root?.rule as Record<string, unknown>)?.groups;
    const isWindows = hasWin ||
      (Array.isArray(groups) && groups.includes("windows")) ||
      String(agent?.name ?? "").match(/^(WIN|DESK|LAPTOP|PC|MILT)/i);
    if (isWindows) return "agent_windows";
    return "agent_linux";
  }
  // Flat FortiGate
  if (root?.srcip || root?.src_ip || root?.source_ip) return "fortigate";
  return "unknown";
}

function extractSourceIp(obj: Record<string, unknown>, source: LogSource): string | null {
  const root = unwrapIfWazuh(obj);
  const data = root?.data as Record<string, unknown> | undefined;
  const agent = root?.agent as Record<string, unknown> | undefined;
  const watchguard = data?.watchguard as Record<string, unknown> | undefined;

  switch (source) {
    case "fortigate": {
      const wrapped = normalizeIp(String(data?.srcip ?? data?.src_ip ?? ""));
      if (wrapped) return wrapped;
      return normalizeIp(String(root?.srcip ?? root?.src_ip ?? root?.source_ip ?? ""));
    }
    case "watchguard":
      return normalizeIp(String(watchguard?.ip_address ?? data?.src_ip ?? root?.srcip ?? ""));
    case "agent_windows":
    case "agent_linux":
      return normalizeIp(String(agent?.ip ?? agent?.nat_ip ?? root?.ip ?? ""));
    default: {
      const candidates = [
        data?.srcip, data?.src_ip, agent?.ip, agent?.nat_ip,
        watchguard?.ip_address, root?.srcip, root?.src_ip, root?.ip,
      ];
      for (const c of candidates) {
        const n = normalizeIp(String(c ?? ""));
        if (n) return n;
      }
      return null;
    }
  }
}

function extractDstIp(obj: Record<string, unknown>, source: LogSource): string | null {
  const root = unwrapIfWazuh(obj);
  const data = root?.data as Record<string, unknown> | undefined;
  const watchguard = data?.watchguard as Record<string, unknown> | undefined;

  if (source === "fortigate") {
    const wrapped = normalizeIp(String(data?.dstip ?? data?.dst_ip ?? data?.destip ?? ""));
    if (wrapped) return wrapped;
    return normalizeIp(String(root?.dstip ?? root?.dst_ip ?? root?.destip ?? ""));
  }
  if (source === "watchguard") {
    return normalizeIp(String(watchguard?.dst_ip ?? data?.dst_ip ?? ""));
  }
  const candidates = [data?.dstip, data?.dst_ip, root?.dstip, root?.dst_ip];
  for (const c of candidates) {
    const n = normalizeIp(String(c ?? ""));
    if (n) return n;
  }
  return null;
}

function extractDstPort(obj: Record<string, unknown>, source: LogSource): number | null {
  const root = unwrapIfWazuh(obj);
  const data = root?.data as Record<string, unknown> | undefined;
  const watchguard = data?.watchguard as Record<string, unknown> | undefined;

  const candidates: unknown[] = source === "watchguard"
    ? [watchguard?.dst_port, watchguard?.port, data?.dst_port]
    : [data?.dstport, data?.dst_port, data?.port, root?.dstport, root?.dst_port, root?.port];

  for (const c of candidates) {
    const n = Number(c);
    if (!isNaN(n) && n > 0 && n <= 65535) return n;
  }
  return null;
}

function extractProtocol(obj: Record<string, unknown>, source: LogSource): string | null {
  const root = unwrapIfWazuh(obj);
  const data = root?.data as Record<string, unknown> | undefined;
  const watchguard = data?.watchguard as Record<string, unknown> | undefined;

  const raw = source === "watchguard"
    ? (watchguard?.protocol ?? data?.protocol)
    : (data?.proto ?? data?.protocol ?? root?.proto ?? root?.protocol);

  if (!raw) return null;
  const str = String(raw).toLowerCase().trim();
  const protoMap: Record<string, string> = {
    "6": "tcp", "17": "udp", "1": "icmp", "41": "ipv6", "58": "icmpv6",
  };
  return protoMap[str] ?? str;
}

function extractAction(obj: Record<string, unknown>, source: LogSource): string | null {
  const root = unwrapIfWazuh(obj);
  const data = root?.data as Record<string, unknown> | undefined;
  const watchguard = data?.watchguard as Record<string, unknown> | undefined;

  const raw = source === "watchguard"
    ? (watchguard?.action ?? data?.action)
    : (data?.action ?? data?.disposition ?? root?.action);

  if (!raw) return null;
  const str = String(raw).toLowerCase().trim();
  if (["deny","denied","block","blocked","drop","dropped","reject","rejected"].includes(str)) return "blocked";
  if (["allow","allowed","accept","accepted","permit","permitted","pass"].includes(str)) return "allowed";
  if (["alert","detect","detected","warn"].includes(str)) return "detected";
  return str;
}

function extractTimestamp(obj: Record<string, unknown>): string | null {
  const root = unwrapIfWazuh(obj);
  const candidates = [
    root?.timestamp, root?.time, root?.datetime, root?.eventtime,
    (root?.data as Record<string, unknown>)?.timestamp,
    (root?.agent as Record<string, unknown>)?.timestamp,
  ];
  for (const c of candidates) {
    if (!c) continue;
    const d = new Date(String(c));
    if (!isNaN(d.getTime())) return d.toISOString();
    const n = Number(c);
    if (!isNaN(n)) {
      const ts = n > 1e12 ? new Date(n) : new Date(n * 1000);
      if (!isNaN(ts.getTime()) && ts.getFullYear() > 2000) return ts.toISOString();
    }
  }
  return null;
}

export function parseLogEntry(rawJson: string, declaredSource: LogSource): ParsedLogMetadata {
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(rawJson) as Record<string, unknown>;
  } catch {
    return {
      extractedIp: null, dstIp: null, dstPort: null, protocol: null,
      actionTaken: null, logTimestamp: null, ipType: "unknown", detectedSource: "unknown",
    };
  }

  const detectedSource = declaredSource === "unknown" ? detectSource(obj) : declaredSource;
  const extractedIp = extractSourceIp(obj, detectedSource);
  const dstIp = extractDstIp(obj, detectedSource);
  const dstPort = extractDstPort(obj, detectedSource);
  const protocol = extractProtocol(obj, detectedSource);
  const actionTaken = extractAction(obj, detectedSource);
  const logTimestamp = extractTimestamp(obj);
  const ipType = extractedIp ? classifyIp(extractedIp) : "unknown";

  return { extractedIp, dstIp, dstPort, protocol, actionTaken, logTimestamp, ipType, detectedSource };
}

export interface ThreatScoreInput {
  logCount: number;
  uniqueSources: string[];
  actions: (string | null)[];
  dstPorts: (number | null)[];
  ipType: IpType;
}

export function computeThreatScore(input: ThreatScoreInput): number {
  let score = 0;
  score += Math.min(input.logCount * 2, 20);
  const srcCount = input.uniqueSources.length;
  if (srcCount >= 3) score += 30;
  else if (srcCount === 2) score += 20;
  else score += 5;

  const blockedCount = input.actions.filter((a) => a === "blocked").length;
  const allowedCount = input.actions.filter((a) => a === "allowed").length;
  const detectedCount = input.actions.filter((a) => a === "detected").length;

  if (detectedCount > 0) score += 15;
  if (blockedCount > 0 && allowedCount > 0) score += 20;
  else if (blockedCount > 0) score += 10;
  else if (allowedCount > 0 && input.logCount > 1) score += 12;

  const ports = input.dstPorts.filter((p): p is number => p !== null);
  if (ports.some((p) => HIGH_RISK_PORTS[p])) score += 25;
  else if (ports.some((p) => MEDIUM_RISK_PORTS[p])) score += 10;

  if (input.ipType === "public") score += 5;
  if (input.ipType === "loopback") score -= 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function threatScoreToRisk(score: number): "critical" | "high" | "medium" | "low" {
  if (score >= 80) return "critical";
  if (score >= 55) return "high";
  if (score >= 30) return "medium";
  return "low";
}
