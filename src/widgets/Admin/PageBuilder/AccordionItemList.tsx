'use client';
import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { BranchSectionItem } from '@/entities/branch-section/types';
import { fetchBranchSectionItems } from '@/entities/branch-section/api';
import { useTenant } from '@/entities/tenant/TenantContext';
import { ArticleEditor } from '../ArticleEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GripVertical, Plus, Edit, Trash2, X, Check } from 'lucide-react';
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
import { saveBranchSectionItem } from '@/entities/branch-section/api';

// ─── Sortable Row ──────────────────────────────────────────────────────

function SortableItemRow({
  item,
  defaultLocale,
  onEdit,
  onDelete,
}: {
  item: BranchSectionItem;
  defaultLocale: string;
  onEdit: (item: BranchSectionItem) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const title = item.translations?.[defaultLocale]?.title || item.slug || '—';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 border rounded-lg bg-card hover:shadow-sm transition-shadow group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div {...listeners} className="cursor-grab shrink-0 touch-none">
          <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{item.slug}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}>
          <Edit className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(item._id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────

interface AccordionItemListProps {
  sectionId: string;
  initialItems?: BranchSectionItem[];
  onSaveItem: (item: Partial<BranchSectionItem>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

// ─── Component ─────────────────────────────────────────────────────────

export default function AccordionItemList({
  sectionId,
  initialItems = [],
  onSaveItem,
  onDeleteItem,
}: AccordionItemListProps) {
  const t = useTranslations('admin.sectionItems');
  const tenant = useTenant();
  const activeLocales = tenant?.activeLocales || ['pl', 'en'];
  const defaultLocale = tenant?.defaultLocale || 'pl';

  const [items, setItems] = useState<BranchSectionItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<BranchSectionItem> | null>(null);
  const [currentLang, setCurrentLang] = useState<string>('base');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBranchSectionItems(sectionId);
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ── Drag End: reorder ──
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i._id === active.id);
    const newIndex = items.findIndex((i) => i._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    // Persist new order
    try {
      const updates = reordered.map((item, idx) => saveBranchSectionItem(sectionId, { _id: item._id, order: idx } as any));
      await Promise.all(updates);
    } catch (err) {
      console.error('Reorder failed:', err);
      fetchItems(); // revert
    }
  };

  // ── CRUD handlers ──
  const handleAddNew = () => {
    const emptyTranslations: Record<string, any> = {};
    for (const locale of activeLocales) {
      emptyTranslations[locale] = { title: '' };
    }
    setEditingItem({
      _id: '',
      tenantId: '',
      branchId: '',
      sectionId,
      slug: '',
      media: { type: 'image', url: '' },
      order: items.length,
      translations: emptyTranslations,
      isActive: true,
      body: '',
      bodyI18n: {},
      gallery: [],
      attributes: [],
    });
    setCurrentLang('base');
  };

  const handleEdit = (item: BranchSectionItem) => {
    setEditingItem({ ...item });
    setCurrentLang('base');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    try {
      await onDeleteItem(id);
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!editingItem) return;
    try {
      await onSaveItem(editingItem);
      setEditingItem(null);
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
  };

  const updateTitle = (locale: string, value: string) => {
    if (!editingItem) return;
    setEditingItem((prev) => {
      if (!prev) return prev;
      const translations = prev.translations || {};
      return {
        ...prev,
        translations: {
          ...translations,
          [locale]: {
            ...(translations[locale] || {}),
            title: value,
          },
        },
      };
    });
  };

  const updateBody = (locale: string, value: string) => {
    if (!editingItem) return;
    setEditingItem((prev) => {
      if (!prev) return prev;
      if (locale === 'base') {
        return { ...prev, body: value };
      }
      return {
        ...prev,
        bodyI18n: {
          ...(prev.bodyI18n || {}),
          [locale]: value,
        },
      };
    });
  };

  // ─── List Mode ──────────────────────────────────────────────────────
  if (!editingItem) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{t('title')}</h3>
          <Button onClick={handleAddNew} className="gap-2">
            <Plus className="w-4 h-4" />
            {t('addItem')}
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        ) : items.length === 0 ? (
          <Card className="border-dashed border-2 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">{t('empty')}</p>
            </CardContent>
          </Card>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i._id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {items.map((item) => (
                  <SortableItemRow
                    key={item._id}
                    item={item}
                    defaultLocale={defaultLocale}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    );
  }

  // ─── Edit Mode ──────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {editingItem._id ? t('editItem') : t('addNewItem')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Slug */}
        <div className="space-y-1">
          <Label htmlFor="accordion-slug">{t('slug')}</Label>
          <Input
            id="accordion-slug"
            placeholder={t('slugPlaceholder')}
            value={editingItem.slug || ''}
            onChange={(e) =>
              setEditingItem({ ...editingItem, slug: e.target.value.replace(/[^a-z0-9-]/g, '') })
            }
          />
          <p className="text-xs text-muted-foreground">
            URL-safe identifier (a-z, 0-9, -)
          </p>
        </div>

        {/* Language Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-muted/50 p-3 rounded-xl border">
          <span className="text-sm font-medium">{t('translations')}</span>
          <Button
            variant={currentLang === 'base' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentLang('base')}
            className="rounded-lg text-xs font-medium"
          >
            Base ({defaultLocale.toUpperCase()})
          </Button>
          {activeLocales.map((lang: string) => (
            <Button
              key={lang}
              variant={currentLang === lang ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentLang(lang)}
              className="rounded-lg text-xs font-medium"
            >
              {lang.toUpperCase()}
            </Button>
          ))}
        </div>

        {/* Title */}
        <div className="space-y-1">
          <Label htmlFor="accordion-title">
            {t('titleField')} {currentLang !== 'base' && `(${currentLang.toUpperCase()})`}
          </Label>
          <Input
            id="accordion-title"
            placeholder={t('titlePlaceholder', { locale: currentLang === 'base' ? defaultLocale : currentLang })}
            value={
              currentLang === 'base'
                ? editingItem.translations?.[defaultLocale]?.title || ''
                : editingItem.translations?.[currentLang]?.title || ''
            }
            onChange={(e) =>
              updateTitle(currentLang === 'base' ? defaultLocale : currentLang, e.target.value)
            }
          />
        </div>

        {/* Rich Text Content */}
        <div className="space-y-2">
          <Label>
            {t('body')} {currentLang !== 'base' && `(${currentLang.toUpperCase()})`}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t('bodyPlaceholder') || 'Use the toolbar for formatting (bold, lists, links).'}
          </p>
          <div className="border rounded-xl bg-white overflow-hidden min-h-[180px]">
            <ArticleEditor
              body={
                currentLang === 'base'
                  ? (editingItem.body || '')
                  : (editingItem.bodyI18n?.[currentLang] || '')
              }
              onChange={(val: string) => updateBody(currentLang === 'base' ? 'base' : currentLang, val)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t">
          <Button variant="outline" onClick={handleCancel} className="gap-2">
            <X className="w-4 h-4" />
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Check className="w-4 h-4" />
            {t('save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
