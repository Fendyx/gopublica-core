'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { BranchSectionItem } from '@/entities/branch-section/types';
import { useCloudinaryUpload } from '@/shared/lib/useCloudinaryUpload';
import { fetchBranchSectionItems } from '@/entities/branch-section/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Edit, X } from 'lucide-react';
import { useTenant } from '@/entities/tenant/TenantContext';

interface SectionItemListProps {
  sectionId: string;
  initialItems?: BranchSectionItem[];
  onSaveItem: (item: Partial<BranchSectionItem>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

export default function SectionItemList({
  sectionId,
  initialItems = [],
  onSaveItem,
  onDeleteItem,
}: SectionItemListProps) {
  const t = useTranslations('admin.sectionItems');
  const tenant = useTenant();
  const activeLocales = tenant?.activeLocales || ['pl', 'en'];
  const [items, setItems] = useState<BranchSectionItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<BranchSectionItem> | null>(null);

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

  // Fetch items on mount based on sectionId
  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  const handleEdit = (item: BranchSectionItem) => {
    setEditingItem({ ...item });
  };

  const handleAddNew = () => {
    setEditingItem({
      _id: '',
      tenantId: '',
      branchId: '',
      sectionId,
      slug: '',
      media: { type: 'image', url: '' },
      order: items.length,
      translations: {},
      isActive: true,
      body: '',
      gallery: [],
      attributes: [],
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    await onDeleteItem(id);
    fetchItems();
  };

  const handleSave = async () => {
    if (!editingItem) return;
    await onSaveItem(editingItem);
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

  // --- List Mode ---
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <Card key={item._id} className="group overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3 space-y-2">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted/30">
                    {item.media?.url ? (
                      item.media.type === 'video' ? (
                        <video
                          src={item.media.url}
                          className="w-full h-full object-cover rounded-lg"
                          controls
                        />
                      ) : (
                        <Image
                          src={item.media.url}
                          alt={item.slug || 'preview'}
                          fill
                          sizes="(max-width: 640px) 100vw, 33vw"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        {t('noMedia')}
                      </div>
                    )}
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="w-6 h-6"
                        onClick={() => handleDelete(item._id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm font-medium truncate">{item.slug || t('noSlug')}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- Edit Mode ---
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {editingItem._id ? t('editItem') : t('addNewItem')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Slug */}
        <div className="space-y-1">
          <Label htmlFor="slug">{t('slug')}</Label>
          <Input
            id="slug"
            placeholder={t('slugPlaceholder')}
            value={editingItem.slug || ''}
            onChange={(e) =>
              setEditingItem({ ...editingItem, slug: e.target.value })
            }
          />
        </div>

        {/* Media Upload */}
        <div className="space-y-2">
          <Label>{t('media')}</Label>
          <Button
            variant="outline"
            onClick={openWidget}
            disabled={!widgetReady}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('uploadMedia')}
          </Button>
          {editingItem.media?.url && (
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
                <p className="text-sm text-muted-foreground break-all">
                  {editingItem.media.url}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Translations */}
        <div className="space-y-3">
          <Label>{t('translations')}</Label>
          {activeLocales.map((locale: string) => (
            <div key={locale} className="space-y-2 p-3 border rounded-lg">
              <p className="text-sm font-medium uppercase">{locale}</p>
              <div className="space-y-1">
                <Label htmlFor={`title-${locale}`}>{t('titleField')}</Label>
                <Input
                  id={`title-${locale}`}
                  placeholder={t('titlePlaceholder', { locale })}
                  value={editingItem.translations?.[locale]?.title || ''}
                  onChange={(e) =>
                    updateTranslation(locale, 'title', e.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`subtitle-${locale}`}>{t('subtitle')}</Label>
                <Input
                  id={`subtitle-${locale}`}
                  placeholder={t('subtitlePlaceholder', { locale })}
                  value={editingItem.translations?.[locale]?.subtitle || ''}
                  onChange={(e) =>
                    updateTranslation(locale, 'subtitle', e.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="space-y-1">
          <Label htmlFor="body">{t('body')}</Label>
          <textarea
            id="body"
            placeholder={t('bodyPlaceholder')}
            value={editingItem.body || ''}
            onChange={(e) =>
              setEditingItem({ ...editingItem, body: e.target.value })
            }
            className="flex h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          />
        </div>

        {/* Gallery Manager */}
        <div className="space-y-2">
          <Label>{t('gallery')}</Label>
          {editingItem.gallery && editingItem.gallery.length > 0 ? (
            <div className="space-y-2">
              {editingItem.gallery.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={item.url}
                    onChange={(e) => {
                      const newGallery = [...(editingItem.gallery || [])];
                      newGallery[idx] = { ...newGallery[idx], url: e.target.value };
                      setEditingItem({ ...editingItem, gallery: newGallery });
                    }}
                    placeholder={t('mediaUrl')}
                  />
                  <select
                    value={item.type}
                    onChange={(e) => {
                      const newGallery = [...(editingItem.gallery || [])];
                      newGallery[idx] = { ...newGallery[idx], type: e.target.value as 'video' | 'image' };
                      setEditingItem({ ...editingItem, gallery: newGallery });
                    }}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="image">{t('image')}</option>
                    <option value="video">{t('video')}</option>
                  </select>
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

        {/* Attributes Manager */}
        <div className="space-y-2">
          <Label>{t('attributes')}</Label>
          {editingItem.attributes && editingItem.attributes.length > 0 ? (
            <div className="space-y-2">
              {editingItem.attributes.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={item.key}
                    onChange={(e) => {
                      const newAttrs = [...(editingItem.attributes || [])];
                      newAttrs[idx] = { ...newAttrs[idx], key: e.target.value };
                      setEditingItem({ ...editingItem, attributes: newAttrs });
                    }}
                    placeholder={t('keyPlaceholder')}
                  />
                  <Input
                    value={item.value}
                    onChange={(e) => {
                      const newAttrs = [...(editingItem.attributes || [])];
                      newAttrs[idx] = { ...newAttrs[idx], value: e.target.value };
                      setEditingItem({ ...editingItem, attributes: newAttrs });
                    }}
                    placeholder={t('valuePlaceholder')}
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
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('noAttributes')}</p>
          )}
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
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} className="gap-2">
            <Plus className="w-4 h-4" />
            {t('save')}
          </Button>
          <Button variant="outline" onClick={handleCancel} className="gap-2">
            <X className="w-4 h-4" />
            {t('cancel')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
