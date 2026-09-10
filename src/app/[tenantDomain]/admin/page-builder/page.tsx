'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import { Loader2, Plus, Edit, Trash2, Lock, GripVertical, FileText, ExternalLink, Eye, EyeOff } from 'lucide-react';
import SectionTypePicker from '@/widgets/Admin/PageBuilder/SectionTypePicker';
import PageBuilderPreview from '@/widgets/Admin/PageBuilder/PageBuilderPreview';
import { getLabelForLocale } from '@/shared/lib/locales';

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

/** ─── Sortable Section Item (drag-and-drop) ────────────────────────────── */
function SortableSectionItem({
  section,
  onEdit,
  onDelete,
  isDragging,
}: {
  section: BranchSection;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 border rounded-lg bg-white transition-colors ${isDragging ? 'shadow-md z-10 border-primary/30' : ''}`}
    >
      <div className="flex items-center gap-2">
        <div {...listeners} className="cursor-grab shrink-0 touch-none">
          <GripVertical className="h-4 w-4 text-gray-400 hover:text-gray-600 transition" />
        </div>
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
  );
}

function SectionList({
  sections,
  onEdit,
  onDelete,
  onDragEnd,
}: {
  sections: BranchSection[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onDragEnd: (event: DragEndEvent) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (sections.length === 0) {
    return <p className="text-sm text-gray-500">No sections yet.</p>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={sections.map((s) => s._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {sections.map((section) => (
            <SortableSectionItem
              key={section._id}
              section={section}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
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
  const [showPreview, setShowPreview] = useState(false);
  const searchParams = useSearchParams();
  const [activePage, setActivePage] = useState<string>(
    searchParams.get('page') || 'home'
  );

  const adminLocale = useLocale();

  // ── Custom pages state ──
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [isAddPageOpen, setIsAddPageOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageTitleI18n, setNewPageTitleI18n] = useState<Record<string, string>>({});
  const [newPageTitleTab, setNewPageTitleTab] = useState('pl');
  const [creatingPage, setCreatingPage] = useState(false);
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState<string | null>(null);

  // ── SEO state for custom page create/edit ──
  const [newPageDescription, setNewPageDescription] = useState('');
  const [newPageDescriptionI18n, setNewPageDescriptionI18n] = useState<Record<string, string>>({});
  const [newPageSeoTitle, setNewPageSeoTitle] = useState('');
  const [newPageSeoTitleI18n, setNewPageSeoTitleI18n] = useState<Record<string, string>>({});
  const [newPageSeoDescription, setNewPageSeoDescription] = useState('');
  const [newPageSeoDescriptionI18n, setNewPageSeoDescriptionI18n] = useState<Record<string, string>>({});

  // ── Edit custom page dialog ──
  const [editingPage, setEditingPage] = useState<CustomPage | null>(null);
  const [editPageTitle, setEditPageTitle] = useState('');
  const [editPageTitleI18n, setEditPageTitleI18n] = useState<Record<string, string>>({});
  const [editPageDescription, setEditPageDescription] = useState('');
  const [editPageDescriptionI18n, setEditPageDescriptionI18n] = useState<Record<string, string>>({});
  const [editPageSeoTitle, setEditPageSeoTitle] = useState('');
  const [editPageSeoTitleI18n, setEditPageSeoTitleI18n] = useState<Record<string, string>>({});
  const [editPageSeoDescription, setEditPageSeoDescription] = useState('');
  const [editPageSeoDescriptionI18n, setEditPageSeoDescriptionI18n] = useState<Record<string, string>>({});
  const [savingEditPage, setSavingEditPage] = useState(false);

  const activeLocales = tenant?.activeLocales || ['pl', 'en'];
  const defaultLocale = tenant?.defaultLocale || 'pl';

  /** Resolve a custom page's display label for the current admin locale */
  const getCustomPageLabel = useCallback((cp: CustomPage) => {
    return cp.titleI18n?.[adminLocale] || cp.title || cp.slug;
  }, [adminLocale]);

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
      label: getCustomPageLabel(p),
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
      const created = await createCustomPage(selectedBranch._id, {
        title: newPageTitle.trim(),
        titleI18n: newPageTitleI18n,
        description: newPageDescription,
        descriptionI18n: newPageDescriptionI18n,
        seoTitle: newPageSeoTitle,
        seoTitleI18n: newPageSeoTitleI18n,
        seoDescription: newPageSeoDescription,
        seoDescriptionI18n: newPageSeoDescriptionI18n,
      });
      setCustomPages(prev => [...prev, created]);
      setNewPageTitle('');
      setNewPageTitleI18n({});
      setNewPageDescription('');
      setNewPageDescriptionI18n({});
      setNewPageSeoTitle('');
      setNewPageSeoTitleI18n({});
      setNewPageSeoDescription('');
      setNewPageSeoDescriptionI18n({});
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

  // ── Edit custom page ──
  const handleEditPage = (cp: CustomPage) => {
    setEditingPage(cp);
    setEditPageTitle(cp.title);
    setEditPageTitleI18n(cp.titleI18n || {});
    setEditPageDescription(cp.description || '');
    setEditPageDescriptionI18n(cp.descriptionI18n || {});
    setEditPageSeoTitle(cp.seoTitle || '');
    setEditPageSeoTitleI18n(cp.seoTitleI18n || {});
    setEditPageSeoDescription(cp.seoDescription || '');
    setEditPageSeoDescriptionI18n(cp.seoDescriptionI18n || {});
  };

  const handleSaveEditPage = async () => {
    if (!selectedBranch?._id || !editingPage) return;
    setSavingEditPage(true);
    try {
      const updated = await updateCustomPage(selectedBranch._id, editingPage.slug, {
        title: editPageTitle.trim() || editingPage.title,
        titleI18n: editPageTitleI18n,
        description: editPageDescription,
        descriptionI18n: editPageDescriptionI18n,
        seoTitle: editPageSeoTitle,
        seoTitleI18n: editPageSeoTitleI18n,
        seoDescription: editPageSeoDescription,
        seoDescriptionI18n: editPageSeoDescriptionI18n,
      });
      setCustomPages(prev => prev.map(p => p.slug === editingPage.slug ? updated : p));
      setEditingPage(null);
      await refetchBranches();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update page');
    } finally {
      setSavingEditPage(false);
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

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSections((prev) => {
      const oldIndex = prev.findIndex((s) => s._id === active.id);
      const newIndex = prev.findIndex((s) => s._id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;

      const reordered = arrayMove(prev, oldIndex, newIndex);
      const updates = reordered.map((section, i) => ({ _id: section._id, order: i }));

      // Persist to the database
      reorderBranchSectionsBulk(updates).catch((err) => {
        console.error('Failed to reorder sections:', err);
      });

      return reordered.map((section, i) => ({ ...section, order: i }));
    });
  }, []);

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
                {getCustomPageLabel(cp)}
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
            <>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href={`/${tenant?.defaultLocale || 'pl'}/${selectedBranch?.slug}/p/${activePage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  View Page
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const cp = customPages.find(p => p.slug === activePage);
                  if (cp) handleEditPage(cp);
                }}
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit Page
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmSlug(activePage)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Page
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showPreview ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-1.5"
          >
            {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPreview ? 'Hide Preview' : 'Preview'}
          </Button>
          <Button onClick={() => setIsPickerOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </div>
      </div>

      {/* ── Section list + Preview ── */}
      <div className={`flex gap-6 items-start ${showPreview ? '' : ''}`}>
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} shrink-0`}>
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
            onDragEnd={handleDragEnd}
          />
        </div>
        {showPreview && (
          <div className="w-1/2 sticky top-4">
            <PageBuilderPreview
              sections={sections}
              locale={tenant?.defaultLocale || 'pl'}
              tenantDomain={params.tenantDomain}
              branchSlug={selectedBranch?.slug}
            />
          </div>
        )}
      </div>

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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Custom Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Locale tabs for page title */}
            <div className="space-y-2">
              <Label>Page Title</Label>
              <div className="flex gap-1 mb-2">
                {activeLocales.map((lang) => (
                  <Button
                    key={lang}
                    type="button"
                    variant={newPageTitleTab === lang ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewPageTitleTab(lang)}
                  >
                    {lang === defaultLocale
                      ? `Base (${lang.toUpperCase()})`
                      : getLabelForLocale(lang)}
                  </Button>
                ))}
              </div>
              {/* Base locale input (required) */}
              {newPageTitleTab === defaultLocale ? (
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
              ) : (
                <Input
                  id={`page-title-${newPageTitleTab}`}
                  placeholder={`Title in ${getLabelForLocale(newPageTitleTab)}`}
                  value={newPageTitleI18n[newPageTitleTab] || ''}
                  onChange={(e) =>
                    setNewPageTitleI18n((prev) => ({ ...prev, [newPageTitleTab]: e.target.value }))
                  }
                />
              )}
              <p className="text-xs text-gray-500">
                A URL-safe slug will be auto-generated from the base locale title.
              </p>
            </div>

            {/* SEO fields */}
            <div className="space-y-3 pt-2 border-t border-border">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">SEO & Meta</p>
              <div className="space-y-2">
                <Label className="text-xs">Meta Title</Label>
                <Input
                  placeholder="SEO title (falls back to page title)"
                  value={newPageSeoTitle}
                  onChange={(e) => setNewPageSeoTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Meta Description</Label>
                <Input
                  placeholder="SEO description for search engines"
                  value={newPageSeoDescription}
                  onChange={(e) => setNewPageSeoDescription(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddPageOpen(false); setNewPageTitle(''); setNewPageTitleI18n({}); }}>
              Cancel
            </Button>
            <Button onClick={handleCreatePage} disabled={!newPageTitle.trim() || creatingPage}>
              {creatingPage && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit custom page dialog ── */}
      <Dialog open={!!editingPage} onOpenChange={(open) => { if (!open) setEditingPage(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Page</DialogTitle>
          </DialogHeader>
          {editingPage && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Page Title</Label>
                <Input
                  value={editPageTitle}
                  onChange={(e) => setEditPageTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Short description"
                  value={editPageDescription}
                  onChange={(e) => setEditPageDescription(e.target.value)}
                />
              </div>
              <div className="space-y-3 pt-2 border-t border-border">
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">SEO & Meta</p>
                <div className="space-y-2">
                  <Label className="text-xs">Meta Title</Label>
                  <Input
                    placeholder="SEO title (falls back to page title)"
                    value={editPageSeoTitle}
                    onChange={(e) => setEditPageSeoTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Meta Description</Label>
                  <Input
                    placeholder="SEO description for search engines"
                    value={editPageSeoDescription}
                    onChange={(e) => setEditPageSeoDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPage(null)}>Cancel</Button>
            <Button onClick={handleSaveEditPage} disabled={savingEditPage}>
              {savingEditPage && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
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
