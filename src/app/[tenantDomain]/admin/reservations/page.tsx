'use client';
import { useBranch } from '@/entities/branch/BranchContext';
import ReservationsPageContent from './ReservationsPageContent';

export default function ReservationsPage() {
  const { selectedBranch } = useBranch();
  return <ReservationsPageContent key={selectedBranch?._id} />;
}