'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useBranch } from '@/entities/branch/BranchContext';
import { useTenant } from '@/entities/tenant/TenantContext';
import { BranchSection } from '@/entities/branch-section/types';
import { fetchBranchSections, deleteBranchSection, reorderBranchSectionsBulk } from '@/entities/branch-section/api';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import SectionTypePicker from '@/widgets/Admin/PageBuilder/SectionTypePicker';

function SectionList({
  sections,
  onEdit,
  onDelete,
  onMove,
}: {
  sections: BranchSection[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onMove: (index: number, direction: 'up' | 'down') => void;
}) {
  if (sections.length === 0) {
    return <p className="text-sm text-gray-500">No sections yet.</p>;
  }

  return (
    <div className="space-y-2">
      {sections.map((section, index) => (
        <div
          key={section._id}
          className="flex items-center justify-between p-3 border rounded-lg bg-white"
        >
          <div>
            <span className="font-medium">{section.type}</span>
            <span className="text-sm text-gray-500 ml-2">
              (order: {section.order})
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMove(index, 'up')}
              disabled={index === 0}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMove(index, 'down')}
              disabled={index === sections.length - 1}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onEdit(section._id)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(section._id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PageBuilderPage() {
  const router = useRouter();
  const params = useParams<{ tenantDomain: string }>();
  const { selectedBranch } = useBranch();
  const tenant = useTenant();

  const [sections, setSections] = useState<BranchSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const moveSection = async (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    // Swap the target section with the adjacent one
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];

    // Recalculate order for all sections based on new array index
    const updates = newSections.map((section, i) => ({
      _id: section._id,
      order: i,
    }));

    // Update local state
    setSections(newSections.map((section, i) => ({ ...section, order: i })));

    // Persist to the database
    try {
      await reorderBranchSectionsBulk(updates);
    } catch (err) {
      console.error('Failed to reorder sections:', err);
    }
  };

  useEffect(() => {
    const loadSections = async () => {
      if (selectedBranch?._id && tenant?.tenantId) {
        const data = await fetchBranchSections(tenant.tenantId, selectedBranch._id);
        setSections(data);
      }
      setLoading(false);
    };
    loadSections();
  }, [selectedBranch?._id, tenant?.tenantId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Page Builder</h1>
        <Button
          onClick={() => setIsPickerOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>

      <SectionList
        sections={sections}
        onEdit={(id) =>
          router.push(`/admin/page-builder/${id}`)
        }
        onDelete={async (id) => {
          await deleteBranchSection(id);
          setSections((s) => s.filter((x) => x._id !== id));
        }}
        onMove={moveSection}
      />

      <SectionTypePicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(type) => {
          setIsPickerOpen(false);
          router.push(`/admin/page-builder/new?type=${type}`);
        }}
      />
    </div>
  );
}
