'use client'

import { useBranch } from '@/entities/branch/BranchContext'
import StaffManager from '@/widgets/Admin/StaffManager'

export default function TeamPage() {
  const { selectedBranch } = useBranch()

  return <StaffManager selectedBranch={selectedBranch?._id} />
}
