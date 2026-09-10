'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { BranchSectionItem, SectionType } from '@/entities/branch-section/types';
import { useCloudinaryUpload } from '@/shared/lib/useCloudinaryUpload';
import { fetchBranchSectionItems } from '@/entities/branch-section/api';
import { ArticleEditor } from '../ArticleEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Edit, X, Check } from 'lucide-react';
import { useTenant } from '@/entities/tenant/TenantContext';

// ─── Field Visibility Config ──────────────────────────────────────────
// Defines which fields are shown for each section type.
type FieldType = 'slug' | 'media' | 'translations' | 'body' | 'gallery' | 'attributes';

const FIELD_VISIBILITY: Record<string, FieldType[]> = {
  // Carousel types: show everything (existing behavior)
  entity_carousel: ['slug', 'media', 'translations', 'body', 'gallery', 'attributes'],
  feature_carousel: ['slug', 'media', 'translations', 'body', 'gallery', 'attributes'],

  // Accordion: title (per locale) + rich body (per locale). No media, gallery, attributes.
  accordion: ['translations', 'body'],

  // Testimonials: media (avatar, optional), title (author name), body (review text with TipTap), attributes (rating, link_url)
  testimonials: ['media', 'translations', 'body', 'attributes'],

  // Before/After: media (before image), gallery (after image), attributes (captions)
  before_after: ['media', 'gallery', 'attributes'],

  // Logo Ticker: media (logo image), attributes (link_url)
  logo_ticker: ['media', 'attributes'],
};

function getVisibleFields(sectionType?: SectionType): FieldType[] {
  if (!sectionType) return ['slug', 'media', 'translations', 'body', 'gallery', 'attributes'];
  return FIELD_VISIBILITY[sectionType] || ['slug', 'media', 'translations', 'body', 'gallery', 'attributes'];
}

/** Check if a field should be visible for this section type */
function hasField(sectionType: SectionType | undefined, field: FieldType): boolean {
  return getVisibleFields(sectionType).includes(field);
}

// ─── Attribute Presets ────────────────────────────────────────────────
const ATTRIBUTE_PRESETS: Record<string, { key: string; label: string }[]> = {
  testimonials: [
    { key: 'rating', label: 'Rating (1-5)' },
    { key: 'link_url', label: 'Link URL' },
  ],
  before_after: [
    { key: 'caption_before', label: 'Before Label' },
    { key: 'caption_after', label: 'After Label' },
  ],
  logo_ticker: [
    { key: 'link_url', label: 'Link URL' },
  ],
};

// ─── Props ─────────────────────────────────────────────────────────────

