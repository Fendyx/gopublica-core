'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useBranch } from '@/entities/branch/BranchContext';
import { useTenant } from '@/entities/tenant/TenantContext';
import { BranchSection, SectionType } from '@/entities/branch-section/types';
import { saveBranchSection, fetchBranchSections } from '@/entities/branch-section/api';
import SectionForm from '@/widgets/Admin/PageBuilder/SectionForm';
import { Loader2 } from 'lucide-react';

export default function SectionEditPage() {
  const router = useRouter();
  const params = useParams<{ tenantDomain: string; sectionId: string }>();
  const type = useSearchParams().get('type') as SectionType;
  const { selectedBranch } = useBranch();
  const tenant = useTenant();

  const [initialData, setInitialData] = useState<BranchSection | undefined>(undefined);
  const [allSections, setAllSections] = useState<BranchSection[]>([]);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const pageSlug = searchParams.get('page') || initialData?.page || 'home';

  useEffect(() => {
    const loadSections = async () => {
      if (!selectedBranch?._id || !tenant?.tenantId) return;

      setLoading(true);
      const sections = await fetchBranchSections(tenant.tenantId, selectedBranch._id, pageSlug);
      setAllSections(sections);

      if (params.sectionId !== 'new') {
        const found = sections.find((s) => s._id === params.sectionId);
        setInitialData(found);
      }
      setLoading(false);
    };
    loadSections();
  }, [params.sectionId, selectedBranch?._id, tenant?.tenantId, pageSlug]);

  const onSave = async (data: Partial<BranchSection>) => {
    await saveBranchSection({
      ...data,
      branchId: selectedBranch?._id,
      tenantId: tenant?.tenantId,
      page: pageSlug,
    });
    router.push(`/admin/page-builder?page=${pageSlug}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <SectionForm
        initialData={initialData}
        defaultType={type}
        onSave={onSave}
        onCancel={() => router.push(`/admin/page-builder?page=${pageSlug}`)}
        sections={allSections}
      />
    </div>
  );
}
