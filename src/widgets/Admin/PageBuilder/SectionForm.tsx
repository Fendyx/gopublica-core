'use client';
import { useState, useEffect } from 'react';
import { BranchSection, SectionType, ArticleGridSettings, HeroSettings, HeroMediaType, HeroLayout, CarouselMode, HeroCta, CtaTargetMode } from '@/entities/branch-section/types';
import { useCloudinaryUpload } from '@/shared/lib/useCloudinaryUpload';
import { saveBranchSectionItem, deleteBranchSectionItem } from '@/entities/branch-section/api';
import { fetchArticles } from '@/entities/article/api';
import type { Article } from '@/entities/article/types';
import { useTenant } from '@/entities/tenant/TenantContext';
import { useBranch } from '@/entities/branch/BranchContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SectionItemList from './SectionItemList';
import CarouselEntitySelector from './CarouselEntitySelector';

interface SectionFormProps {
  initialData?: BranchSection;
  defaultType?: SectionType;
  onSave: (data: Partial<BranchSection>) => Promise<void>;
  onCancel: () => void;
  /** Список всех секций на странице для выпадающего списка CTA */
  sections?: BranchSection[];
}

/**
 * Компонент управления CTA-ссылкой с двумя режимами:
 * - 'section': выбор существующей секции из выпадающего списка
 * - 'custom': ручной ввод произвольного URL
 */
