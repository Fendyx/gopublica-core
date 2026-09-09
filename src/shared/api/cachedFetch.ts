// src/shared/api/cachedFetch.ts
//
// Shared wrapper around the native fetch API that injects Next.js cache tags
// and supports time-based revalidation for public data.
//
// Default behavior: 60-second revalidation with tags for on-demand invalidation.
// Admin data should pass { cache: 'no-store' } explicitly.
//
// Usage:
//   import { cachedFetch } from '@/shared/api/cachedFetch'
//   const res = await cachedFetch(url, ['articles:tenantId'], { headers })
//   const data = await res.json()

type CacheOption = 'force-cache' | 'no-store' | 'default'

interface CachedFetchOptions extends RequestInit {
  tags?: string[]
  cache?: CacheOption
  revalidate?: number
}

export async function cachedFetch(
  url: string,
  tags: string[] = [],
  init?: CachedFetchOptions
): Promise<Response> {
  const { tags: _tags, cache, revalidate, ...rest } = init ?? {}

  return fetch(url, {
    ...rest,
    next: { tags, revalidate: revalidate ?? 60 },
    cache: cache ?? 'default',
  })
}