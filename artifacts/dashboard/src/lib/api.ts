// src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("auth_token");
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    baseHeaders["Authorization"] = `Bearer ${token}`;
  }

  const headers = {
    ...baseHeaders,
    ...options.headers,
  };

  const res = await fetch(`${API_URL}/api${endpoint}`, { ...options, headers });
  
  if (res.status === 401) {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  
  return res;
}