function CtaLinkManager({
  label,
  cta,
  sections,
  onChange,
}: {
  label: string;
  cta?: HeroCta;
  sections: BranchSection[];
  onChange: (cta: HeroCta) => void;
}) {
  const targetMode: CtaTargetMode = cta?.targetMode || 'section';
  const selectedSectionId = cta?.targetSectionId || '';
  const customUrl = cta?.customUrl || '';

  // Доступные секции (исключаем текущую Hero-секцию, чтобы не скроллить на нее саму)
  const availableSections = sections.filter((s) => s.type !== 'hero' && s.type !== 'hero_video');

  return (
    <div className="space-y-3">
      <Label>{label} Target</Label>

      {/* Переключатель режима */}
      <Select
        value={targetMode}
        onValueChange={(val) => onChange({ ...cta, targetMode: val as CtaTargetMode })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select target mode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="section">Section on page</SelectItem>
          <SelectItem value="custom">Custom URL</SelectItem>
        </SelectContent>
      </Select>

      {/* Режим: выбор секции */}
      {targetMode === 'section' && (
        <Select
          value={selectedSectionId}
          onValueChange={(val) => onChange({ ...cta, targetMode: 'section', targetSectionId: val })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a section to scroll to" />
          </SelectTrigger>
          <SelectContent>
            {availableSections.length === 0 ? (
              <SelectItem value="" disabled>
                No sections available
              </SelectItem>
            ) : (
              availableSections.map((s) => (
                <SelectItem key={s._id} value={s._id}>
                  {s.type} — {s.translations?.pl?.title || s.translations?.en?.title || s._id}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}

      {/* Режим: произвольный URL */}
      {targetMode === 'custom' && (
        <Input
          placeholder="Enter URL (e.g. /contacts, https://google.com, #anchor)"
          value={customUrl}
          onChange={(e) => onChange({ ...cta, targetMode: 'custom', customUrl: e.target.value })}
        />
      )}
    </div>
  );
}

export default function SectionForm({ initialData, defaultType, onSave, onCancel, sections }: SectionFormProps) {
  const type = initialData?.type || defaultType;
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [settings, setSettings] = useState<any>(initialData?.settings ?? {});
  const [translations, setTranslations] = useState<any>(
    initialData?.translations ?? { pl: {}, en: {}, de: {} }
  );

  // Ensure hero sections have default mediaType and layout on initial load
  useEffect(() => {
    if (type === 'hero' && !settings.mediaType) {
      setSettings((prev: any) => ({
        ...prev,
        mediaType: 'video',
        layout: prev.layout || 'fullscreen',
      }));
    }
  }, [type, settings.mediaType]);
  const handleCloudinarySuccess = (url: string, resourceType?: string) => {
    setSettings((prev: any) => {
      const currentMediaType = prev.mediaType || 'video';
      if (currentMediaType === 'video') {
        return { ...prev, videoUrl: url };
      } else if (currentMediaType === 'image') {
        return { ...prev, imageUrl: url };
      } else if (currentMediaType === 'slider') {
        const currentSlides = prev.slides || [];
        return { ...prev, slides: [...currentSlides, { imageUrl: url }] };
      }
      return prev;
    });
  };

  const { openWidget } = useCloudinaryUpload({
    onSuccess: handleCloudinarySuccess,
  });

  const handleSave = () => {
    const finalSettings = { ...settings };
    if (type === 'menu_categories' && typeof finalSettings.items === 'string') {
      finalSettings.items = finalSettings.items.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    onSave({ _id: initialData?._id, settings: finalSettings, translations, isActive, type });
  };

  const renderSettings = () => {
    switch (type) {
      case 'hero':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Media Type</Label>
              <Select
                value={settings.mediaType || 'video'}
                onValueChange={(val) =>
                  setSettings({ ...settings, mediaType: val as HeroMediaType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select media type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="slider">Slider</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Layout</Label>
              <Select
                value={settings.layout || 'fullscreen'}
                onValueChange={(val) =>
                  setSettings({ ...settings, layout: val as HeroLayout })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fullscreen">Fullscreen</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.mediaType === 'video' && (
              <div>
                <Label>Video URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={settings.videoUrl || ''}
                    onChange={(e) => setSettings({ ...settings, videoUrl: e.target.value })}
                  />
                  <Button type="button" onClick={() => openWidget()}>
                    Upload
                  </Button>
                </div>
              </div>
            )}

            {settings.mediaType === 'image' && (
              <div>
                <Label>Image URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={settings.imageUrl || ''}
                    onChange={(e) => setSettings({ ...settings, imageUrl: e.target.value })}
                  />
                  <Button type="button" onClick={() => openWidget()}>
                    Upload
                  </Button>
                </div>
              </div>
            )}

            {settings.mediaType === 'slider' && (
              <div className="space-y-2">
                <Label>Slides</Label>
                {(settings.slides || []).map((slide: { imageUrl: string }, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={slide.imageUrl || ''}
                      onChange={(e) => {
                        const newSlides = [...(settings.slides || [])];
                        newSlides[idx] = { imageUrl: e.target.value };
                        setSettings({ ...settings, slides: newSlides });
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        const newSlides = [...(settings.slides || [])];
                        newSlides.splice(idx, 1);
                        setSettings({ ...settings, slides: newSlides });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newSlides = [...(settings.slides || []), { imageUrl: '' }];
                    setSettings({ ...settings, slides: newSlides });
                  }}
                >
                  Add Slide
                </Button>
              </div>
            )}

            <div>
              <Label>Primary CTA Label</Label>
              <Input
                value={settings.primaryCta?.label || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    primaryCta: { ...settings.primaryCta, label: e.target.value },
                  })
                }
              />
            </div>
            <CtaLinkManager
              label="Primary"
              cta={settings.primaryCta}
              sections={sections || []}
              onChange={(cta) => setSettings({ ...settings, primaryCta: cta })}
            />
            <div>
              <Label>Secondary CTA Label</Label>
              <Input
                value={settings.secondaryCta?.label || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    secondaryCta: { ...settings.secondaryCta, label: e.target.value },
                  })
                }
              />
            </div>
            <CtaLinkManager
              label="Secondary"
              cta={settings.secondaryCta}
              sections={sections || []}
              onChange={(cta) => setSettings({ ...settings, secondaryCta: cta })}
            />
          </div>
        );
      case 'map':
        return (
          <div className="space-y-4">
            <div>
              <Label>Address</Label>
              <Input
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitude</Label>
                <Input
                  type="number"
                  value={settings.latitude || ''}
                  onChange={(e) => setSettings({ ...settings, latitude: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input
                  type="number"
                  value={settings.longitude || ''}
                  onChange={(e) => setSettings({ ...settings, longitude: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>
        );
      case 'menu_categories':
        return (
          <div className="space-y-4">
            <div>
              <Label>Items (comma-separated keys)</Label>
              <Input
                value={typeof settings.items === 'string' ? settings.items : settings.items?.join(', ') || ''}
                onChange={(e) => setSettings({ ...settings, items: e.target.value })}
              />
            </div>
            <div>
              <Label>Display Type</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={settings.displayType || 'categories'}
                onChange={(e) => setSettings({ ...settings, displayType: e.target.value })}
              >
                <option value="categories">Categories</option>
                <option value="products">Products</option>
              </select>
            </div>
          </div>
        );
      case 'entity_carousel':
      case 'feature_carousel': {
        const carouselMode: CarouselMode = settings.mode || 'manual';
        const selectionMode = settings.selectionMode || 'items';
        const tenant = useTenant();
        const branch = useBranch();

        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Display Mode</Label>
              <Select
                value={carouselMode}
                onValueChange={(val) => {
                  const newMode = val as CarouselMode;
                  // Clean up state to prevent data leaking between modes
                  setSettings((prev: any) => {
                    const cleaned: any = { ...prev, mode: newMode };
                    if (newMode === 'manual') {
                      delete cleaned.selectedProductIds;
                      delete cleaned.selectedMenuItemIds;
                      delete cleaned.selectedCategoryKeys;
                    } else if (newMode === 'ecommerce') {
                      delete cleaned.selectedMenuItemIds;
                    } else if (newMode === 'menu') {
                      delete cleaned.selectedProductIds;
                    }
                    return cleaned;
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select display mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual (Custom Cards)</SelectItem>
                  <SelectItem value="ecommerce">E-commerce Products</SelectItem>
                  <SelectItem value="menu">Menu Items</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {carouselMode === 'manual' && (
              <>
                {!initialData?._id ? (
                  <div className="p-4 bg-amber-50 text-amber-600 rounded-md">
                    Please save this section first before adding items to it.
                  </div>
                ) : (
                  <SectionItemList
                    sectionId={initialData._id}
                    initialItems={initialData.items || []}
                    onSaveItem={async (item) => {
                      await saveBranchSectionItem(initialData._id, item);
                    }}
                    onDeleteItem={async (itemId) => {
                      await deleteBranchSectionItem(initialData._id, itemId);
                    }}
                  />
                )}
              </>
            )}

            {(carouselMode === 'ecommerce' || carouselMode === 'menu') && (
              <CarouselEntitySelector
                mode={carouselMode}
                selectionMode={selectionMode}
                selectedIds={
                  carouselMode === 'ecommerce'
                    ? settings.selectedProductIds || []
                    : settings.selectedMenuItemIds || []
                }
                selectedCategoryKeys={settings.selectedCategoryKeys || []}
                onChange={(ids) => {
                  if (carouselMode === 'ecommerce') {
                    setSettings({ ...settings, selectedProductIds: ids });
                  } else {
                    setSettings({ ...settings, selectedMenuItemIds: ids });
                  }
                }}
                onChangeCategories={(keys) => {
                  setSettings({ ...settings, selectedCategoryKeys: keys });
                }}
                onSelectionModeChange={(newSelectionMode) => {
                  // Clean up: clear item IDs when switching to categories, and vice versa
                  setSettings((prev: any) => {
                    const cleaned: any = { ...prev, selectionMode: newSelectionMode };
                    if (newSelectionMode === 'categories') {
                      delete cleaned.selectedProductIds;
                      delete cleaned.selectedMenuItemIds;
                    } else {
                      delete cleaned.selectedCategoryKeys;
                    }
                    return cleaned;
                  });
                }}
                showViewAll={settings.showViewAll || false}
                onViewAllChange={(show) => {
                  setSettings({ ...settings, showViewAll: show });
                }}
                viewAllLabel={settings.viewAllLabel}
                onViewAllLabelChange={(label) => {
                  setSettings({ ...settings, viewAllLabel: label });
                }}
                tenantId={tenant?.tenantId || ''}
                branchId={branch?.selectedBranch?._id}
              />
            )}
          </div>
        );
      }
      case 'article_grid':
        return (
          <ArticleGridSettingsForm
            settings={settings as ArticleGridSettings}
            onChange={setSettings}
          />
        );
      case 'booking': {
        const sideContentType = settings.sideContentType || 'none';
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Side Content Type</Label>
              <Select
                value={sideContentType}
                onValueChange={(val) =>
                  setSettings({
                    ...settings,
                    sideContentType: val as 'none' | 'map' | 'text',
                    // Clear stale fields when switching away from a mode
                    ...(val === 'map' ? {} : { customText: undefined }),
                    ...(val === 'text' ? {} : { address: undefined }),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select side content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (single column)</SelectItem>
                  <SelectItem value="map">Google Map</SelectItem>
                  <SelectItem value="text">Custom Text</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {sideContentType === 'map' && (
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  placeholder="e.g. 123 Main St, Warsaw, Poland"
                  value={settings.address || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, address: e.target.value })
                  }
                />
              </div>
            )}

            {sideContentType === 'text' && (
              <div className="space-y-2">
                <Label>Custom Text</Label>
                <Textarea
                  placeholder="Enter custom text to display on the right side..."
                  value={settings.customText || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, customText: e.target.value })
                  }
                  rows={6}
                />
              </div>
            )}
          </div>
        );
      }
      default:
        return <p className="text-sm text-gray-500">Additional items/settings are managed elsewhere.</p>;
    }
  };

  return (
    <div className="p-6 bg-card text-card-foreground rounded-xl border border-border shadow-sm space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Edit Section: {type}</h2>
        <div className="flex items-center gap-2">
          <Label htmlFor="active-toggle">Active</Label>
          <Switch id="active-toggle" checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Settings</h3>
        {renderSettings()}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Translations</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {['pl', 'en', 'de'].map((locale) => (
            <div key={locale} className="space-y-3 bg-muted p-4 rounded-lg">
              <h4 className="font-bold uppercase text-sm">{locale}</h4>
              <div>
                <Label>Title</Label>
                <Input
                  value={translations[locale]?.title || ''}
                  onChange={(e) =>
                    setTranslations({
                      ...translations,
                      [locale]: { ...translations[locale], title: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input
                  value={translations[locale]?.subtitle || ''}
                  onChange={(e) =>
                    setTranslations({
                      ...translations,
                      [locale]: { ...translations[locale], subtitle: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save Section</Button>
      </div>
    </div>
  );
}

interface ArticleGridSettingsFormProps {
  settings: ArticleGridSettings;
  onChange: (settings: any) => void;
}

function ArticleGridSettingsForm({ settings, onChange }: ArticleGridSettingsFormProps) {
  const tenant = useTenant();
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);

  const mode = settings.mode || 'latest';

  useEffect(() => {
    const loadArticles = async () => {
      const token = localStorage.getItem('saas_token');
      if (!token || !tenant?.tenantId) return;
      setArticlesLoading(true);
      try {
        const data = await fetchArticles(tenant.tenantId, token);
        setArticles(data);
      } catch (err) {
        console.error(err);
      } finally {
        setArticlesLoading(false);
      }
    };
    loadArticles();
  }, [tenant?.tenantId]);

  const toggleSlug = (slug: string) => {
    const current = settings.selectedSlugs || [];
    const updated = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug];
    onChange({ ...settings, selectedSlugs: updated });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Mode</Label>
        <Select
          value={mode}
          onValueChange={(val) =>
            onChange({ ...settings, mode: val as 'latest' | 'manual' })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest Articles</SelectItem>
            <SelectItem value="manual">Manually Selected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mode === 'latest' && (
        <div className="space-y-2">
          <Label htmlFor="limit">Limit</Label>
          <Input
            id="limit"
            type="number"
            min={1}
            max={50}
            value={settings.limit ?? 3}
            onChange={(e) =>
              onChange({
                ...settings,
                limit: parseInt(e.target.value, 10) || 3,
              })
            }
          />
        </div>
      )}

      {mode === 'manual' && (
        <div className="space-y-2">
          <Label>Selected Articles</Label>
          {articlesLoading ? (
            <p className="text-sm text-muted-foreground">Loading articles...</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
              {articles.map((article) => (
                <div
                  key={article._id}
                  className="flex items-center gap-2"
                >
                  <Checkbox
                    id={`article-${article._id}`}
                    checked={
                      (settings.selectedSlugs || []).includes(article.slug)
                    }
                    onCheckedChange={() => toggleSlug(article.slug)}
                  />
                  <Label
                    htmlFor={`article-${article._id}`}
                    className="cursor-pointer flex-1"
                  >
                    <span className="font-medium">{article.title}</span>
                    <span className="text-sm text-muted-foreground block">
                      slug: {article.slug}
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
