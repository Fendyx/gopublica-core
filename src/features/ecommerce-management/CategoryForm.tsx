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
import EmojiPickerButton from '@/shared/ui/EmojiPickerButton';
import { useCloudinaryUpload } from '@/shared/lib/useCloudinaryUpload';
import { useTenant } from '@/entities/tenant/TenantContext';
import { slugify } from '@/shared/lib/slugify';

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
          key: editingCategory?.key || slugify(form.name),
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
        errorMessage = errData.error || t('errorSave');
        console.error('Backend error:', errorMessage);
        alert(t('errorSave'));
      }
    } catch (err) {
      console.error('Network error:', err);
      alert(t('networkError'));
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
          <SheetTitle className="text-xl">{editingCategory ? t('editTitle') : t('addTitle')}</SheetTitle>
          <SheetDescription>
            {editingCategory ? t('editDescription') : t('addDescription')}
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
                      <Label>{t('categoryNameLocale', { locale: locale.toUpperCase() })}</Label>
                      <Input
                        value={locale === defaultLocale ? form.name : (form.translations[locale]?.name || '')}
                        onChange={(e) => {
                          if (locale === defaultLocale) {
                            setForm({ ...form, name: e.target.value });
                          } else {
                            setForm({ ...form, translations: { ...form.translations, [locale]: { ...form.translations[locale], name: e.target.value } } });
                          }
                        }}
                        placeholder={locale === defaultLocale ? t('namePlaceholder') : t('translationFor', { locale: locale.toUpperCase() })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('descriptionLocale', { locale: locale.toUpperCase() })}</Label>
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
                        placeholder={locale === defaultLocale ? t('descriptionPlaceholder') : t('translationFor', { locale: locale.toUpperCase() })}
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cat-name">{t('categoryName')}</Label>
                  <Input id="cat-name" placeholder={t('namePlaceholder')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat-description">{t('description')}</Label>
                  <Textarea id="cat-description" placeholder={t('descriptionPlaceholder')} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </>
            )}

            {/* Parent category selector */}
            <div className="space-y-2">
              <Label>{t('parentCategory')}</Label>
              <Select
                value={form.parentCategoryKey || '__none__'}
                onValueChange={(val) => setForm({ ...form, parentCategoryKey: val === '__none__' ? '' : val })}
              >
                <SelectTrigger><SelectValue placeholder={t('noParent')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('noParent')}</SelectItem>
                  {categories
                    .filter((c: any) => !c.parentCategoryKey && c.key !== editingCategory?.key)
                    .map((c: any) => (
                      <SelectItem key={c.key} value={c.key}>{c.icon} {c.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {form.parentCategoryKey && (
                <p className="text-xs text-muted-foreground">
                  {t('willAppearUnder')} {categories.find((c: any) => c.key === form.parentCategoryKey)?.name || form.parentCategoryKey}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cat-icon">{t('icon')}</Label>
                <div className="flex gap-2 items-center">
                  <Input id="cat-icon" placeholder="📦" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="text-center text-xl" maxLength={2} />
                  <EmojiPickerButton value={form.icon} onChange={(emoji) => setForm({ ...form, icon: emoji })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('layout')}</Label>
                <Select value={form.layout} onValueChange={(val) => setForm({ ...form, layout: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid-3">{t('grid3')}</SelectItem>
                    <SelectItem value="grid-4">{t('grid4')}</SelectItem>
                    <SelectItem value="carousel">{t('carousel')}</SelectItem>
                    <SelectItem value="dynamic">{t('dynamicBento')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Новый селект для выбора стиля карточек */}
            <div className="space-y-2">
              <Label>{t('cardStyle')}</Label>
              <Select value={form.productCardVariant || '__global__'} onValueChange={(val) => setForm({ ...form, productCardVariant: val === '__global__' ? '' : val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__global__">{t('useGlobal')}</SelectItem>
                  <SelectItem value="action-bar">{t('actionBar')}</SelectItem>
                  <SelectItem value="overlay">{t('hoverOverlay')}</SelectItem>
                  <SelectItem value="minimal">{t('minimalist')}</SelectItem>
                  <SelectItem value="clean">{t('clean')}</SelectItem>
                  <SelectItem value="hover-vertical">{t('verticalOverlay')}</SelectItem>
                  <SelectItem value="action-overlay">{t('actionOverlay')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('cardWidth')}</Label>
              <Select value={form.productCardWidth} onValueChange={(val) => setForm({ ...form, productCardWidth: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">{t('default')}</SelectItem>
                  <SelectItem value="medium">{t('medium')}</SelectItem>
                  <SelectItem value="large">{t('large')}</SelectItem>
                  <SelectItem value="xlarge">{t('extraLarge')}</SelectItem>
                  <SelectItem value="full">{t('fullWidth')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.layout === 'carousel' && (
              <div className="flex items-center space-x-2 pt-2">
                <Switch id="carouselAutoplay" checked={form.carouselAutoplay} onCheckedChange={(checked) => setForm({ ...form, carouselAutoplay: checked })} />
                <Label htmlFor="carouselAutoplay">{t('carouselAutoplay')}</Label>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cat-cover">{t('coverImage')}</Label>
              <div className="flex gap-2">
                <Input id="cat-cover" placeholder="https://..." value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} />
                <Button type="button" variant="outline" onClick={openWidget} disabled={!widgetReady} className="gap-2 shrink-0">
                  <ImagePlus className="w-4 h-4" /> {t('upload')}
                </Button>
              </div>
              {form.coverImage && (
                <Image src={form.coverImage} alt="Preview" width={384} height={96} className="object-cover rounded-md border" />
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('categoryAspectRatio')}</Label>
              <Select value={form.imageAspectRatio} onValueChange={(val) => setForm({ ...form, imageAspectRatio: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1/1">{t('square')}</SelectItem>
                  <SelectItem value="4/5">{t('portrait45')}</SelectItem>
                  <SelectItem value="3/4">{t('portrait34')}</SelectItem>
                  <SelectItem value="16/9">{t('landscape169')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('productAspectRatio')}</Label>
              <Select value={form.productImageAspectRatio} onValueChange={(val) => setForm({ ...form, productImageAspectRatio: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1/1">{t('square')}</SelectItem>
                  <SelectItem value="4/5">{t('portrait45')}</SelectItem>
                  <SelectItem value="3/4">{t('portrait34')}</SelectItem>
                  <SelectItem value="16/9">{t('landscape169')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-bg-color">{t('bgColor')}</Label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={form.cardBgColor || '#ffffff'}
                  onChange={(e) => setForm({ ...form, cardBgColor: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer border border-border bg-transparent p-1"
                />
                <Input
                  placeholder={t('bgColorEmpty')}
                  value={form.cardBgColor}
                  onChange={(e) => setForm({ ...form, cardBgColor: e.target.value })}
                  className="max-w-xs"
                />
                {form.cardBgColor && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, cardBgColor: '' })}>
                    {t('reset')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <SheetFooter className="p-6 border-t border-border">
            <div className="flex justify-end gap-3 w-full">
              <Button type="button" variant="outline" onClick={onClose}>{t('cancel')}</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('saving')}</> : t('save')}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}