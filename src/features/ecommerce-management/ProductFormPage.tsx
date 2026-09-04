'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, X, Plus, ImagePlus, Trash2 } from 'lucide-react';
import type { MenuItem, ProductVariant, ProductAttribute as ProductAttr, AttributeRef, AttributeType } from '@/entities/menu-item/types';
import type { ProductAttribute } from '@/entities/product-attribute/types';
import { suggestAttributes, createAttribute } from '@/entities/product-attribute/api';
import { useCloudinaryUpload } from '@/shared/lib/useCloudinaryUpload';
import { useToast } from '@/shared/ui/Toast';
import { useTenant } from '@/entities/tenant/TenantContext';
import { useBranch } from '@/entities/branch/BranchContext';

interface ProductFormPageProps {
  /** null = create mode, MenuItem = edit mode */
  editingProduct: MenuItem | null;
  categories: any[];
  token: string;
}

const EMPTY_FORM = {
  name: '',
  description: '',
  price: 0,
  image: '',
  categoryKey: '__none__',
  category: '',
  status: 'published' as string,
  sku: '',
  stock: 0,
  compareAtPrice: 0,
  images: [] as string[],
  weight: 0,
  weightUnit: 'kg' as 'g' | 'kg' | 'lb',
  dimensions: { length: 0, width: 0, height: 0, unit: 'cm' },
  tags: [] as string[],
  variants: [] as ProductVariant[],
  attributes: [] as ProductAttr[],
  attributeRefs: [] as AttributeRef[],
  translations: {} as Record<string, { name?: string; description?: string }>,
  isFeatured: false,
};

