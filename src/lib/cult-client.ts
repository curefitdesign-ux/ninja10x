import { supabase } from "@/integrations/supabase/client";

const BASE_URL = "https://alpha.cult.fit/api";
const API_KEY = "f09dc9b7-70af-4d4b-b241-0288755352c3";

let ssoToken: string | null = null;

// Test override: only active when ?ignoreAuth=true is in the URL
const _testAt = "CFAPP:7137e98d-15fa-4ef5-90c4-4de2d80eb155";
const _ignoreAuth = new URLSearchParams(window.location.search).get("ignoreAuth") === "true";
const at = _ignoreAuth ? _testAt : null;

export const setSSOToken = (token: string | null) => {
  ssoToken = token;
};

export const getSSOToken = () => ssoToken;

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: API_KEY,
  };
  if (at) {
    headers["at"] = at;
  } else if (ssoToken) {
    headers["ssotoken"] = ssoToken;
  }
  return headers;
}

async function request(method: string, path: string, body?: unknown): Promise<any> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: buildHeaders(),
    credentials: "include",
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (response.status === 401) {
    console.warn("[CultClient] 401 received — signing out");
    setSSOToken(null);
    await supabase.auth.signOut();
    window.location.href = "/";
    throw new Error("Session expired — logged out");
  }
  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    throw new Error(`API ${method} ${path} failed: ${text}`);
  }
  return response.json();
}

export const cultClient = {
  get: (path: string) => request("GET", path),
  post: (path: string, body?: unknown) => request("POST", path, body),
  put: (path: string, body?: unknown) => request("PUT", path, body),
  delete: (path: string) => request("DELETE", path),
};
