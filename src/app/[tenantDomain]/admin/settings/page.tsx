'use client';
import { useBranch } from '@/entities/branch/BranchContext';
import SettingsPageContent from './SettingsPageContent';

export default function SettingsPage() {
  const { selectedBranch } = useBranch();
  return <SettingsPageContent key={selectedBranch?._id} />;
}