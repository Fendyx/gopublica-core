'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useBranch } from '@/entities/branch/BranchContext';
import { useTenant } from '@/entities/tenant/TenantContext';
import { BranchSection } from '@/entities/branch-section/types';
import { fetchBranchSections, deleteBranchSection, reorderBranchSectionsBulk } from '@/entities/branch-section/api';
import { fetchCustomPages, createCustomPage, deleteCustomPage, updateCustomPage } from '@/entities/branch/api';
import type { CustomPage } from '@/entities/branch/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Edit, Trash2, ChevronUp, ChevronDown, Lock, GripVertical, FileText } from 'lucide-react';
import SectionTypePicker from '@/widgets/Admin/PageBuilder/SectionTypePicker';

/** System (hardcoded) pages that support page-builder sections and their feature gates */
const SYSTEM_PAGE_TABS = [
  { key: 'home', label: 'Home', isCustom: false },
  { key: 'partners', label: 'Partners', isCustom: false },
  { key: 'catalog', label: 'Catalog', feature: 'hasOnlineOrdering' as const, isCustom: false },
  { key: 'menu', label: 'Menu', feature: 'hasMenu' as const, isCustom: false },
  { key: 'contacts', label: 'Contacts', isCustom: false },
  { key: 'articles', label: 'Articles', isCustom: false },
  { key: 'gallery', label: 'Gallery', feature: 'hasGallery' as const, isCustom: false },
  { key: 'reservations', label: 'Reservations', isCustom: false },
];

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
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-gray-300" />
            {section.isSystem && (
              <Lock className="h-3.5 w-3.5 text-amber-500" />
            )}
            <span className="font-medium">{section.type}</span>
            {section.isSystem && (
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">System</span>
            )}
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
            {!section.isSystem && (
              <Button size="sm" variant="ghost" onClick={() => onDelete(section._id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PageBuilderPage() {
  const router = useRouter();
  const params = useParams<{ tenantDomain: string }>();
  const { selectedBranch, refetchBranches } = useBranch();
  const tenant = useTenant();

  const [sections, setSections] = useState<BranchSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const searchParams = useSearchParams();
  const [activePage, setActivePage] = useState<string>(
    searchParams.get('page') || 'home'
  );

  // ── Custom pages state ──
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [isAddPageOpen, setIsAddPageOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [creatingPage, setCreatingPage] = useState(false);
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState<string | null>(null);

  // Filter system tabs based on tenant features
  const availableSystemTabs = SYSTEM_PAGE_TABS.filter((tab) => {
    if (!tab.feature) return true;
    return tenant?.features?.[tab.feature] === true;
  });

  // Merge system tabs with custom pages
  const allTabs = [
    ...availableSystemTabs,
    ...customPages.filter(p => p.isActive).map(p => ({
      key: p.slug,
      label: p.title,
      isCustom: true as const,
    })),
  ];

  const isCustomActivePage = customPages.some(p => p.slug === activePage);

  // ── Fetch custom pages ──
  const loadCustomPages = useCallback(async () => {
    if (!selectedBranch?._id) return;
    try {
      const pages = await fetchCustomPages(selectedBranch._id);
      setCustomPages(pages);
    } catch (err) {
      console.error('Failed to load custom pages:', err);
    }
  }, [selectedBranch?._id]);

  useEffect(() => {
    loadCustomPages();
  }, [loadCustomPages]);

  // ── Create custom page ──
  const handleCreatePage = async () => {
    if (!selectedBranch?._id || !newPageTitle.trim()) return;
    setCreatingPage(true);
    try {
      const created = await createCustomPage(selectedBranch._id, newPageTitle.trim());
      setCustomPages(prev => [...prev, created]);
      setNewPageTitle('');
      setIsAddPageOpen(false);
      // Switch to the new page tab
      setActivePage(created.slug);
      router.replace(`/admin/page-builder?page=${created.slug}`);
      // Refresh branch context so navbar picks up the new page
      await refetchBranches();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create page');
    } finally {
      setCreatingPage(false);
    }
  };

  // ── Delete custom page ──
  const handleDeletePage = async (slug: string) => {
    if (!selectedBranch?._id) return;
    try {
      await deleteCustomPage(selectedBranch._id, slug);
      setCustomPages(prev => prev.filter(p => p.slug !== slug));
      setDeleteConfirmSlug(null);
      // If we were viewing the deleted page, switch to home
      if (activePage === slug) {
        setActivePage('home');
        router.replace('/admin/page-builder?page=home');
      }
      await refetchBranches();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete page');
    }
  };

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
      router.refresh();
    } catch (err) {
      console.error('Failed to reorder sections:', err);
    }
  };

  useEffect(() => {
    const loadSections = async () => {
      if (selectedBranch?._id && tenant?.tenantId) {
        const data = await fetchBranchSections(tenant.tenantId, selectedBranch._id, activePage);
        setSections(data);
      }
      setLoading(false);
    };
    loadSections();
  }, [selectedBranch?._id, tenant?.tenantId, activePage]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* ── Tabs: system pages + custom pages ── */}
      <Tabs value={activePage} onValueChange={(v) => {
        setActivePage(v);
        router.replace(`/admin/page-builder?page=${v}`);
      }} className="mb-6">
        <div className="flex items-center gap-2">
          <TabsList className="flex-1 overflow-x-auto">
            {availableSystemTabs.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key}>{tab.label}</TabsTrigger>
            ))}
            {customPages.filter(p => p.isActive).map((cp) => (
              <TabsTrigger key={cp.slug} value={cp.slug} className="gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {cp.title}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddPageOpen(true)}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Page
          </Button>
        </div>
      </Tabs>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Page Builder</h1>
          {isCustomActivePage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmSlug(activePage)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Page
            </Button>
          )}
        </div>
        <Button onClick={() => setIsPickerOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>

      {/* ── Section list ── */}
      <SectionList
        sections={sections}
        onEdit={(id) =>
          router.push(`/admin/page-builder/${id}?page=${activePage}`)
        }
        onDelete={async (id) => {
          await deleteBranchSection(id);
          setSections((s) => s.filter((x) => x._id !== id));
          router.refresh();
        }}
        onMove={moveSection}
      />

      {/* ── Section type picker ── */}
      <SectionTypePicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(type) => {
          setIsPickerOpen(false);
          router.push(`/admin/page-builder/new?type=${type}&page=${activePage}`);
        }}
      />

      {/* ── Add Page dialog ── */}
      <Dialog open={isAddPageOpen} onOpenChange={setIsAddPageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="page-title">Page Title</Label>
              <Input
                id="page-title"
                placeholder="e.g. Ceramics Painting"
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newPageTitle.trim()) {
                    handleCreatePage();
                  }
                }}
                autoFocus
              />
              <p className="text-xs text-gray-500">
                A URL-safe slug will be auto-generated from the title.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddPageOpen(false); setNewPageTitle(''); }}>
              Cancel
            </Button>
            <Button onClick={handleCreatePage} disabled={!newPageTitle.trim() || creatingPage}>
              {creatingPage && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete custom page confirmation dialog ── */}
      <Dialog open={!!deleteConfirmSlug} onOpenChange={() => setDeleteConfirmSlug(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Custom Page</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Are you sure you want to delete the page &ldquo;{allTabs.find(t => t.key === deleteConfirmSlug)?.label}&rdquo;?
            All sections on this page will also be removed. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmSlug(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmSlug && handleDeletePage(deleteConfirmSlug)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
