// src/entities/branch/BranchProviderWithInitial.tsx
'use client'
import { BranchProvider } from './BranchContext'
import type { Branch } from './types'

/**
 * Wrapper around BranchProvider that accepts an initialBranch prop.
 * Used by [branchSlug]/layout.tsx to pre-populate the branch context
 * from the URL slug, skipping IP-based detection.
 */
export default function BranchProviderWithInitial({
  children,
  tenantId,
  initialBranch,
}: {
  children: React.ReactNode
  tenantId: string
  initialBranch: Branch | null
}) {
  return (
    <BranchProvider tenantId={tenantId} initialBranch={initialBranch}>
      {children}
    </BranchProvider>
  )
}
