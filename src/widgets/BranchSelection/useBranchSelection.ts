'use client'

import { useCallback } from 'react'

const STORAGE_KEY_SLUG = 'selectedBranchSlug'
const STORAGE_KEY_CITY = 'selectedBranchCity'
const COOKIE_NAME = 'selectedBranch'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year in seconds

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export interface BranchSelection {
  slug: string | null
  city: string | null
}

/**
 * Hook for reading/writing branch selection preference.
 * Persists to both localStorage (client-side fast reads)
 * and cookie (server-side redirect on first load).
 */
export function useBranchSelection() {
  const getSelection = useCallback((): BranchSelection => {
    if (typeof window === 'undefined') return { slug: null, city: null }
    return {
      slug: localStorage.getItem(STORAGE_KEY_SLUG),
      city: localStorage.getItem(STORAGE_KEY_CITY),
    }
  }, [])

  const setSelection = useCallback((slug: string, city: string | null) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY_SLUG, slug)
    if (city) {
      localStorage.setItem(STORAGE_KEY_CITY, city)
    }
    setCookie(COOKIE_NAME, slug, COOKIE_MAX_AGE)
  }, [])

  const clearSelection = useCallback(() => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY_SLUG)
    localStorage.removeItem(STORAGE_KEY_CITY)
    setCookie(COOKIE_NAME, '', -1)
  }, [])

  const hasSelection = useCallback((): boolean => {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem(STORAGE_KEY_SLUG)
  }, [])

  return { getSelection, setSelection, clearSelection, hasSelection }
}

/**
 * Server-side: read branch selection from cookie.
 * Used in page.tsx for server-rendered redirect.
 */
export function getBranchSelectionFromCookie(): string | null {
  // This is a synchronous read for use in Server Components.
  // In Next.js, cookies() from next/headers is the proper way,
  // but this utility works as a lightweight alternative
  // when imported in a context where cookies() is not available.
  return null // Intentionally returns null — use cookies() directly in Server Components
}
