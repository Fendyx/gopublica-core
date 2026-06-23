'use client';
import { useBranch } from '@/entities/branch/BranchContext';
import OrdersPageContent from './OrdersPageContent';

export default function OrdersPage() {
  const { selectedBranch } = useBranch();
  return <OrdersPageContent key={selectedBranch?._id} />;
}