// src/entities/branch/BranchServerContext.tsx
"use client";
import { createContext, useContext } from 'react'
import type { Branch } from '@/entities/branch/types'

/**
 * Server-side context that provides the resolved branch (from [branchSlug] URL segment)
 * to Server Components that need the branch _id for data fetching.
 *
 * This is set by [branchSlug]/layout.tsx and read by page components.
 */
const BranchServerContext = createContext<Branch | null>(null)

export function useBranchServer(): Branch | null {
  return useContext(BranchServerContext)
}

export function BranchServerProvider({
  branch,
  children,
}: {
  branch: Branch | null
  children: React.ReactNode
}) {
  return (
    <BranchServerContext.Provider value={branch}>
      {children}
    </BranchServerContext.Provider>
  )
}