export default function ProductFormPage({ editingProduct, categories, token }: ProductFormPageProps) {
  const t = useTranslations('admin.productForm');
  const tm = useTranslations('admin.productManager');
  const { showToast } = useToast();
  const router = useRouter();
  const tenant = useTenant();
  const { selectedBranch } = useBranch();
  const activeLocales = tenant?.activeLocales || ['pl', 'en'];
  const defaultLocale = tenant?.defaultLocale || 'pl';

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [hasVariants, setHasVariants] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [translationTab, setTranslationTab] = useState(defaultLocale);

  // Managed attribute picker state
  const [attrSearch, setAttrSearch] = useState<Record<string, string>>({});
  const [attrResults, setAttrResults] = useState<Record<string, ProductAttribute[]>>({});
  const [attrLoading, setAttrLoading] = useState<Record<string, boolean>>({});

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const { openWidget: openMainWidget, widgetReady: mainReady, isWidgetOpen: isMainWidgetOpen } = useCloudinaryUpload({
    onSuccess: (url) => setForm((prev) => ({ ...prev, image: url })),
  });

  const { openWidget: openExtraWidget, widgetReady: extraReady, isWidgetOpen: isExtraWidgetOpen } = useCloudinaryUpload({
    onSuccess: (url) => setForm((prev) => ({ ...prev, images: [...prev.images, url] })),
  });

  useEffect(() => {
    if (editingProduct) {
      // Resolve categoryKey: prefer stored key, fallback to name→key lookup via categories
      let resolvedKey = editingProduct.categoryKey || '';
      if (!resolvedKey && editingProduct.category && categories.length > 0) {
        const match = categories.find((c: any) => c.name === editingProduct.category);
        if (match) resolvedKey = match.key;
      }

      setForm({
        ...EMPTY_FORM,
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        image: editingProduct.image || '',
        categoryKey: resolvedKey === '' ? '__none__' : resolvedKey,
        category: editingProduct.category || '',
        status: editingProduct.status || 'published',
        sku: editingProduct.sku || '',
        stock: editingProduct.stock || 0,
        compareAtPrice: editingProduct.compareAtPrice || 0,
        images: editingProduct.images || [],
        weight: editingProduct.weight || 0,
        weightUnit: editingProduct.weightUnit || 'kg',
        dimensions: {
          length: editingProduct.dimensions?.length ?? 0,
          width: editingProduct.dimensions?.width ?? 0,
          height: editingProduct.dimensions?.height ?? 0,
          unit: editingProduct.dimensions?.unit ?? 'cm',
        },
        tags: editingProduct.tags || [],
        variants: editingProduct.variants || [],
        attributes: editingProduct.attributes || [],
        attributeRefs: editingProduct.attributeRefs || [],
        translations: (editingProduct as any).translations || {},
        isFeatured: editingProduct.isFeatured || false,
      });
      setHasVariants(!!(editingProduct.variants && editingProduct.variants.length > 0));
    }
  }, [editingProduct, categories]);

  /* ---------- translations ---------- */
  const updateTranslation = (locale: string, field: 'name' | 'description', value: string) => {
    setForm((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [locale]: { ...prev.translations[locale], [field]: value },
      },
    }));
  };

  /* ---------- managed attribute pickers ---------- */
  const searchAttributes = useCallback(async (type: AttributeType, query: string) => {
    if (!tenant?.tenantId || !query.trim()) {
      setAttrResults((prev) => ({ ...prev, [type]: [] }));
      return;
    }
    setAttrLoading((prev) => ({ ...prev, [type]: true }));
    try {
      const results = await suggestAttributes(tenant.tenantId, type, query);
      setAttrResults((prev) => ({ ...prev, [type]: results }));
    } catch {
      setAttrResults((prev) => ({ ...prev, [type]: [] }));
    } finally {
      setAttrLoading((prev) => ({ ...prev, [type]: false }));
    }
  }, [tenant?.tenantId]);

  const addAttributeRef = (type: AttributeType, attr: ProductAttribute) => {
    setForm((prev) => {
      if (prev.attributeRefs.some((r) => r.attributeId === attr._id)) return prev;
      return { ...prev, attributeRefs: [...prev.attributeRefs, { type, attributeId: attr._id }] };
    });
    setAttrSearch((prev) => ({ ...prev, [type]: '' }));
    setAttrResults((prev) => ({ ...prev, [type]: [] }));
  };

  const removeAttributeRef = (type: AttributeType, attributeId: string) => {
    setForm((prev) => ({
      ...prev,
      attributeRefs: prev.attributeRefs.filter((r) => !(r.type === type && r.attributeId === attributeId)),
    }));
  };

  const createAndAddAttribute = async (type: AttributeType) => {
    const query = attrSearch[type]?.trim();
    if (!query || !token) return;
    try {
      const newAttr = await createAttribute({ type, name: query }, token);
      addAttributeRef(type, newAttr);
      showToast(`Created ${type}: ${query}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to create', 'error');
    }
  };

  /* ---------- tags ---------- */
  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((tg) => tg !== tag) }));
  };

  /* ---------- variants ---------- */
  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: Math.random().toString(36).substring(2, 11),
      name: '',
      sku: '',
      price: 0,
      compareAtPrice: 0,
      stock: 0,
      attributes: {},
    };
    setForm((prev) => ({ ...prev, variants: [...prev.variants, newVariant] }));
  };

  const updateVariant = (index: number, field: string, value: any) => {
    setForm((prev) => {
      const updated = [...prev.variants];
      (updated[index] as any)[field] = value;
      return { ...prev, variants: updated };
    });
  };

  const removeVariant = (index: number) => {
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }));
  };

  /* ---------- dynamic specifications ---------- */
  const addAttribute = () => {
    setForm((prev) => ({ ...prev, attributes: [...prev.attributes, { key: '', value: '' }] }));
  };

  const updateAttribute = (index: number, field: 'key' | 'value', value: string) => {
    setForm((prev) => {
      const updated = [...prev.attributes];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, attributes: updated };
    });
  };

  const removeAttribute = (index: number) => {
    setForm((prev) => ({ ...prev, attributes: prev.attributes.filter((_, i) => i !== index) }));
  };

  /* ---------- submit ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (!hasVariants && form.price <= 0) {
      showToast(t('errorPriceRequired'), 'error');
      return;
    }
    if (hasVariants && form.variants.length === 0) {
      showToast(t('errorVariantRequired'), 'error');
      return;
    }
    setLoading(true);

    const priceToSend = hasVariants
      ? Math.min(...form.variants.map(v => v.price || 0)) || 0
      : form.price;

    const payload = {
      ...form,
      attributes: form.attributes.filter((a) => a.key.trim() && a.value.trim()),
      attributeRefs: form.attributeRefs,
      translations: form.translations,
      categoryKey: form.categoryKey === '__none__' ? '' : form.categoryKey,
      category: form.categoryKey === '__none__' ? '' : form.category,
      price: priceToSend,
      branchId: selectedBranch?._id,
      productType: 'physical_product',
      status: form.status || 'published',
    };

    const url = editingProduct
      ? `${apiUrl}/api/saas/menu/${editingProduct._id}`
      : `${apiUrl}/api/saas/menu`;
    const method = editingProduct ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast(editingProduct ? t('savedSuccess') : t('createdSuccess'));
        router.push('/admin/ecommerce');
      } else {
        showToast(t('saveFailed'), 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(t('saveFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (url: string) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((img) => img !== url) }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== Sticky Header ===== */}
      <div className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/admin/ecommerce"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{tm('productsTab')}</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-lg font-semibold truncate">
              {editingProduct ? t('editTitle') : t('addTitle')}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/admin/ecommerce')}>
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              form="product-form"
              size="sm"
              disabled={loading}
              className="gap-1.5"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {t('save')}
            </Button>
          </div>
        </div>
      </div>

      {/* ===== Form ===== */}
      <form id="product-form" onSubmit={handleSubmit} className="flex-1">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ===================== LEFT COLUMN (2/3) ===================== */}
            <div className="lg:col-span-2 space-y-6">

              {/* ===== Name & Description ===== */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">{t('generalSection')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeLocales.length > 1 && (
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
                            <Label>{t('productName')} ({locale.toUpperCase()})</Label>
                            <Input
                              value={locale === defaultLocale ? form.name : (form.translations[locale]?.name || '')}
                              onChange={(e) => {
                                if (locale === defaultLocale) {
                                  setForm({ ...form, name: e.target.value });
                                } else {
                                  updateTranslation(locale, 'name', e.target.value);
                                }
                              }}
                              placeholder={locale === defaultLocale ? undefined : `Translation for ${locale.toUpperCase()}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('description')} ({locale.toUpperCase()})</Label>
                            <Textarea
                              rows={3}
                              value={locale === defaultLocale ? form.description : (form.translations[locale]?.description || '')}
                              onChange={(e) => {
                                if (locale === defaultLocale) {
                                  setForm({ ...form, description: e.target.value });
                                } else {
                                  updateTranslation(locale, 'description', e.target.value);
                                }
                              }}
                              placeholder={locale === defaultLocale ? undefined : `Translation for ${locale.toUpperCase()}`}
                            />
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  )}
                  {activeLocales.length <= 1 && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="name">{t('productName')}</Label>
                        <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">{t('description')}</Label>
                        <Textarea id="description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* ===== Pricing (simple product) ===== */}
              {!hasVariants && (
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">{t('pricingSection')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">{t('price')} *</Label>
                        <Input id="price" type="number" step="0.01" value={form.price || ''} onChange={(e) => setForm({ ...form, price: +e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="compareAtPrice">{t('compareAtPrice')}</Label>
                        <Input id="compareAtPrice" type="number" step="0.01" value={form.compareAtPrice || ''} onChange={(e) => setForm({ ...form, compareAtPrice: +e.target.value })} />
                        <p className="text-[11px] text-muted-foreground">{t('compareAtPriceHint')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ===== Variants toggle + management ===== */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{t('hasVariants')}</CardTitle>
                    <Switch checked={hasVariants} onCheckedChange={setHasVariants} />
                  </div>
                  <p className="text-xs text-muted-foreground">{t('hasVariantsHint')}</p>
                </CardHeader>
                {hasVariants && (
                  <CardContent className="space-y-4 border-t border-border pt-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-semibold text-muted-foreground">{t('variantsSection')}</h4>
                      <Button type="button" variant="outline" size="sm" onClick={addVariant}><Plus size={14} /> {t('addVariant')}</Button>
                    </div>
                    {form.variants.length === 0 && <p className="text-sm text-muted-foreground">{t('noVariants')}</p>}
                    {form.variants.map((variant, idx) => (
                      <div key={variant.id} className="border rounded-lg p-3 space-y-2 bg-muted/20">
                        <div className="flex justify-between">
                          <span className="text-xs font-semibold">#{idx + 1}</span>
                          <button type="button" onClick={() => removeVariant(idx)} className="text-muted-foreground hover:text-destructive"><X size={14} /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder={t('variantNamePlaceholder')} value={variant.name} onChange={(e) => updateVariant(idx, 'name', e.target.value)} />
                          <Input placeholder={t('variantSku')} value={variant.sku} onChange={(e) => updateVariant(idx, 'sku', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Input type="number" placeholder={t('variantPrice')} value={variant.price || ''} onChange={(e) => updateVariant(idx, 'price', +e.target.value)} />
                          <Input type="number" placeholder={t('variantCompareAt')} value={variant.compareAtPrice || ''} onChange={(e) => updateVariant(idx, 'compareAtPrice', +e.target.value)} />
                          <Input type="number" placeholder={t('variantStock')} value={variant.stock || ''} onChange={(e) => updateVariant(idx, 'stock', +e.target.value)} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>

              {/* ===== Media ===== */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">{t('mediaSection')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="image">{t('mainImage')}</Label>
                    <div className="flex gap-2">
                      <Input id="image" placeholder="https://..." value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="flex-1" />
                      <Button type="button" variant="outline" onClick={openMainWidget} disabled={!mainReady} className="gap-2 shrink-0">
                        <ImagePlus className="w-4 h-4" /> {t('upload')}
                      </Button>
                    </div>
                    {form.image && <Image src={form.image} alt="Preview" width={512} height={180} className="object-cover rounded-lg border max-h-48" />}
                  </div>
                  <div className="space-y-2">
                    <Label>{t('additionalImages')}</Label>
                    <div className="flex flex-wrap gap-2">
                      {form.images.map((url, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                          <Image src={url} fill alt="Additional image" className="object-cover" sizes="80px" />
                          <button type="button" onClick={() => removeImage(url)} className="absolute top-0 right-0 bg-black/60 text-white p-0.5 rounded-bl"><X size={12} /></button>
                        </div>
                      ))}
                      <button type="button" onClick={openExtraWidget} disabled={!extraReady} className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <ImagePlus size={20} />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ===== Specifications (dynamic key-value) ===== */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">{t('detailsSection')}</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addAttribute} className="gap-1.5">
                      <Plus size={14} /> {t('addAttribute')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {form.attributes.length === 0 && <p className="text-sm text-muted-foreground">{t('noAttributes')}</p>}
                  {form.attributes.map((attr, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={attr.key}
                        onChange={(e) => updateAttribute(idx, 'key', e.target.value)}
                        placeholder={t('attributeKeyPlaceholder')}
                        className="flex-1"
                      />
                      <Input
                        value={attr.value}
                        onChange={(e) => updateAttribute(idx, 'value', e.target.value)}
                        placeholder={t('attributeValuePlaceholder')}
                        className="flex-1"
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeAttribute(idx)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* ===== Tags ===== */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">{t('tagsSection')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder={t('addTagPlaceholder')} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} className="flex-1" />
                    <Button type="button" variant="outline" onClick={addTag}>{t('add')}</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-sm">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive"><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* ===== Inventory & Logistics ===== */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">{t('advancedSection')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku">{t('sku')}</Label>
                      <Input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. PROD-001" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">{t('stock')}</Label>
                      <Input id="stock" type="number" min="0" value={form.stock || ''} onChange={(e) => setForm({ ...form, stock: +e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('weight')}</Label>
                      <Input type="number" min="0" step="0.01" value={form.weight || ''} onChange={(e) => setForm({ ...form, weight: +e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('unit')}</Label>
                      <Select value={form.weightUnit} onValueChange={(val) => setForm({ ...form, weightUnit: val as 'g' | 'kg' | 'lb' })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="lb">lb</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('length')} × {t('width')} × {t('height')}</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input type="number" min="0" step="0.1" placeholder={t('length')} value={form.dimensions.length || ''} onChange={(e) => setForm({ ...form, dimensions: { ...form.dimensions, length: +e.target.value } })} />
                      <Input type="number" min="0" step="0.1" placeholder={t('width')} value={form.dimensions.width || ''} onChange={(e) => setForm({ ...form, dimensions: { ...form.dimensions, width: +e.target.value } })} />
                      <Input type="number" min="0" step="0.1" placeholder={t('height')} value={form.dimensions.height || ''} onChange={(e) => setForm({ ...form, dimensions: { ...form.dimensions, height: +e.target.value } })} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ===================== RIGHT COLUMN (1/3) ===================== */}
            <div className="space-y-6">

              {/* ===== Status & Category ===== */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">{t('generalSection')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('status')}</Label>
                    <Select value={form.status} onValueChange={(val) => setForm({ ...form, status: val })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published">{t('statusActive')}</SelectItem>
                        <SelectItem value="draft">{t('statusDraft')}</SelectItem>
                        <SelectItem value="hidden">Hidden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('category')}</Label>
                    <Select
                      value={form.categoryKey}
                      onValueChange={(val) => {
                        if (val === '__none__') {
                          setForm({ ...form, categoryKey: val, category: '' });
                        } else {
                          const selectedCat = categories.find((c: any) => c.key === val);
                          setForm({ ...form, categoryKey: val, category: selectedCat?.name || val });
                        }
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder={t('selectCategory')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">{t('noCategory')}</SelectItem>
                        {categories.map((c: any) => (
                          <SelectItem key={c.key} value={c.key}>
                            {c.parentCategoryKey ? '  └ ' : ''}{c.icon} {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-1">
                    <Switch
                      id="isFeatured"
                      checked={form.isFeatured}
                      onCheckedChange={(checked) => setForm({ ...form, isFeatured: checked })}
                    />
                    <Label htmlFor="isFeatured" className="text-sm">{t('featured')}</Label>
                  </div>
                </CardContent>
              </Card>

              {/* ===== Managed Attributes ===== */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Attributes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {([['author', 'Authors'], ['publisher', 'Publishers'], ['genre', 'Genres'], ['language', 'Languages'], ['series', 'Series']] as [AttributeType, string][]).map(([type, label]) => {
                    const selected = form.attributeRefs.filter((r) => r.type === type);
                    const results = attrResults[type] || [];
                    const loading = attrLoading[type] || false;
                    return (
                      <div key={type} className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
                        {selected.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {selected.map((ref) => (
                              <span key={ref.attributeId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-xs">
                                {ref.attributeId.slice(0, 8)}...
                                <button type="button" onClick={() => removeAttributeRef(type, ref.attributeId)} className="hover:text-destructive"><X size={10} /></button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="relative">
                          <Input
                            value={attrSearch[type] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAttrSearch((prev) => ({ ...prev, [type]: val }));
                              if (val.trim().length >= 1) searchAttributes(type, val);
                              else setAttrResults((prev) => ({ ...prev, [type]: [] }));
                            }}
                            placeholder={`Search ${label.toLowerCase()}...`}
                            className="pr-8 text-sm"
                          />
                          {loading && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                        </div>
                        {results.length > 0 && (
                          <div className="border rounded-lg bg-background max-h-36 overflow-y-auto">
                            {results.map((attr) => (
                              <button
                                key={attr._id}
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center justify-between"
                                onClick={() => addAttributeRef(type, attr)}
                              >
                                <span>{attr.name}</span>
                                <span className="text-xs text-muted-foreground">{attr.productCount || 0}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        {attrSearch[type]?.trim() && results.length === 0 && !loading && (
                          <button
                            type="button"
                            onClick={() => createAndAddAttribute(type)}
                            className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-muted/50 border border-dashed rounded-lg"
                          >
                            <Plus size={12} className="inline mr-1" /> Create "{attrSearch[type]}" as {type}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>

      {/* ===== Sticky Footer (mobile) ===== */}
      <div className="sticky bottom-0 z-30 bg-background border-t border-border lg:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" size="sm" onClick={() => router.push('/admin/ecommerce')}>
            {t('cancel')}
          </Button>
          <Button type="submit" form="product-form" size="sm" disabled={loading} className="gap-1.5">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
