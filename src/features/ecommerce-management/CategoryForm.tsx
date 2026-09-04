'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, ImagePlus } from 'lucide-react';
import { useCloudinaryUpload } from '@/shared/lib/useCloudinaryUpload';
import { useTenant } from '@/entities/tenant/TenantContext';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory: any | null;
  categories: any[];
  token: string;
  onSave: () => void;
}

export default function CategoryForm({ isOpen, onClose, editingCategory, categories, token, onSave }: CategoryFormProps) {
  const t = useTranslations('admin.categoryForm');
  const tenant = useTenant();
  const activeLocales = tenant?.activeLocales || ['pl', 'en'];
  const defaultLocale = tenant?.defaultLocale || 'pl';
  const [loading, setLoading] = useState(false);
  const [translationTab, setTranslationTab] = useState(defaultLocale);
  const [form, setForm] = useState({
    name: '',
    description: '',
    icon: '📦',
    layout: 'grid-3',
    coverImage: '',
    cardBgColor: '',
    imageAspectRatio: '1/1',
    productImageAspectRatio: '1/1',
    carouselAutoplay: false,
    productCardVariant: '',
    productCardWidth: 'default',
    parentCategoryKey: '' as string,
    translations: {} as Record<string, { name?: string; description?: string }>,
  });

  const { openWidget, widgetReady, isWidgetOpen } = useCloudinaryUpload({
    onSuccess: (url) => setForm((prev) => ({ ...prev, coverImage: url })),
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (editingCategory) {
      setForm({
        name: editingCategory.name || '',
        description: editingCategory.description || '',
        icon: editingCategory.icon || '📦',
        layout: editingCategory.layout || 'grid-3',
        coverImage: editingCategory.coverImage || '',
        cardBgColor: editingCategory.cardBgColor || '',
        imageAspectRatio: editingCategory.imageAspectRatio || '1/1',
        productImageAspectRatio: editingCategory.productImageAspectRatio || '1/1',
        carouselAutoplay: editingCategory.carouselAutoplay || false,
        productCardVariant: editingCategory.productCardVariant || '',
        productCardWidth: editingCategory.productCardWidth || 'default',
        parentCategoryKey: editingCategory.parentCategoryKey || '',
        translations: editingCategory.translations || {},
      });
    } else {
      setForm({
        name: '',
        description: '',
        icon: '📦',
        layout: 'grid-3',
        coverImage: '',
        cardBgColor: '',
        imageAspectRatio: '1/1',
        productImageAspectRatio: '1/1',
        carouselAutoplay: false,
        productCardVariant: '',
        productCardWidth: 'default',
        parentCategoryKey: '',
        translations: {},
      });
    }
  }, [editingCategory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let errorMessage = '';

    const url = editingCategory
      ? `${apiUrl}/api/saas/categories/${editingCategory._id}`
      : `${apiUrl}/api/saas/categories`;
    const method = editingCategory ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: editingCategory?.key || form.name.toLowerCase().replace(/\s+/g, '-'),
          name: form.name,
          description: form.description,
          icon: form.icon,
          layout: form.layout,
          coverImage: form.coverImage,
          cardBgColor: form.cardBgColor,
          niche: 'ecommerce',
          imageAspectRatio: form.imageAspectRatio,
          productImageAspectRatio: form.productImageAspectRatio,
          carouselAutoplay: form.carouselAutoplay,
          productCardVariant: form.productCardVariant || null,
          productCardWidth: form.productCardWidth,
          parentCategoryKey: form.parentCategoryKey || null,
          translations: form.translations,
        }),
      });

      if (res.ok) {
        setForm({
          name: '',
          description: '',
          icon: '📦',
          layout: 'grid-3',
          coverImage: '',
          cardBgColor: '',
          imageAspectRatio: '1/1',
          productImageAspectRatio: '1/1',
          carouselAutoplay: false,
          productCardVariant: '',
          productCardWidth: 'default',
          parentCategoryKey: '',
          translations: {},
        });
        onSave();
        onClose();
      } else {
        const errData = await res.json().catch(() => ({}));
        errorMessage = errData.error || 'Failed to save category';
        console.error('Backend error:', errorMessage);
        alert(`Error: ${errorMessage}`);
      }
    } catch (err) {
      console.error('Network error:', err);
      alert('Network error. Check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && isWidgetOpen) return;
        onClose();
      }}
      modal={false}
    >
      <SheetContent side="right" className="w-full sm:max-w-[450px] p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-border">
          <SheetTitle className="text-xl">{editingCategory ? 'Edit Category' : 'Add New Category'}</SheetTitle>
          <SheetDescription>
            {editingCategory ? 'Update the category details.' : 'Create a category to group your products.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Translation tabs for name/description */}
            {activeLocales.length > 1 ? (
              <Tabs value={translationTab} onValueChange={setTranslationTab}>
                <TabsList className="bg-muted/50">
                  {activeLocales.map((locale) => (
                    <TabsTrigger key={locale} value={locale} className="text-xs uppercase">
                      {locale}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {activeLocales.map((locale) => (
                  <TabsContent key={locale} value={locale} className="space-y-3 mt-3">
                    <div className="space-y-2">
                      <Label>Category Name ({locale.toUpperCase()})</Label>
                      <Input
                        value={locale === defaultLocale ? form.name : (form.translations[locale]?.name || '')}
                        onChange={(e) => {
                          if (locale === defaultLocale) {
                            setForm({ ...form, name: e.target.value });
                          } else {
                            setForm({ ...form, translations: { ...form.translations, [locale]: { ...form.translations[locale], name: e.target.value } } });
                          }
                        }}
                        placeholder={locale === defaultLocale ? 'e.g. Electronics' : `Translation for ${locale.toUpperCase()}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description ({locale.toUpperCase()})</Label>
                      <Textarea
                        rows={2}
                        value={locale === defaultLocale ? form.description : (form.translations[locale]?.description || '')}
                        onChange={(e) => {
                          if (locale === defaultLocale) {
                            setForm({ ...form, description: e.target.value });
                          } else {
                            setForm({ ...form, translations: { ...form.translations, [locale]: { ...form.translations[locale], description: e.target.value } } });
                          }
                        }}
                        placeholder={locale === defaultLocale ? 'e.g. Just landed' : `Translation for ${locale.toUpperCase()}`}
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cat-name">Category Name</Label>
                  <Input id="cat-name" placeholder="e.g. Electronics" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat-description">Description</Label>
                  <Textarea id="cat-description" placeholder="e.g. Just landed" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </>
            )}

            {/* Parent category selector */}
            <div className="space-y-2">
              <Label>Parent Category (optional)</Label>
              <Select
                value={form.parentCategoryKey || '__none__'}
                onValueChange={(val) => setForm({ ...form, parentCategoryKey: val === '__none__' ? '' : val })}
              >
                <SelectTrigger><SelectValue placeholder="No parent (top-level)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No parent (top-level)</SelectItem>
                  {categories
                    .filter((c: any) => !c.parentCategoryKey && c.key !== editingCategory?.key)
                    .map((c: any) => (
                      <SelectItem key={c.key} value={c.key}>{c.icon} {c.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {form.parentCategoryKey && (
                <p className="text-xs text-muted-foreground">
                  This category will appear under: {categories.find((c: any) => c.key === form.parentCategoryKey)?.name || form.parentCategoryKey}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cat-icon">Icon (Emoji)</Label>
                <Input id="cat-icon" placeholder="📦" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="text-center text-xl" maxLength={2} />
              </div>
              <div className="space-y-2">
                <Label>Display Layout</Label>
                <Select value={form.layout} onValueChange={(val) => setForm({ ...form, layout: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid-3">Grid (3 cols)</SelectItem>
                    <SelectItem value="grid-4">Grid (4 cols)</SelectItem>
                    <SelectItem value="carousel">Carousel</SelectItem>
                    <SelectItem value="dynamic">Dynamic Bento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Новый селект для выбора стиля карточек */}
            <div className="space-y-2">
              <Label>Product Card Style</Label>
              <Select value={form.productCardVariant || '__global__'} onValueChange={(val) => setForm({ ...form, productCardVariant: val === '__global__' ? '' : val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__global__">Use global setting</SelectItem>
                  <SelectItem value="action-bar">Action Bar</SelectItem>
                  <SelectItem value="overlay">Hover Overlay</SelectItem>
                  <SelectItem value="minimal">Minimalist</SelectItem>
                  <SelectItem value="clean">Clean (image only)</SelectItem>
                  <SelectItem value="hover-vertical">Vertical Overlay</SelectItem>
                  <SelectItem value="action-overlay">Action + Overlay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Product Card Width</Label>
              <Select value={form.productCardWidth} onValueChange={(val) => setForm({ ...form, productCardWidth: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="xlarge">Extra Large</SelectItem>
                  <SelectItem value="full">Full Width</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.layout === 'carousel' && (
              <div className="flex items-center space-x-2 pt-2">
                <Switch id="carouselAutoplay" checked={form.carouselAutoplay} onCheckedChange={(checked) => setForm({ ...form, carouselAutoplay: checked })} />
                <Label htmlFor="carouselAutoplay">Auto‑scroll carousel</Label>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cat-cover">Cover Image</Label>
              <div className="flex gap-2">
                <Input id="cat-cover" placeholder="https://..." value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} />
                <Button type="button" variant="outline" onClick={openWidget} disabled={!widgetReady} className="gap-2 shrink-0">
                  <ImagePlus className="w-4 h-4" /> Upload
                </Button>
              </div>
              {form.coverImage && (
                <Image src={form.coverImage} alt="Preview" width={384} height={96} className="object-cover rounded-md border" />
              )}
            </div>

            <div className="space-y-2">
              <Label>Category Card Image Aspect Ratio</Label>
              <Select value={form.imageAspectRatio} onValueChange={(val) => setForm({ ...form, imageAspectRatio: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1/1">Square (1:1)</SelectItem>
                  <SelectItem value="4/5">Portrait (4:5)</SelectItem>
                  <SelectItem value="3/4">Portrait (3:4)</SelectItem>
                  <SelectItem value="16/9">Landscape (16:9)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Product Image Aspect Ratio</Label>
              <Select value={form.productImageAspectRatio} onValueChange={(val) => setForm({ ...form, productImageAspectRatio: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1/1">Square (1:1)</SelectItem>
                  <SelectItem value="4/5">Portrait (4:5)</SelectItem>
                  <SelectItem value="3/4">Portrait (3:4)</SelectItem>
                  <SelectItem value="16/9">Landscape (16:9)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-bg-color">Card Background Color</Label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={form.cardBgColor || '#ffffff'}
                  onChange={(e) => setForm({ ...form, cardBgColor: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer border border-border bg-transparent p-1"
                />
                <Input
                  placeholder="Empty = Default"
                  value={form.cardBgColor}
                  onChange={(e) => setForm({ ...form, cardBgColor: e.target.value })}
                  className="max-w-xs"
                />
                {form.cardBgColor && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, cardBgColor: '' })}>
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </div>

          <SheetFooter className="p-6 border-t border-border">
            <div className="flex justify-end gap-3 w-full">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Category'}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}