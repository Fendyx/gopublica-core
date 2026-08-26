'use client';
import { useState, useEffect } from 'react';
import { BranchSection, SectionType, ArticleGridSettings, ArticleGridLayoutMode, ArticleGridAspectRatio, ArticleGridCardVariant, HeroSettings, HeroMediaType, HeroLayout, HeroTextAlign, CarouselMode, HeroCta, CtaTargetMode, HeroSlide } from '@/entities/branch-section/types';
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

  // FIX: хуки вызываем ТОЛЬКО на верхнем уровне (раньше useTenant/useBranch были внутри switch-case)
  const tenant = useTenant();
  const branch = useBranch();

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

  // ─── Архитектура загрузчиков Cloudinary ───
  // Отдельный экземпляр хука на каждое назначение — каждый со своим onSuccess.
  // Это убирает хрупкую логику "роутинга по текущему mediaType".

  // 1. Одиночное видео Hero
  const { openWidget: openVideoUpload } = useCloudinaryUpload({
    resourceType: 'video',
    onSuccess: (url) => setSettings((prev: any) => ({ ...prev, videoUrl: url })),
  });

  // 2. Одиночное изображение Hero
  const { openWidget: openImageUpload } = useCloudinaryUpload({
    resourceType: 'image',
    onSuccess: (url) => setSettings((prev: any) => ({ ...prev, imageUrl: url })),
  });

  // 3. Слайдер: мультизагрузка новых слайдов ИЛИ замена конкретного слайда.
  // uploadingSlideIndex === null → добавляем в конец; число → заменяем слайд с этим индексом.
  const [uploadingSlideIndex, setUploadingSlideIndex] = useState<number | null>(null);

  const { openWidget: openSlideUpload } = useCloudinaryUpload({
    multiple: true,
    onSuccess: (url, resourceType) => {
      setSettings((prev: any) => {
        const slides: HeroSlide[] = [...(prev.slides || [])];
        const newSlide: HeroSlide =
          resourceType === 'video' ? { videoUrl: url } : { imageUrl: url };
        if (uploadingSlideIndex !== null && slides[uploadingSlideIndex]) {
          // Замена существующего слайда — сохраняем его позицию
          slides[uploadingSlideIndex] = newSlide;
        } else {
          slides.push(newSlide);
        }
        return { ...prev, slides };
      });
      setUploadingSlideIndex(null);
    },
  });

  /** Открыть виджет для добавления новых слайдов */
  const handleAddSlides = () => {
    setUploadingSlideIndex(null);
    openSlideUpload();
  };

  /** Открыть виджет для замены слайда по индексу */
  const handleReplaceSlide = (idx: number) => {
    setUploadingSlideIndex(idx);
    openSlideUpload();
  };

  /** Перестановка слайдов местами */
  const handleMoveSlide = (idx: number, direction: -1 | 1) => {
    setSettings((prev: any) => {
      const slides: HeroSlide[] = [...(prev.slides || [])];
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= slides.length) return prev;
      [slides[idx], slides[targetIdx]] = [slides[targetIdx], slides[idx]];
      return { ...prev, slides };
    });
  };

  /** Удаление слайда по индексу */
  const handleRemoveSlide = (idx: number) => {
    setSettings((prev: any) => ({
      ...prev,
      slides: (prev.slides || []).filter((_: HeroSlide, i: number) => i !== idx),
    }));
  };

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

            <div className="space-y-2">
              <Label>Text Alignment</Label>
              <Select
                value={settings.textAlign || 'center'}
                onValueChange={(val) =>
                  setSettings({ ...settings, textAlign: val as HeroTextAlign })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select text alignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
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
                  <Button type="button" onClick={() => openVideoUpload()}>
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
                  <Button type="button" onClick={() => openImageUpload()}>
                    Upload
                  </Button>
                </div>
              </div>
            )}

            {settings.mediaType === 'slider' && (
              <div className="space-y-2">
                <Label>Slides (images & videos)</Label>

                {(settings.slides || []).map((slide: HeroSlide, idx: number) => {
                  const isVideo = Boolean(slide.videoUrl) && !slide.imageUrl;
                  return (
                    <div key={idx} className="flex items-center gap-2 p-2 border rounded-md bg-muted/40">
                      {/* Превью */}
                      <div className="w-14 h-10 shrink-0 rounded overflow-hidden bg-muted flex items-center justify-center text-[10px] uppercase font-bold text-muted-foreground">
                        {isVideo ? (
                          <span>▶ vid</span>
                        ) : slide.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={slide.imageUrl} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <span>?</span>
                        )}
                      </div>

                      {/* URL слайда */}
                      <Input
                        className="flex-1"
                        placeholder="https://res.cloudinary.com/..."
                        value={slide.imageUrl || slide.videoUrl || ''}
                        onChange={(e) => {
                          const newSlides = [...(settings.slides || [])];
                          newSlides[idx] = isVideo
                            ? { videoUrl: e.target.value }
                            : { imageUrl: e.target.value };
                          setSettings({ ...settings, slides: newSlides });
                        }}
                      />

                      {/* Замена через Cloudinary */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        title="Replace via Cloudinary"
                        onClick={() => handleReplaceSlide(idx)}
                      >
                        Upload
                      </Button>

                      {/* Перестановка */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={idx === 0}
                        title="Move up"
                        onClick={() => handleMoveSlide(idx, -1)}
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={idx === (settings.slides?.length || 0) - 1}
                        title="Move down"
                        onClick={() => handleMoveSlide(idx, 1)}
                      >
                        ↓
                      </Button>

                      {/* Удаление */}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        title="Remove slide"
                        onClick={() => handleRemoveSlide(idx)}
                      >
                        ✕
                      </Button>
                    </div>
                  );
                })}

                <Button type="button" variant="outline" size="sm" onClick={handleAddSlides}>
                  + Add Slides (multi-upload)
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

            <div className="space-y-2">
              <Label>Items per row (desktop)</Label>
              <Select
                value={String(settings.desktopItemsPerRow ?? (initialData?.type === 'feature_carousel' ? 4 : 3))}
                onValueChange={(val) =>
                  setSettings({ ...settings, desktopItemsPerRow: Number(val) as 3 | 4 | 5 })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select items per row" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 items</SelectItem>
                  <SelectItem value="4">4 items</SelectItem>
                  <SelectItem value="5">5 items</SelectItem>
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

      {/* Appearance Settings */}
      <div className="space-y-4 pt-4 border-t">
        <Label className="text-sm font-semibold">Appearance</Label>

        {/* Layout Mode */}
        <div className="space-y-2">
          <Label htmlFor="layoutMode">Layout Mode</Label>
          <Select
            value={settings.layoutMode || 'grid'}
            onValueChange={(val) =>
              onChange({ ...settings, layoutMode: val as ArticleGridLayoutMode })
            }
          >
            <SelectTrigger id="layoutMode">
              <SelectValue placeholder="Select layout mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Grid</SelectItem>
              <SelectItem value="carousel">Carousel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-2">
          <Label htmlFor="aspectRatio">Image Aspect Ratio</Label>
          <Select
            value={settings.aspectRatio || '16:9'}
            onValueChange={(val) =>
              onChange({ ...settings, aspectRatio: val as ArticleGridAspectRatio })
            }
          >
            <SelectTrigger id="aspectRatio">
              <SelectValue placeholder="Select aspect ratio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
              <SelectItem value="4:3">4:3 (Standard)</SelectItem>
              <SelectItem value="1:1">1:1 (Square)</SelectItem>
              <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Card Variant */}
        <div className="space-y-2">
          <Label htmlFor="cardVariant">Card Style</Label>
          <Select
            value={settings.cardVariant || 'default'}
            onValueChange={(val) =>
              onChange({ ...settings, cardVariant: val as ArticleGridCardVariant })
            }
          >
            <SelectTrigger id="cardVariant">
              <SelectValue placeholder="Select card style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default (text below image)</SelectItem>
              <SelectItem value="overlay">Overlay (text over image)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Items Per Row */}
        <div className="space-y-2">
          <Label htmlFor="itemsPerRow">Items per Row (Desktop)</Label>
          <Select
            value={settings.itemsPerRow?.toString() || '3'}
            onValueChange={(val) =>
              onChange({ ...settings, itemsPerRow: parseInt(val, 10) || 3 })
            }
          >
            <SelectTrigger id="itemsPerRow">
              <SelectValue placeholder="Select items per row" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
