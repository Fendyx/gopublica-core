'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useTenant } from '@/entities/tenant/TenantContext';
import MenuItemCard from '@/entities/menu-item/MenuItemCard';
import type { MenuItem } from '@/entities/menu-item/types';
import { useTranslations } from 'next-intl';
import { useBranchSettings } from '@/entities/branch/useBranchSettings';
import { useBranch } from '@/entities/branch/BranchContext';

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

  if (loading || settingsLoading) return <div className="text-center py-10 text-text-secondary">{t('loading')}</div>;
  if (!tenantId) return <div className="text-center py-10">Ошибка: не определён клиент</div>;
  if (!selectedBranch) return <div className="text-center py-10">Выберите филиал в переключателе справа вверху</div>;

  const inputBaseClass = "w-full border border-border bg-surface-page text-text-primary p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-tertiary";

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-4 text-sm text-gray-500">
        Меню для филиала: <strong>{selectedBranch.name}</strong> {selectedBranch.city && `(${selectedBranch.city})`}
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <h2 className="text-2xl font-heading font-semibold text-text-primary">
          {t('title', { clientName: tenant?.clientName ?? '' })}
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium transition-opacity hover:opacity-90 shadow-sm active:scale-95"
        >
          {showForm ? t('close') : t('addDish')}
        </button>
      </div>

      {/* Форма */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-surface-card p-6 sm:p-8 rounded-2xl shadow-card mb-10 border border-border animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-6">
            
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('name')}</label>
              <input
                type="text"
                placeholder={t('name')}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputBaseClass}
                required
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('category')}</label>
              <select
                value={useCustomCategory ? '__custom__' : selectedCategory}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '__custom__') {
                    setUseCustomCategory(true)
                    setSelectedCategory('')
                  } else {
                    updateCategoryFields(val, false)
                  }
                }}
                className={`${inputBaseClass} appearance-none cursor-pointer`}
                required
              >
                <option value="">{t('selectCategory')}</option>
                {categories.map(c => (
                  <option key={c.key} value={c.key}>{getCategoryDisplayName(c)}</option>
                ))}
                <option value="__custom__">{t('customCategory')}</option>
              </select>
            </div>

            {useCustomCategory && (
              <div className="sm:col-span-2 bg-surface-page border border-border rounded-xl p-5 space-y-5">
                <div className="relative">
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('categoryName')}</label>
                  <input
                    type="text"
                    value={customCategoryName}
                    onChange={(e) => {
                      const name = e.target.value
                      setCustomCategoryName(name)
                      setForm(prev => ({
                        ...prev,
                        category: name,
                        categoryKey: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                      }))
                      searchCategories(name)
                    }}
                    onFocus={() => categorySuggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className={`${inputBaseClass} bg-surface-card`}
                    required
                  />
                  
                  {showSuggestions && (
                    <ul className="absolute z-20 w-full bg-surface-card border border-border rounded-xl shadow-dropdown mt-1 max-h-48 overflow-y-auto overflow-hidden">
                      {categorySuggestions.map(cat => (
                        <li
                          key={cat.key}
                          onMouseDown={() => {
                            setCustomCategoryName(getCategoryDisplayName(cat))
                            setCustomCategoryTranslations(cat.translations || {})
                            setForm(prev => ({
                              ...prev,
                              category: cat.name || cat.key,
                              categoryKey: cat.key,
                            }))
                            setShowSuggestions(false)
                          }}
                          className="px-4 py-3 text-sm hover:bg-surface-hover cursor-pointer border-b border-border-light last:border-0 transition-colors"
                        >
                          <div className="font-medium text-text-primary">{getCategoryDisplayName(cat)}</div>
                          {cat.translations && (
                            <div className="text-xs text-text-tertiary mt-1">
                              {Object.entries(cat.translations).map(([lang, val]) => `${lang}: ${val}`).join(', ')}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden">
                    <svg className="w-4 h-4 text-text-tertiary transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {t('categoryTranslations')}
                  </summary>
                  <div className="grid sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border-light">
                    {availableLangs.map(lang => (
                      <div key={lang}>
                        <p className="text-xs font-semibold text-text-tertiary mb-1.5 uppercase tracking-wider">{lang}</p>
                        <input
                          type="text"
                          placeholder={t('translations.name')}
                          value={customCategoryTranslations[lang] || ''}
                          onChange={(e) => setCustomCategoryTranslations(prev => ({
                            ...prev,
                            [lang]: e.target.value
                          }))}
                          className={`${inputBaseClass} p-2.5 text-sm bg-surface-card`}
                        />
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('description')}</label>
              <textarea
                placeholder={t('description')}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={inputBaseClass}
                rows={3}
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('price')}</label>
              <input
                type="number"
                placeholder={t('price')}
                value={form.price || ''}
                onChange={(e) => setForm({ ...form, price: +e.target.value })}
                className={inputBaseClass}
                required
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('imageUrl')}</label>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  placeholder="https://..."
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className={inputBaseClass}
                />
                <button
                  type="button"
                  onClick={openCloudinaryWidget}
                  className="px-5 py-3 rounded-xl bg-surface-inverse text-text-inverse hover:opacity-90 text-sm font-medium transition-opacity shadow-sm whitespace-nowrap shrink-0"
                >
                  {t('upload')}
                </button>
              </div>
            </div>

            {form.image && (
              <div className="sm:col-span-2">
                <p className="block text-sm font-medium text-text-secondary mb-2">{t('preview')}</p>
                <img 
                  src={form.image} 
                  alt={t('preview')} 
                  className="h-40 w-40 object-cover rounded-xl border border-border shadow-sm" 
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <details className="group border border-border rounded-xl bg-surface-page overflow-hidden">
                <summary className="cursor-pointer p-4 text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors flex justify-between items-center list-none [&::-webkit-details-marker]:hidden border-b border-transparent group-open:border-border">
                  {t('dishTranslations')}
                  <svg className="w-5 h-5 text-text-tertiary transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="p-4 sm:p-6 grid sm:grid-cols-3 gap-5 bg-surface-card/50">
                  {availableLangs.map(lang => (
                    <div key={lang} className="bg-surface-page p-4 rounded-xl border border-border-light shadow-sm">
                      <p className="text-xs font-semibold text-text-tertiary mb-3 uppercase tracking-wider">{lang}</p>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder={t('translations.name')}
                          value={translations[lang]?.name || ''}
                          onChange={(e) => setTranslations(prev => ({
                            ...prev,
                            [lang]: { ...prev[lang], name: e.target.value }
                          }))}
                          className={`${inputBaseClass} p-2.5 text-sm`}
                        />
                        <textarea
                          placeholder={t('translations.description')}
                          value={translations[lang]?.description || ''}
                          onChange={(e) => setTranslations(prev => ({
                            ...prev,
                            [lang]: { ...prev[lang], description: e.target.value }
                          }))}
                          className={`${inputBaseClass} p-2.5 text-sm`}
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border">
            {editingId && (
              <button 
                type="button" 
                onClick={resetForm} 
                className="px-5 py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover font-medium transition-colors"
              >
                {t('cancel')}
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-primary text-white font-medium shadow-sm transition-opacity hover:opacity-90 active:scale-95"
            >
              {editingId ? t('save') : t('add')}
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="text-center py-16 px-4 bg-surface-card rounded-2xl border border-dashed border-border">
          <p className="text-text-secondary">{t('empty')}</p>
        </div>
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