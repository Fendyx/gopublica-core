'use client';
import { useState } from 'react';
import { useBranch } from '@/entities/branch/BranchContext';
import MenuManager from '@/widgets/Admin/MenuManager';

export default function AdminMenuPage() {
  const { selectedBranch } = useBranch();
  const [token] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('saas_token');
    return null;
  });

  if (!token) return <div className="text-center py-10">Требуется авторизация</div>;
  return <MenuManager key={selectedBranch?._id} token={token} />;
}