interface SectionItemListProps {
  sectionId: string;
  sectionType?: SectionType;
  initialItems?: BranchSectionItem[];
  onSaveItem: (item: Partial<BranchSectionItem>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

// ─── Component ─────────────────────────────────────────────────────────

export default function SectionItemList({
  sectionId,
  sectionType,
  initialItems = [],
  onSaveItem,
  onDeleteItem,
}: SectionItemListProps) {
  const t = useTranslations('admin.sectionItems');
  const tenant = useTenant();
  const activeLocales = tenant?.activeLocales || ['pl', 'en'];
  const defaultLocale = tenant?.defaultLocale || 'pl';
  const [items, setItems] = useState<BranchSectionItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<BranchSectionItem> | null>(null);
  const [currentLang, setCurrentLang] = useState<string>('base');

  const { openWidget, widgetReady } = useCloudinaryUpload({
    onSuccess: (url: string, resourceType?: string) => {
      const mediaType = resourceType === 'video' ? 'video' : 'image';
      setEditingItem((prev) =>
        prev ? { ...prev, media: { type: mediaType, url } } : null
      );
    },
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await fetchBranchSectionItems(sectionId);
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  const handleEdit = (item: BranchSectionItem) => {
    setEditingItem({ ...item });
    setCurrentLang('base');
  };

  const handleAddNew = () => {
    const emptyTranslations: Record<string, any> = {};
    for (const locale of activeLocales) {
      emptyTranslations[locale] = { title: '', subtitle: '' };
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

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    await onDeleteItem(id);
    fetchItems();
  };

  const handleSave = async () => {
    if (!editingItem) return;

    // Build payload: auto-generate slug if hidden, strip empty fields
    const payload = { ...editingItem };

    if (!hasField(sectionType, 'slug') && !payload.slug) {
      payload.slug = `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    // Remove empty media if this section type doesn't show the media field
    if (!hasField(sectionType, 'media')) {
      delete payload.media;
    }

    // Clean up empty gallery / attribute items
    if (payload.gallery) {
      payload.gallery = payload.gallery.filter((g) => g.url);
    }
    if (payload.attributes) {
      payload.attributes = payload.attributes.filter((a) => a.key || a.value);
    }

    await onSaveItem(payload);
    setEditingItem(null);
    fetchItems();
  };

  const handleCancel = () => {
    setEditingItem(null);
  };

  const updateTranslation = (locale: string, field: 'title' | 'subtitle', value: string) => {
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
            [field]: value,
          },
        },
      };
    });
  };

  const updateBodyI18n = (locale: string, value: string) => {
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

  const updateAttribute = (idx: number, field: 'key' | 'value', val: string) => {
    if (!editingItem) return;
    setEditingItem((prev) => {
      if (!prev) return prev;
      const attrs = [...(prev.attributes || [])];
      attrs[idx] = { ...attrs[idx], [field]: val };
      return { ...prev, attributes: attrs };
    });
  };

  // ─── Helpers for contextual labels ─────────────────────────────────
  const getMediaLabel = () => {
    if (sectionType === 'logo_ticker') return t('logoImage') || 'Logo Image';
    if (sectionType === 'testimonials') return t('avatarImage') || 'Avatar Image';
    if (sectionType === 'before_after') return t('beforeImage') || 'Before Image';
    return t('media');
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
          <div className="space-y-2">
            {items.map((item) => (
              <Card key={item._id} className="group overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {hasField(sectionType, 'media') && item.media?.url ? (
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted/30">
                        {item.media.type === 'video' ? (
                          <video src={item.media.url} className="w-full h-full object-cover" />
                        ) : (
                          <Image src={item.media.url} alt="preview" fill sizes="40px" className="object-cover" />
                        )}
                      </div>
                    ) : hasField(sectionType, 'media') ? (
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground text-xs">
                        {t('noMedia')}
                      </div>
                    ) : null}

                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.translations?.[defaultLocale]?.title ||
                          item.translations?.en?.title ||
                          item.slug ||
                          t('noTitle')}
                      </p>
                      {hasField(sectionType, 'slug') && item.slug && (
                        <p className="text-xs text-muted-foreground truncate">{item.slug}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(item._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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

        {/* ─── Slug (only for carousel types) ─── */}
        {hasField(sectionType, 'slug') && (
          <div className="space-y-1">
            <Label htmlFor="item-slug">{t('slug')}</Label>
            <Input
              id="item-slug"
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
        )}

        {/* ─── Media Upload ─── */}
        {hasField(sectionType, 'media') && (
          <div className="space-y-2">
            <Label>{getMediaLabel()}</Label>
            <Button
              variant="outline"
              onClick={openWidget}
              disabled={!widgetReady}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('uploadMedia')}
            </Button>
            {editingItem.media?.url ? (
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                {editingItem.media.type === 'video' ? (
                  <video
                    src={editingItem.media.url}
                    className="h-24 w-24 object-cover rounded-lg shadow-sm"
                    controls
                  />
                ) : (
                  <Image
                    src={editingItem.media.url}
                    alt="preview"
                    width={96}
                    height={96}
                    className="object-cover rounded-lg shadow-sm"
                  />
                )}
                <div className="space-y-2 flex-1">
                  <p className="text-sm text-muted-foreground break-all">{editingItem.media.url}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingItem({ ...editingItem, media: { type: 'image', url: '' } })}
                    className="text-destructive"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    {t('remove') || 'Remove'}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ─── Language Tabs + Title (for types with translations) ─── */}
        {hasField(sectionType, 'translations') && (
          <>
            {/* Language Tabs */}
            <div className="flex flex-wrap items-center gap-2 bg-muted/50 p-3 rounded-xl border">
              <span className="text-sm font-medium">
                {sectionType === 'testimonials'
                  ? (t('reviewText') || 'Review Text')
                  : sectionType === 'accordion'
                    ? (t('questionAndAnswer') || 'Question & Answer')
                    : t('translations')}
              </span>
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
              <Label htmlFor="item-title">
                {sectionType === 'testimonials'
                  ? (t('reviewText') || 'Review Text')
                  : t('titleField')}
                {currentLang !== 'base' && ` (${currentLang.toUpperCase()})`}
              </Label>
              <Input
                id="item-title"
                placeholder={t('titlePlaceholder', { locale: currentLang === 'base' ? defaultLocale : currentLang })}
                value={
                  currentLang === 'base'
                    ? (editingItem.translations?.[defaultLocale]?.title || '')
                    : (editingItem.translations?.[currentLang]?.title || '')
                }
                onChange={(e) =>
                  updateTranslation(currentLang === 'base' ? defaultLocale : currentLang, 'title', e.target.value)
                }
              />
              {sectionType === 'testimonials' && (
                <p className="text-xs text-muted-foreground">
                  {t('testimonialTitleHint') || 'Review text displayed to the customer'}
                </p>
              )}
            </div>
          </>
        )}

        {/* ─── Body (TipTap Rich Text) — accordion body ─── */}
        {hasField(sectionType, 'body') && (
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
                onChange={(val: string) => updateBodyI18n(currentLang === 'base' ? 'base' : currentLang, val)}
              />
            </div>
          </div>
        )}

        {/* ─── Gallery (for before_after: "after" image) ─── */}
        {hasField(sectionType, 'gallery') && (
          <div className="space-y-2">
            <Label>
              {sectionType === 'before_after' ? (t('afterImage') || 'After Image') : t('gallery')}
            </Label>
            {editingItem.gallery && editingItem.gallery.length > 0 ? (
              <div className="space-y-2">
                {editingItem.gallery.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {item.url ? (
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted/30">
                        <Image src={item.url} alt={`gallery ${idx}`} fill sizes="64px" className="object-cover" />
                      </div>
                    ) : null}
                    <Input
                      value={item.url}
                      onChange={(e) => {
                        const newGallery = [...(editingItem.gallery || [])];
                        newGallery[idx] = { ...newGallery[idx], url: e.target.value };
                        setEditingItem({ ...editingItem, gallery: newGallery });
                      }}
                      placeholder={t('mediaUrl')}
                      className="flex-1"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        const newGallery = [...(editingItem.gallery || [])];
                        newGallery.splice(idx, 1);
                        setEditingItem({ ...editingItem, gallery: newGallery });
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('noGalleryItems')}</p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newGallery = [...(editingItem.gallery || []), { type: 'image' as const, url: '' }];
                setEditingItem({ ...editingItem, gallery: newGallery });
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('addGalleryItem')}
            </Button>
          </div>
        )}

        {/* ─── Attributes Manager ─── */}
        {hasField(sectionType, 'attributes') && (
          <div className="space-y-2">
            <Label>{t('attributes')}</Label>
            {editingItem.attributes && editingItem.attributes.length > 0 ? (
              <div className="space-y-2">
                {editingItem.attributes.map((item, idx) => {
                  const preset = ATTRIBUTE_PRESETS[sectionType || '']?.find((p) => p.key === item.key);
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={item.key}
                        onChange={(e) => updateAttribute(idx, 'key', e.target.value)}
                        placeholder={t('keyPlaceholder')}
                        className="flex-1"
                        readOnly={!!preset}
                      />
                      <Input
                        value={item.value}
                        onChange={(e) => updateAttribute(idx, 'value', e.target.value)}
                        placeholder={preset?.label || t('valuePlaceholder')}
                        className="flex-1"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const newAttrs = [...(editingItem.attributes || [])];
                          newAttrs.splice(idx, 1);
                          setEditingItem({ ...editingItem, attributes: newAttrs });
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('noAttributes')}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newAttrs = [...(editingItem.attributes || []), { key: '', value: '' }];
                  setEditingItem({ ...editingItem, attributes: newAttrs });
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                {t('addAttribute')}
              </Button>
              {/* Quick-add preset attributes */}
              {ATTRIBUTE_PRESETS[sectionType || '']?.map((preset) => {
                const alreadyAdded = editingItem.attributes?.some((a) => a.key === preset.key);
                if (alreadyAdded) return null;
                return (
                  <Button
                    key={preset.key}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newAttrs = [...(editingItem.attributes || []), { key: preset.key, value: '' }];
                      setEditingItem({ ...editingItem, attributes: newAttrs });
                    }}
                    className="gap-1 text-xs"
                  >
                    <Plus className="w-3 h-3" />
                    {preset.label}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Actions ─── */}
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
