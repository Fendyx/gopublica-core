// src/shared/api/cachedFetch.ts
//
// Shared wrapper around the native fetch API that injects Next.js cache tags
// and always uses no-store to bypass the Next.js data cache.
//
// Rationale: The multi-tenant system resolves data via headers/cookies that
// vary per request, and admin mutations must be visible immediately.
// On-demand revalidation via revalidateTag() is unreliable when the initial
// fetch was force-cached, so we disable caching entirely for now.
//
// Usage:
//   import { cachedFetch } from '@/shared/api/cachedFetch'
//   const res = await cachedFetch(url, ['articles:tenantId'], { headers })
//   const data = await res.json()

type CacheOption = 'force-cache' | 'no-store' | 'default'

interface CachedFetchOptions extends RequestInit {
  tags?: string[]
  cache?: CacheOption
}

export async function cachedFetch(
  url: string,
  tags: string[] = [],
  init?: CachedFetchOptions
): Promise<Response> {
  const { tags: _tags, cache, ...rest } = init ?? {}

  return fetch(url, {
    ...rest,
    next: { tags },
    cache: cache ?? 'no-store',
  })
}