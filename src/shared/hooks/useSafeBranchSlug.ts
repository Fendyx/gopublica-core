'use client'

import { useParams } from 'next/navigation'
import { useBranch } from '@/entities/branch/BranchContext'

/**
 * Safely resolves the current branch slug.
 *
 * Priority:
 * 1. URL param `[branchSlug]` (pages under /[tenantDomain]/[locale]/[branchSlug]/…)
 * 2. BranchContext selectedBranch (auto-detected or saved preference)
 * 3. `undefined` — caller should handle (e.g. redirect to home)
 *
 * This prevents the "undefined" URL problem when navigating from pages that
 * live outside a branch scope (e.g. /login, /register, /profile).
 */
export function useSafeBranchSlug(): string | undefined {
  const params = useParams<{ branchSlug?: string }>()
  const { selectedBranch } = useBranch()

  // 1. Direct URL param (most accurate)
  if (params.branchSlug) {
    return params.branchSlug
  }

  // 2. Fallback to context (auto-selected or saved)
  if (selectedBranch?.slug) {
    return selectedBranch.slug
  }

  return undefined
}
