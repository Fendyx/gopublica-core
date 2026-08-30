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
  token, // Optional token for authenticated requests (admin panel)
}: {
  children: React.ReactNode
  tenantId: string
  initialBranch: Branch | null
  token?: string
}) {
  return (
    <BranchProvider tenantId={tenantId} initialBranch={initialBranch} token={token}>
      {children}
    </BranchProvider>
  )
}
