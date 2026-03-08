/**
 * Authenticated fetch helper - adds Authorization header from localStorage
 */
const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:8787"
  : "https://task-app.adi-weiss08.workers.dev";

const TOKEN_KEY = "task_app_token";
const USER_KEY = "task_app_user";

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function clearAuthAndRedirect(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
  window.location.href = "/login";
}

export function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const hasBody = options.body != null;
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
  }).then((res) => {
    if (res.status === 401) {
      clearAuthAndRedirect();
    }
    return res;
  });
}
