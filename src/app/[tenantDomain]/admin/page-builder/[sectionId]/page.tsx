'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useBranch } from '@/entities/branch/BranchContext';
import { useTenant } from '@/entities/tenant/TenantContext';
import { BranchSection, SectionType } from '@/entities/branch-section/types';
import { saveBranchSection, fetchBranchSections } from '@/entities/branch-section/api';
import SectionForm from '@/widgets/Admin/PageBuilder/SectionForm';
import PageBuilderPreview from '@/widgets/Admin/PageBuilder/PageBuilderPreview';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function SectionEditPage() {
  const router = useRouter();
  const params = useParams<{ tenantDomain: string; sectionId: string }>();
  const tenantDomain = params.tenantDomain;
  const type = useSearchParams().get('type') as SectionType;
  const { selectedBranch } = useBranch();
  const tenant = useTenant();

  const [initialData, setInitialData] = useState<BranchSection | undefined>(undefined);
  const [allSections, setAllSections] = useState<BranchSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const searchParams = useSearchParams();
  const pageSlug = searchParams.get('page') || initialData?.page || 'home';

  const loadSections = useCallback(async () => {
    if (!selectedBranch?._id || !tenant?.tenantId) return;

    setLoading(true);
    const sections = await fetchBranchSections(tenant.tenantId, selectedBranch._id, pageSlug);
    setAllSections(sections);

    if (params.sectionId !== 'new') {
      const found = sections.find((s) => s._id === params.sectionId);
      setInitialData(found);
    }
    setLoading(false);
  }, [params.sectionId, selectedBranch?._id, tenant?.tenantId, pageSlug]);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  const onSave = async (data: Partial<BranchSection>) => {
    await saveBranchSection({
      ...data,
      branchId: selectedBranch?._id,
      tenantId: tenant?.tenantId,
      page: pageSlug,
    });
    // Reload sections to update preview
    await loadSections();
    router.refresh();
    router.push(`/admin/page-builder?page=${pageSlug}`);
  };

  // Sections for preview - include the current editing section with latest changes
  const previewSections = allSections;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Preview toggle */}
      <div className="flex items-center justify-between mb-4">
        <Button
          type="button"
          variant={showPreview ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2"
        >
          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </Button>
      </div>

      <div className={`flex gap-6 ${showPreview ? 'items-start' : ''}`}>
        {/* Editor panel */}
        <div className={`${showPreview ? 'w-1/2 shrink-0' : 'w-full'}`}>
          <SectionForm
            initialData={initialData}
            defaultType={type}
            onSave={onSave}
            onCancel={() => router.push(`/admin/page-builder?page=${pageSlug}`)}
            sections={allSections}
          />
        </div>

        {/* Preview panel */}
        {showPreview && (
          <div className="w-1/2 shrink-0 sticky top-4">
            <PageBuilderPreview
              sections={previewSections}
              locale={tenant?.defaultLocale || 'pl'}
              tenantDomain={tenantDomain}
              branchSlug={selectedBranch?.slug}
            />
          </div>
        )}
      </div>
    </div>
  );
}
