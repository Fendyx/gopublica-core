/**
 * authFetch — Centralized fetch wrapper for authenticated admin API calls.
 *
 * Features:
 *  - Automatically injects `Authorization: Bearer <token>` from localStorage
 *  - On 401 response: attempts a single token refresh via POST /api/saas/auth/refresh
 *  - If refresh succeeds: updates localStorage and retries the original request once
 *  - If refresh fails: clears token and redirects to /admin/login
 *  - Prevents concurrent refresh attempts (dedup via shared promise)
 *
 * Usage:
 *   import { authFetch, getAuthHeaders } from '@/shared/lib/authFetch'
 *
 *   // Full fetch wrapper (recommended for write operations)
 *   const res = await authFetch('/api/saas/menu', { method: 'POST', body: ... })
 *
 *   // Just headers (for read operations where you handle res yourself)
 *   const res = await fetch(url, { headers: getAuthHeaders() })
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const TOKEN_KEY = 'saas_token';
const LOGIN_PATH = '/admin/login';

// ── Shared refresh state ─────────────────────────────────────────────────────
// Prevents multiple concurrent refresh attempts — only one refresh runs,
// all waiting callers share the same promise.
let refreshPromise: Promise<string | null> | null = null;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Read the current token from localStorage (safe for SSR). */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Save a new token to localStorage. */
function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

/** Remove token and redirect to login. */
function forceLogout(): never {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = LOGIN_PATH;
  }
  // This throw is unreachable in browser but satisfies TypeScript
  throw new Error('Session expired');
}

/**
 * Attempt to refresh the token using the current (possibly expired) JWT.
 * Returns the new token on success, or null on failure (triggers logout).
 * Deduplicates concurrent calls — only one refresh runs at a time.
 */
async function attemptRefresh(): Promise<string | null> {
  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const currentToken = getToken();
      if (!currentToken) return null;

      const res = await fetch(`${API_URL}/api/saas/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: currentToken }),
      });

      if (!res.ok) {
        console.warn('[authFetch] Refresh failed:', res.status);
        return null;
      }

      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        console.log('[authFetch] Token refreshed successfully');
        return data.token;
      }
      return null;
    } catch (err) {
      console.error('[authFetch] Refresh error:', err);
      return null;
    } finally {
      // Clear the shared promise so future calls can attempt again
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns standard auth headers for API calls.
 * Use this when you just need headers (e.g., GET requests).
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Centralized fetch wrapper with automatic token refresh on 401.
 *
 * @param url     The URL to fetch (absolute or relative to API_URL)
 * @param options Standard fetch options + optional `skipAuth` flag
 * @returns       Standard fetch Response (caller should check res.ok)
 *
 * Behavior:
 *  1. Injects Authorization header from localStorage
 *  2. If response is 401:
 *     a. Attempts token refresh
 *     b. If refresh succeeds → retries the original request ONCE
 *     c. If refresh fails → clears token + redirects to /admin/login
 *  3. Never silently swallows errors — always returns the response
 */
export async function authFetch(
  url: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<Response> {
  const { skipAuth = false, ...fetchOptions } = options;

  // Build full URL if relative path provided
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

  // Merge auth headers
  const headers = new Headers(fetchOptions.headers);
  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Ensure Content-Type for JSON bodies
  if (
    fetchOptions.body &&
    typeof fetchOptions.body === 'string' &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  // First attempt
  let res = await fetch(fullUrl, { ...fetchOptions, headers });

  // If 401 and we didn't skip auth → try refresh + retry once
  if (res.status === 401 && !skipAuth) {
    console.warn('[authFetch] Got 401, attempting token refresh...');

    const newToken = await attemptRefresh();

    if (newToken) {
      // Retry with the new token
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await fetch(fullUrl, { ...fetchOptions, headers });
    }

    // If still 401 after refresh (or refresh failed) → force logout
    if (res.status === 401) {
      console.error('[authFetch] Token refresh failed or insufficient. Logging out.');
      forceLogout();
    }
  }

  return res;
}
