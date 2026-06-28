import { maskIp } from "./ip-utils.js";

export type RestoreMap = Record<string, string>;

function maskHostname(hostname: string): string {
  const str = String(hostname);
  return str.length > 4 ? str.slice(0, 4) + "**" : str + "**";
}

export function buildRestoreMap(
  logs: Array<{ rawJson: string; extractedIp: string | null; dstIp: string | null }>,
  maskIps: boolean
): RestoreMap {
  const map: RestoreMap = {};

  const set = (masked: string, original: string) => {
    if (!masked || !original || masked === original) return;
    if (map[masked] && map[masked] !== original) {
      map[masked] = `${map[masked]}, ${original}`;
    } else {
      map[masked] = original;
    }
  };

  for (const log of logs) {
    if (maskIps) {
      if (log.extractedIp) set(maskIp(log.extractedIp), log.extractedIp);
      if (log.dstIp) set(maskIp(log.dstIp), log.dstIp);
    }

    let raw: Record<string, unknown>;
    try { raw = JSON.parse(log.rawJson) as Record<string, unknown>; }
    catch { continue; }

    const parsed = (raw._source && typeof raw._source === "object")
      ? raw._source as Record<string, unknown>
      : raw;

    const data = parsed?.data as Record<string, unknown> | undefined;
    const winData = data?.win as Record<string, unknown> | undefined;
    const eventdata = winData?.eventdata as Record<string, unknown> | undefined;
    const system = winData?.system as Record<string, unknown> | undefined;

    // agent.name → map placeholder DAN masked hostname
    const agent = parsed?.agent as Record<string, unknown> | undefined;
    if (agent?.name && typeof agent.name === "string") {
      const agentName = agent.name;
      set("[AGENT_NAME_REDACTED]", agentName);
      set("AGENT_NAME_REDACTED", agentName);
      set(maskHostname(agentName), agentName);
    }
    if (maskIps && agent?.ip && typeof agent.ip === "string") {
      set(maskIp(agent.ip), agent.ip);
    }

    // watchguard.host_name
    const wg = data?.watchguard as Record<string, unknown> | undefined;
    if (wg?.host_name && typeof wg.host_name === "string") {
      const wgHost = wg.host_name;
      set("[HOST_REDACTED]", wgHost);
      set("HOST_REDACTED", wgHost);
      set(maskHostname(wgHost), wgHost);
    }
    if (maskIps && wg?.ip_address && typeof wg.ip_address === "string") {
      set(maskIp(wg.ip_address), wg.ip_address);
    }

    // hostname dari berbagai field — termasuk win.system.computer
    const hostnameRaw =
      (parsed?.hostname as string | undefined) ??
      (parsed?.host as string | undefined) ??
      (parsed?.computer as string | undefined) ??
      (data?.hostname as string | undefined) ??
      (data?.host as string | undefined) ??
      (system?.computer as string | undefined);
    if (hostnameRaw) {
      set("[HOST_REDACTED]", hostnameRaw);
      set("HOST_REDACTED", hostnameRaw);
      set(maskHostname(hostnameRaw), hostnameRaw);
    }

    // username — termasuk win.eventdata.user
    const usernameRaw =
      (parsed?.username as string | undefined) ??
      (parsed?.user as string | undefined) ??
      (data?.username as string | undefined) ??
      (data?.user as string | undefined) ??
      (eventdata?.user as string | undefined);
    if (usernameRaw) {
      set("[USERNAME_REDACTED]", usernameRaw);
      set("USERNAME_REDACTED", usernameRaw);
    }
  }

  return map;
}

function restoreString(text: string, map: RestoreMap): string {
  let result = text;
  for (const [masked, original] of Object.entries(map)) {
    const escaped = masked.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(escaped, "g"), original);
  }
  return result;
}

export function restoreAiResult<T extends Record<string, unknown>>(
  aiResult: T,
  map: RestoreMap
): T {
  if (Object.keys(map).length === 0) return aiResult;
  const restored: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(aiResult)) {
    if (typeof value === "string") {
      restored[key] = restoreString(value, map);
    } else if (Array.isArray(value)) {
      restored[key] = value.map((item) =>
        typeof item === "string" ? restoreString(item, map) : item
      );
    } else {
      restored[key] = value;
    }
  }
  return restored as T;
}
