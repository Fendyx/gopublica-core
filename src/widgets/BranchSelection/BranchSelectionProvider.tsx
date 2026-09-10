'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useBranch } from '@/entities/branch/BranchContext'
import { useBranchSelection } from '@/widgets/BranchSelection/useBranchSelection'
import BranchSelectionModal from '@/widgets/BranchSelection/BranchSelectionModal'

interface BranchSelectionContextType {
  /** Open the branch selection modal programmatically */
  openBranchSelection: () => void
}

const BranchSelectionContext = createContext<BranchSelectionContextType | undefined>(undefined)

export function useBranchSelectionUI() {
  const context = useContext(BranchSelectionContext)
  if (!context) throw new Error('useBranchSelectionUI must be used within BranchSelectionProvider')
  return context
}

interface Props {
  children: React.ReactNode
}

/**
 * Provider that controls when the branch selection modal should appear.
 *
 * Logic:
 * 1. On mount, if tenant has >1 branch AND no saved preference in localStorage → show modal
 * 2. If user has a saved preference → skip modal, restore from localStorage
 * 3. Exposes `openBranchSelection()` for the Navbar "Change location" button
 */
export default function BranchSelectionProvider({ children }: Props) {
  const { branches, loading: branchesLoading } = useBranch()
  const { hasSelection, getSelection } = useBranchSelection()
  const [modalOpen, setModalOpen] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Determine if the modal should be shown on first load
  useEffect(() => {
    if (branchesLoading || initialized) return

    const multiBranch = branches.length > 1
    const savedSelection = hasSelection()

    if (multiBranch && !savedSelection) {
      // First visit, multi-branch tenant → show modal
      setModalOpen(true)
    }

    setInitialized(true)
  }, [branches, branchesLoading, initialized, hasSelection])

  const openBranchSelection = useCallback(() => {
    setModalOpen(true)
  }, [])

  return (
    <BranchSelectionContext.Provider value={{ openBranchSelection }}>
      {children}
      <BranchSelectionModal open={modalOpen} onOpenChange={setModalOpen} />
    </BranchSelectionContext.Provider>
  )
}
