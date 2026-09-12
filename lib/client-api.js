const STORAGE_KEY = "ivy_lens_session";

export function readStoredSession() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function storeSession(payload) {
  const session = {
    ...payload,
    expires_at: Date.now() + payload.expires_in * 1000,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function clearStoredSession() {
  localStorage.removeItem(STORAGE_KEY);
}

let refreshPromise = null;

async function refreshSession(session) {
  if (!refreshPromise) {
    refreshPromise = fetch("/api/ivy/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Your session has expired. Please sign in again.");
        return storeSession(await response.json());
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export async function apiFetch(path, options = {}) {
  let session = readStoredSession();
  if (!session) throw new Error("Please sign in to continue.");
  if (session.expires_at - Date.now() < 60_000) session = await refreshSession(session);

  const request = () => fetch(path, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  let response = await request();
  if (response.status === 401) {
    session = await refreshSession(session);
    response = await fetch(path, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${session.access_token}` },
    });
  }
  return response;
}

export async function apiJson(path, options = {}) {
  const response = await apiFetch(path, options);
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.detail || `Request failed (${response.status})`);
  return body;
}

