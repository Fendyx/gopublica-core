'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useTenant } from '@/entities/tenant/TenantContext';
import MenuItemCard from '@/entities/menu-item/MenuItemCard';
import type { MenuItem } from '@/entities/menu-item/types';
import { useTranslations } from 'next-intl';
import { useBranchSettings } from '@/entities/branch/useBranchSettings';
import { useBranch } from '@/entities/branch/BranchContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  X,
  Upload,
  Save,
  Trash2,
  Edit,
  MapPin,
  UtensilsCrossed,
  ChevronDown,
  ImagePlus,
  Languages,
} from 'lucide-react';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'твой-cloud-name';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'menu_photos';

interface CategoryOption {
  _id?: string;
  key: string;
  name?: string;
  translations: Record<string, string>;
}

export default function MenuManager({ token }: { token: string }) {
  const t = useTranslations('admin.menuManager');
  const tenant = useTenant();
  const { selectedBranch } = useBranch();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    categoryKey: '',
    image: '',
  });
  const [translations, setTranslations] = useState<Record<string, { name?: string; description?: string }>>({});
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customCategoryTranslations, setCustomCategoryTranslations] = useState<Record<string, string>>({});
  const [categorySuggestions, setCategorySuggestions] = useState<CategoryOption[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const cloudinaryWidgetRef = useRef<any>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const { primaryLanguage, primaryCurrency, loading: settingsLoading } = useBranchSettings();
  const SUPPORTED_LANGUAGES = ['pl', 'en', 'de', 'ru', 'es', 'ua'];
  const availableLangs = useMemo(() => SUPPORTED_LANGUAGES.filter(lang => lang !== primaryLanguage), [primaryLanguage]);

  const tenantId = tenant?.tenantId;

  const fetchItems = async () => {
    if (!tenantId) return;
    try {
      let url = `${apiUrl}/api/saas/menu?tenantId=${tenantId}`;
      if (selectedBranch) url += `&branchId=${selectedBranch._id}`;
      const res = await fetch(url);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!token || !tenantId) return;
    try {
      let url = `${apiUrl}/api/saas/categories`;
      if (selectedBranch) url += `?branchId=${selectedBranch._id}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) fetchCategories();
  }, [token, selectedBranch, tenantId]);

  useEffect(() => {
    fetchItems();
  }, [selectedBranch, tenantId]);

  // Cloudinary widget
  useEffect(() => {
    if (document.getElementById('cloudinary-widget-script')) {
      if ((window as any).cloudinary && !cloudinaryWidgetRef.current) initWidget();
      return;
    }
    const script = document.createElement('script');
    script.id = 'cloudinary-widget-script';
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
    script.async = true;
    script.onload = () => initWidget();
    document.body.appendChild(script);
  }, []);

  const initWidget = () => {
    if (!(window as any).cloudinary) return;
    cloudinaryWidgetRef.current = (window as any).cloudinary.createUploadWidget(
      {
        cloudName: CLOUD_NAME,
        uploadPreset: UPLOAD_PRESET,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        maxFileSize: 5000000,
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        language: 'ru',
      },
      (error: any, result: any) => {
        if (!error && result && result.event === 'success') {
          setForm((prev) => ({ ...prev, image: result.info.secure_url }));
        }
      }
    );
    setWidgetReady(true);
  };

  const openCloudinaryWidget = () => {
    if (cloudinaryWidgetRef.current && widgetReady) cloudinaryWidgetRef.current.open();
    else alert(t('uploaderNotReady'));
  };

  const resetForm = () => {
    setForm({ name: '', description: '', price: 0, category: '', categoryKey: '', image: '' });
    setTranslations({});
    setSelectedCategory('');
    setUseCustomCategory(false);
    setCustomCategoryName('');
    setCustomCategoryTranslations({});
    setCategorySuggestions([]);
    setShowSuggestions(false);
    setEditingId(null);
    setShowForm(false);
  };

  const updateCategoryFields = (key: string, isCustom: boolean, customName?: string) => {
    if (isCustom) {
      setUseCustomCategory(true);
      setSelectedCategory('');
      setForm(prev => ({
        ...prev,
        category: customName || '',
        categoryKey: customName?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '',
      }));
    } else {
      setUseCustomCategory(false);
      setSelectedCategory(key);
      setCustomCategoryName('');
      setForm(prev => ({ ...prev, category: key, categoryKey: key }));
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingId(item._id || null);
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category || '',
      categoryKey: item.categoryKey || '',
      image: item.image || '',
    });
    setTranslations(item.translations || {});
    const foundCat = categories.find(c => c.key === item.categoryKey);
    if (foundCat) updateCategoryFields(foundCat.key, false);
    else if (item.categoryKey) {
      setUseCustomCategory(true);
      setCustomCategoryName(item.category || '');
      setCustomCategoryTranslations(item.translations?.category as any || {});
      setSelectedCategory('');
    } else {
      const catByCategory = categories.find(c => c.key === item.category);
      if (catByCategory) updateCategoryFields(catByCategory.key, false);
      else updateCategoryFields('', false);
    }
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await fetch(`${apiUrl}/api/saas/menu/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const getCategoryDisplayName = (cat: CategoryOption) => cat.translations?.[primaryLanguage] || cat.name || cat.key;

  const searchCategories = async (query: string) => {
    if (query.length < 2) {
      setCategorySuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      let url = `${apiUrl}/api/saas/categories/suggest?q=${encodeURIComponent(query)}`;
      if (selectedBranch) url += `&branchId=${selectedBranch._id}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCategorySuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalCategory = form.category;
    let finalCategoryKey = form.categoryKey;

    if (useCustomCategory) {
      const categoryKey = customCategoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      try {
        await fetch(`${apiUrl}/api/saas/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            key: categoryKey,
            name: customCategoryName,
            translations: customCategoryTranslations,
            branchId: selectedBranch?._id,
          }),
        });
      } catch (err) {
        console.error(t('errorSaveCategory'), err);
      }
      finalCategory = customCategoryName;
      finalCategoryKey = categoryKey;
    }

    const url = editingId ? `${apiUrl}/api/saas/menu/${editingId}` : `${apiUrl}/api/saas/menu`;
    const method = editingId ? 'PUT' : 'POST';
    const payload = {
      ...form,
      category: finalCategory,
      categoryKey: finalCategoryKey,
      translations,
      branchId: selectedBranch?._id,
    };

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
        await fetchItems();
        resetForm();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || settingsLoading) return <div className="text-center py-10 text-muted-foreground">{t('loading')}</div>;
  if (!tenantId) return <div className="text-center py-10">Ошибка: не определён клиент</div>;
  if (!selectedBranch) return <div className="text-center py-10">Выберите филиал в переключателе справа вверху</div>;

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="w-4 h-4" />
        Меню для филиала: <strong>{selectedBranch.name}</strong> {selectedBranch.city && `(${selectedBranch.city})`}
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-primary" />
          {t('title', { clientName: tenant?.clientName ?? '' })}
        </h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? 'secondary' : 'default'}
          className="gap-2"
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              {t('close')}
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              {t('addDish')}
            </>
          )}
        </Button>
      </div>

      {/* Форма */}
      {showForm && (
        <Card className="animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSave}>
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                {/* Название */}
                <div className="space-y-2">
                  <Label htmlFor="name">{t('name')}</Label>
                  <Input
                    id="name"
                    placeholder={t('name')}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                {/* Категория */}
                <div className="space-y-2">
                  <Label htmlFor="category">{t('category')}</Label>
                  <Select
                    value={useCustomCategory ? '__custom__' : selectedCategory}
                    onValueChange={(val) => {
                      if (val === '__custom__') {
                        setUseCustomCategory(true);
                        setSelectedCategory('');
                      } else {
                        updateCategoryFields(val, false);
                      }
                    }}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder={t('selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.key} value={c.key}>
                          {getCategoryDisplayName(c)}
                        </SelectItem>
                      ))}
                      <Separator className="my-1" />
                      <SelectItem value="__custom__">{t('customCategory')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Кастомная категория */}
                {useCustomCategory && (
                  <div className="sm:col-span-2 bg-muted/30 rounded-xl p-5 space-y-4 border">
                    <div className="space-y-2 relative">
                      <Label htmlFor="customCategory">{t('categoryName')}</Label>
                      <Input
                        id="customCategory"
                        value={customCategoryName}
                        onChange={(e) => {
                          const name = e.target.value;
                          setCustomCategoryName(name);
                          setForm(prev => ({
                            ...prev,
                            category: name,
                            categoryKey: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                          }));
                          searchCategories(name);
                        }}
                        onFocus={() => categorySuggestions.length > 0 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        required
                      />
                      {showSuggestions && (
                        <ul className="absolute z-20 w-full bg-card border border-border rounded-xl shadow-dropdown mt-1 max-h-48 overflow-y-auto overflow-hidden">
                          {categorySuggestions.map(cat => (
                            <li
                              key={cat.key}
                              onMouseDown={() => {
                                setCustomCategoryName(getCategoryDisplayName(cat));
                                setCustomCategoryTranslations(cat.translations || {});
                                setForm(prev => ({
                                  ...prev,
                                  category: cat.name || cat.key,
                                  categoryKey: cat.key,
                                }));
                                setShowSuggestions(false);
                              }}
                              className="px-4 py-3 text-sm hover:bg-accent cursor-pointer border-b border-border/50 last:border-0 transition-colors"
                            >
                              <div className="font-medium">{getCategoryDisplayName(cat)}</div>
                              {cat.translations && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {Object.entries(cat.translations).map(([lang, val]) => `${lang}: ${val}`).join(', ')}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <Accordion type="single" collapsible>
                      <AccordionItem value="translations" className="border rounded-lg px-3">
                        <AccordionTrigger className="text-sm font-medium hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Languages className="w-4 h-4 text-muted-foreground" />
                            {t('categoryTranslations')}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-3">
                          <div className="grid sm:grid-cols-3 gap-3">
                            {availableLangs.map(lang => (
                              <div key={lang} className="space-y-1.5">
                                <Label className="text-xs uppercase text-muted-foreground">{lang}</Label>
                                <Input
                                  placeholder={t('translations.name')}
                                  value={customCategoryTranslations[lang] || ''}
                                  onChange={(e) => setCustomCategoryTranslations(prev => ({
                                    ...prev,
                                    [lang]: e.target.value,
                                  }))}
                                />
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}

                {/* Описание */}
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="description">{t('description')}</Label>
                  <Textarea
                    id="description"
                    placeholder={t('description')}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Цена */}
                <div className="space-y-2">
                  <Label htmlFor="price">{t('price')}</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder={t('price')}
                    value={form.price || ''}
                    onChange={(e) => setForm({ ...form, price: +e.target.value })}
                    required
                  />
                </div>

                {/* Изображение */}
                <div className="space-y-2">
                  <Label htmlFor="image">{t('imageUrl')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="image"
                      placeholder="https://..."
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                    />
                    <Button type="button" variant="outline" onClick={openCloudinaryWidget} className="gap-2 shrink-0">
                      <ImagePlus className="w-4 h-4" />
                      {t('upload')}
                    </Button>
                  </div>
                </div>

                {form.image && (
                  <div className="sm:col-span-2 space-y-2">
                    <Label>{t('preview')}</Label>
                    <img
                      src={form.image}
                      alt={t('preview')}
                      className="h-40 w-40 object-cover rounded-lg border shadow-sm"
                    />
                  </div>
                )}

                {/* Переводы блюда */}
                <div className="sm:col-span-2">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="dish-translations" className="border rounded-lg px-3">
                      <AccordionTrigger className="text-sm font-medium hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Languages className="w-4 h-4 text-muted-foreground" />
                          {t('dishTranslations')}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-3">
                        <div className="grid sm:grid-cols-3 gap-4">
                          {availableLangs.map(lang => (
                            <div key={lang} className="bg-muted/20 p-3 rounded-lg space-y-2">
                              <Label className="text-xs uppercase text-muted-foreground">{lang}</Label>
                              <Input
                                placeholder={t('translations.name')}
                                value={translations[lang]?.name || ''}
                                onChange={(e) => setTranslations(prev => ({
                                  ...prev,
                                  [lang]: { ...prev[lang], name: e.target.value },
                                }))}
                              />
                              <Textarea
                                placeholder={t('translations.description')}
                                value={translations[lang]?.description || ''}
                                onChange={(e) => setTranslations(prev => ({
                                  ...prev,
                                  [lang]: { ...prev[lang], description: e.target.value },
                                }))}
                                rows={2}
                              />
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-3">
                {editingId && (
                  <Button type="button" variant="ghost" onClick={resetForm}>
                    {t('cancel')}
                  </Button>
                )}
                <Button type="submit" className="gap-2">
                  <Save className="w-4 h-4" />
                  {editingId ? t('save') : t('add')}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      )}

      {items.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <UtensilsCrossed className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-muted-foreground">{t('empty')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <MenuItemCard
              key={item._id}
              item={item}
              mode="admin"
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}