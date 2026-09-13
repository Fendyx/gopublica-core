'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useBranch } from '@/entities/branch/BranchContext';
import { useTenant } from '@/entities/tenant/TenantContext';
import ArticlesManager from '@/widgets/Admin/ArticlesManager';

export default function AdminArticlesPage() {
  const { selectedBranch } = useBranch();
  const router = useRouter();
  const tenant = useTenant();
  const t = useTranslations('admin');
  const [token] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('saas_token');
    return null;
  });

  useEffect(() => {
    if (tenant && !token) {
      router.replace('/admin/login');
    }
  }, [token, router, tenant]);

  if (!token) return <div className="text-center py-10">{t('loginRequired')}</div>;

  return <ArticlesManager key={selectedBranch?._id} token={token} />;
}
