/**
 * IP Utilities — normalization, classification, masking, sanitization
 */

export type IpType = "private" | "public" | "loopback" | "special" | "unknown";

export const HIGH_RISK_PORTS: Record<number, string> = {
  21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP",
  53: "DNS", 80: "HTTP", 110: "POP3", 135: "RPC",
  139: "NetBIOS", 143: "IMAP", 389: "LDAP", 443: "HTTPS",
  445: "SMB", 636: "LDAPS", 1433: "MSSQL", 1434: "MSSQL-UDP",
  3306: "MySQL", 3389: "RDP", 4444: "Metasploit", 4899: "Radmin",
  5985: "WinRM-HTTP", 5986: "WinRM-HTTPS", 8080: "HTTP-Alt",
  8443: "HTTPS-Alt", 9200: "Elasticsearch", 27017: "MongoDB",
};

export const MEDIUM_RISK_PORTS: Record<number, string> = {
  8000: "HTTP-Dev", 8888: "Jupyter", 6379: "Redis",
  5432: "PostgreSQL", 11211: "Memcached", 2049: "NFS",
};

const SENSITIVE_FIELD_KEYS = [
  "password", "passwd", "pwd", "secret", "token", "apikey", "api_key",
  "authorization", "auth", "credential", "credentials", "private_key",
  "privatekey", "access_token", "refresh_token", "ntlm_hash", "lm_hash",
  "kerberos", "ticket", "hash", "psk", "passphrase", "private", "key",
  "cookie", "session", "jwt",
];

const IP_REGEX = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g;

export function normalizeIp(ip: string): string | null {
  if (!ip || typeof ip !== "string") return null;
  const trimmed = ip.trim();
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(trimmed);
  const ipv6 = /^[0-9a-fA-F:]+$/.test(trimmed) && trimmed.includes(":");
  if (ipv4 || ipv6) return trimmed;
  return null;
}

export function classifyIp(ip: string): IpType {
  if (!ip) return "unknown";
  if (
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    (ip.startsWith("172.") && (() => {
      const second = parseInt(ip.split(".")[1] ?? "0", 10);
      return second >= 16 && second <= 31;
    })())
  ) return "private";
  if (ip.startsWith("127.")) return "loopback";
  if (ip === "0.0.0.0" || ip.startsWith("255.")) return "special";
  return "public";
}

export function maskIp(ip: string): string {
  if (!ip || ip === "unknown") return ip;
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.*.*`;
  if (ip.includes(":")) return ip.replace(/:[^:]*:[^:]*$/, ":*:*");
  return ip;
}

function maskMac(mac: string): string {
  const parts = mac.split(/[:\-\.]/);
  if (parts.length >= 4) {
    const sep = mac.includes(":") ? ":" : mac.includes("-") ? "-" : ".";
    return parts.slice(0, 3).join(sep) + sep + "**" + sep + "**" + sep + "**";
  }
  return "**:**:**:**:**:**";
}

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at > 0) return "[USER]@[INTERNAL-DOMAIN]";
  return "[EMAIL_REDACTED]";
}

function maskHostname(hostname: string): string {
  const str = String(hostname);
  return str.length > 4 ? str.slice(0, 4) + "**" : str + "**";
}

export function sanitizeLogForAi(obj: unknown, maskIps: boolean): unknown {
  if (typeof obj === "string") {
    let s = obj;
    if (maskIps) s = s.replace(IP_REGEX, (ip) => maskIp(ip));
    return s;
  }
  if (Array.isArray(obj)) return obj.map((item) => sanitizeLogForAi(item, maskIps));
  if (typeof obj !== "object" || obj === null) return obj;

  const record = obj as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    const lk = key.toLowerCase();

    if (SENSITIVE_FIELD_KEYS.some((k) => lk.includes(k))) {
      result[key] = "[REDACTED]";
      continue;
    }

    // agent object — mask agent.ip, agent.nat_ip, agent.name
    if (key === "agent" && typeof value === "object" && value !== null) {
      const agentObj = value as Record<string, unknown>;
      const maskedAgent: Record<string, unknown> = {};
      for (const [ak, av] of Object.entries(agentObj)) {
        const alk = ak.toLowerCase();
        if (alk === "ip" || alk === "nat_ip") {
          maskedAgent[ak] = maskIps && av ? maskIp(String(av)) : av;
        } else if (alk === "name") {
          maskedAgent[ak] = "[AGENT_NAME_REDACTED]";
        } else {
          maskedAgent[ak] = sanitizeLogForAi(av, maskIps);
        }
      }
      result[key] = maskedAgent;
      continue;
    }

    // watchguard object — mask ip_address, src_ip, dst_ip, host_name
    if (key === "watchguard" && typeof value === "object" && value !== null) {
      const wgObj = value as Record<string, unknown>;
      const maskedWg: Record<string, unknown> = {};
      for (const [wk, wv] of Object.entries(wgObj)) {
        const wlk = wk.toLowerCase();
        if (wlk === "ip_address" || wlk === "src_ip" || wlk === "dst_ip") {
          maskedWg[wk] = maskIps && wv ? maskIp(String(wv)) : wv;
        } else if (wlk === "host_name" || wlk === "hostname") {
          maskedWg[wk] = "[HOST_REDACTED]";
        } else {
          maskedWg[wk] = sanitizeLogForAi(wv, maskIps);
        }
      }
      result[key] = maskedWg;
      continue;
    }

    if (lk === "mac" || lk === "mac_address" || lk === "macaddress" || lk === "hwaddr") {
      result[key] = typeof value === "string" ? maskMac(value) : "[MAC_REDACTED]";
      continue;
    }

    if (lk === "hostname" || lk === "computer" || lk === "computername" || lk === "host" || lk === "machine") {
      result[key] = typeof value === "string" ? maskHostname(value) : "[HOST_REDACTED]";
      continue;
    }

    if (lk === "username" || lk === "user" || lk === "account" || lk === "accountname" || lk === "logon_user") {
      result[key] = "[USERNAME_REDACTED]";
      continue;
    }

    if (lk === "email" || lk === "mail" || lk === "smtp_from" || lk === "smtp_to") {
      result[key] = typeof value === "string" ? maskEmail(value) : "[EMAIL_REDACTED]";
      continue;
    }

    // highlight block (OpenSearch) → strip sebelum kirim ke AI
    if (key === "highlight") {
      result[key] = "[HIGHLIGHT_REDACTED]";
      continue;
    }

    if (typeof value === "object" && value !== null) {
      result[key] = sanitizeLogForAi(value, maskIps);
    } else if (maskIps && typeof value === "string") {
      result[key] = value.replace(IP_REGEX, (ip) => maskIp(ip));
    } else {
      result[key] = value;
    }
  }

  return result;
}
