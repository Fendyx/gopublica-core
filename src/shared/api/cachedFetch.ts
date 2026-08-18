// src/shared/api/cachedFetch.ts
//
// Shared wrapper around the native fetch API that injects Next.js cache tags
// and defaults to force-cache for GET requests. This allows Server Components
// to benefit from the Next.js data cache while still being individually
// revalidated on demand via revalidateTag().
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
    cache: cache ?? 'force-cache',
  })
}