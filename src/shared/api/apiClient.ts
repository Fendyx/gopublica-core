import { authFetch } from '@/shared/lib/authFetch'

export const API_BASE = process.env.NEXT_PUBLIC_API_URL

/**
 * Centralized API fetch wrapper.
 * Uses authFetch for automatic 401 handling + token refresh.
 */
export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await authFetch(endpoint, {
    ...options,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`API error: ${res.statusText}`)
  return res.json()
}