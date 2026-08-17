'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBranch } from '@/entities/branch/BranchContext';
import { useTenant } from '@/entities/tenant/TenantContext';
import ArticlesManager from '@/widgets/Admin/ArticlesManager';

export default function AdminArticlesPage() {
  const { selectedBranch } = useBranch();
  const router = useRouter();
  const tenant = useTenant();
  const [token] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('saas_token');
    return null;
  });

  useEffect(() => {
    if (tenant && !token) {
      router.replace('/admin/login');
    }
  }, [token, router, tenant]);

  if (!token) return <div className="text-center py-10">Требуется авторизация</div>;

  return <ArticlesManager key={selectedBranch?._id} token={token} />;
}
