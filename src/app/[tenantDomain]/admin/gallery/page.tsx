'use client';
import { useBranch } from '@/entities/branch/BranchContext';
import GalleryAdminPageContent from './GalleryAdminPageContent';

export default function GalleryPage() {
  const { selectedBranch } = useBranch();
  return <GalleryAdminPageContent key={selectedBranch?._id} />;
}