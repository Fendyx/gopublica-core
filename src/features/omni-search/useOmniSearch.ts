'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchOmniSearch } from './api'
import type { OmniSearchResponse } from './types'

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

interface UseOmniSearchOptions {
  tenantId: string
  branchId?: string
  locale?: string
  enabled?: boolean
}

interface UseOmniSearchReturn {
  query: string
  setQuery: (q: string) => void
  results: OmniSearchResponse
  loading: boolean
  error: string | null
}

const EMPTY_RESULTS: OmniSearchResponse = {
  products: [],
  categories: [],
  attributes: [],
}

export function useOmniSearch({
  tenantId,
  branchId,
  locale,
  enabled = true,
}: UseOmniSearchOptions): UseOmniSearchReturn {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<OmniSearchResponse>(EMPTY_RESULTS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const executeSearch = useCallback(
    async (q: string) => {
      // Cancel any in-flight request
      abortRef.current?.abort()

      if (q.trim().length < MIN_QUERY_LENGTH) {
        setResults(EMPTY_RESULTS)
        setLoading(false)
        return
      }

      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      setError(null)

      try {
        const data = await fetchOmniSearch(tenantId, q, branchId, locale)
        if (!controller.signal.aborted) {
          setResults(data)
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Search failed')
          setResults(EMPTY_RESULTS)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    },
    [tenantId, branchId, locale],
  )

  // Debounced search on query change
  useEffect(() => {
    if (!enabled) return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < MIN_QUERY_LENGTH) {
      setResults(EMPTY_RESULTS)
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(() => {
      executeSearch(query)
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, enabled, executeSearch])

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  // Reset results when disabled
  useEffect(() => {
    if (!enabled) {
      setQuery('')
      setResults(EMPTY_RESULTS)
      setLoading(false)
    }
  }, [enabled])

  return { query, setQuery, results, loading, error }
}
