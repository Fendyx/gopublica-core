'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { BranchSection, SectionType, ArticleGridSettings, ArticleGridLayoutMode, ArticleGridAspectRatio, ArticleGridCardVariant, HeroSettings, HeroMediaType, HeroLayout, HeroTextAlign, HeroPreset, CarouselMode, HeroCta, CtaTargetMode, HeroSlide, DynamicFormSettings, FormField } from '@/entities/branch-section/types';
import { useCloudinaryUpload } from '@/shared/lib/useCloudinaryUpload';
import { saveBranchSectionItem, deleteBranchSectionItem } from '@/entities/branch-section/api';
import { fetchArticles } from '@/entities/article/api';
import type { Article } from '@/entities/article/types';
import { useTenant } from '@/entities/tenant/TenantContext';
import { useBranch } from '@/entities/branch/BranchContext';
import { TranslatableGroup } from '@/shared/ui/TranslatableGroup';
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
import FormFieldsEditor from '@/features/dynamic-form/FormFieldsEditor';
import { ArticleEditor } from '../ArticleEditor';

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
  const t = useTranslations('admin.sectionForm');
  const tenant = useTenant();
  const targetMode: CtaTargetMode = cta?.targetMode || 'section';
  const selectedSectionId = cta?.targetSectionId || '';
  const customUrl = cta?.customUrl || '';

  // Доступные секции (исключаем текущую Hero-секцию, чтобы не скроллить на нее саму)
  const availableSections = sections.filter((s) => s.type !== 'hero' && s.type !== 'hero_video');

  return (
    <div className="space-y-3">
      <Label>{t('ctaTarget', { label })}</Label>

      {/* Переключатель режима */}
      <Select
        value={targetMode}
        onValueChange={(val) => onChange({ ...cta, targetMode: val as CtaTargetMode })}
      >
        <SelectTrigger>
          <SelectValue placeholder={t('targetMode')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="section">{t('sectionOnPage')}</SelectItem>
          <SelectItem value="custom">{t('customUrl')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Режим: выбор секции */}
      {targetMode === 'section' && (
        <Select
          value={selectedSectionId}
          onValueChange={(val) => onChange({ ...cta, targetMode: 'section', targetSectionId: val })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('selectSectionScroll')} />
          </SelectTrigger>
          <SelectContent>
            {availableSections.length === 0 ? (
              <SelectItem value="__none__" disabled>
                {t('noSectionsAvailable')}
              </SelectItem>
            ) : (
              availableSections.map((s) => (
                <SelectItem key={s._id} value={s._id}>
                  {s.type} — {s.translations?.[tenant?.defaultLocale || 'en']?.title || s.translations?.en?.title || s._id}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}

      {/* Режим: произвольный URL */}
      {targetMode === 'custom' && (
        <Input
          placeholder={t('urlPlaceholder')}
          value={customUrl}
          onChange={(e) => onChange({ ...cta, targetMode: 'custom', customUrl: e.target.value })}
        />
      )}
    </div>
  );
}

export default function SectionForm({ initialData, defaultType, onSave, onCancel, sections }: SectionFormProps) {
  // Hooks must be declared BEFORE any usage (React Rules of Hooks + const TDZ)
  const t = useTranslations('admin.sectionForm');
  const tenant = useTenant();
  const branch = useBranch();

  const type = initialData?.type || defaultType;
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [settings, setSettings] = useState<any>(initialData?.settings ?? {});
  const activeLocales = tenant?.activeLocales || ['pl', 'en'];
  const defaultLocale = tenant?.defaultLocale || 'pl';

  // Build initial translations from active locales (avoid hardcoded keys)
  const buildEmptyTranslations = () => Object.fromEntries(activeLocales.map((l: string) => [l, {}]));
  const [translations, setTranslations] = useState<any>(
    initialData?.translations ?? buildEmptyTranslations()
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
        // ─── Пресеты / Шаблоны Hero-секции ───
        const presetOptions: { value: HeroPreset; label: string; description: string; previewEmoji: string }[] = [
          {
            value: 'classic_with_buttons',
            label: 'Classic with Buttons',
            description: t('presetClassic'),
            previewEmoji: '🎯',
          },
          {
            value: 'banner_link',
            label: 'Banner Link',
            description: t('presetBanner'),
            previewEmoji: '🔗',
          },
          {
            value: 'gallery_slider',
            label: 'Gallery Slider',
            description: t('presetGallery'),
            previewEmoji: '🖼️',
          },
        ];

        const currentPreset: HeroPreset | undefined = settings.preset;

        /** Применить пресет — автоматически настроить mediaType, layout и прочее */
        const applyPreset = (preset: HeroPreset) => {
          switch (preset) {
            case 'classic_with_buttons':
              setSettings({
                ...settings,
                preset,
                mediaType: settings.mediaType || 'image',
                layout: settings.layout || 'fullscreen',
                textAlign: settings.textAlign || 'center',
                primaryCta: settings.primaryCta || { label: '', targetMode: 'section' },
                sliderShowArrows: false,
                sliderPauseOnInteraction: true,
              });
              break;
            case 'banner_link':
              setSettings({
                ...settings,
                preset,
                mediaType: settings.mediaType || 'image',
                layout: settings.layout || 'fullscreen',
                textAlign: settings.textAlign || 'center',
                primaryCta: undefined,
                secondaryCta: undefined,
                clickableUrl: settings.clickableUrl || '',
                sliderShowArrows: false,
                sliderPauseOnInteraction: true,
              });
              break;
            case 'gallery_slider':
              setSettings({
                ...settings,
                preset,
                mediaType: 'slider',
                layout: settings.layout || 'fullscreen',
                textAlign: settings.textAlign || 'center',
                sliderAutoplayMs: settings.sliderAutoplayMs || 5000,
                sliderShowArrows: true,
                sliderPauseOnInteraction: true,
                primaryCta: settings.primaryCta || { label: '', targetMode: 'section' },
                secondaryCta: settings.secondaryCta || { label: '', targetMode: 'section' },
              });
              break;
          }
        };

        /** Видимость полей зависит от пресета */
        const showCtaFields = currentPreset !== 'banner_link';
        const showClickableUrl = currentPreset === 'banner_link';
        const showSliderSettings = currentPreset === 'gallery_slider';

        return (
          <div className="space-y-4">
            {/* ─── Пресет / Шаблон ─── */}
            <div className="space-y-2">
              <Label>{t('templatePreset')}</Label>
              <Select
                value={currentPreset || ''}
                onValueChange={(val) => {
                  if (val) applyPreset(val as HeroPreset);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('choosePreset')} />
                </SelectTrigger>
                <SelectContent>
                  {presetOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="mr-1.5">{opt.previewEmoji}</span>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentPreset && (
                <p className="text-xs text-muted-foreground">
                  {presetOptions.find((o) => o.value === currentPreset)?.description}
                </p>
              )}
            </div>

            {/* ─── Media Type ─── */}
            <div className="space-y-2">
              <Label>{t('mediaType')}</Label>
              <Select
                value={settings.mediaType || 'video'}
                onValueChange={(val) =>
                  setSettings({ ...settings, mediaType: val as HeroMediaType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectMediaType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">{t('video')}</SelectItem>
                  <SelectItem value="image">{t('image')}</SelectItem>
                  <SelectItem value="slider">{t('slider')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ─── Layout ─── */}
            <div className="space-y-2">
              <Label>{t('layout')}</Label>
              <Select
                value={settings.layout || 'fullscreen'}
                onValueChange={(val) =>
                  setSettings({ ...settings, layout: val as HeroLayout })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectLayout')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fullscreen">{t('fullscreen')}</SelectItem>
                  <SelectItem value="compact">{t('compact')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ─── Text Alignment ─── */}
            <div className="space-y-2">
              <Label>{t('textAlign')}</Label>
              <Select
                value={settings.textAlign || 'center'}
                onValueChange={(val) =>
                  setSettings({ ...settings, textAlign: val as HeroTextAlign })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectTextAlign')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">{t('left')}</SelectItem>
                  <SelectItem value="center">{t('center')}</SelectItem>
                  <SelectItem value="right">{t('right')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ─── Video URL ─── */}
            {settings.mediaType === 'video' && (
              <div>
                <Label>{t('videoUrl')}</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={settings.videoUrl || ''}
                    onChange={(e) => setSettings({ ...settings, videoUrl: e.target.value })}
                  />
                  <Button type="button" onClick={() => openVideoUpload()}>
                    {t('upload')}
                  </Button>
                </div>
              </div>
            )}

            {/* ─── Image URL ─── */}
            {settings.mediaType === 'image' && (
              <div>
                <Label>{t('imageUrl')}</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={settings.imageUrl || ''}
                    onChange={(e) => setSettings({ ...settings, imageUrl: e.target.value })}
                  />
                  <Button type="button" onClick={() => openImageUpload()}>
                    {t('upload')}
                  </Button>
                </div>
              </div>
            )}

            {/* ─── Кликабельный фон (Banner Link) ─── */}
            {showClickableUrl && settings.mediaType !== 'slider' && (
              <div className="space-y-2">
                <Label>{t('linkUrl')}</Label>
                <Input
                  placeholder={t('linkUrlPlaceholder')}
                  value={settings.clickableUrl || ''}
                  onChange={(e) => setSettings({ ...settings, clickableUrl: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  {t('linkUrlHint')}
                </p>
              </div>
            )}

            {/* ─── Slider: стрелки, пауза, интервал ─── */}
            {settings.mediaType === 'slider' && (
              <>
                {showSliderSettings && (
                  <div className="space-y-2">
                    <Label>{t('autoplayInterval')}</Label>
                    <Input
                      type="number"
                      min={0}
                      step={500}
                      value={settings.sliderAutoplayMs ?? 5000}
                      onChange={(e) =>
                        setSettings({ ...settings, sliderAutoplayMs: Number(e.target.value) || 5000 })
                      }
                    />
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.sliderShowArrows ?? false}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, sliderShowArrows: checked })
                      }
                    />
                    <Label className="cursor-pointer">{t('showArrows')}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.sliderPauseOnInteraction ?? true}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, sliderPauseOnInteraction: checked })
                      }
                    />
                    <Label className="cursor-pointer">{t('pauseOnInteraction')}</Label>
                  </div>
                </div>
              </>
            )}

            {/* ─── Slides editor ─── */}
            {settings.mediaType === 'slider' && (
              <div className="space-y-2">
                <Label>{t('slides')}</Label>

                {(settings.slides || []).map((slide: HeroSlide, idx: number) => {
                  const isVideo = Boolean(slide.videoUrl) && !slide.imageUrl;
                  return (
                    <div key={idx} className="space-y-2 p-2 border rounded-md bg-muted/40">
                      <div className="flex items-center gap-2">
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
                              ? { videoUrl: e.target.value, clickableUrl: slide.clickableUrl }
                              : { imageUrl: e.target.value, clickableUrl: slide.clickableUrl };
                            setSettings({ ...settings, slides: newSlides });
                          }}
                        />

                        {/* Замена через Cloudinary */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          title={t('replaceCloudinary')}
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
                          title={t('moveUp')}
                          onClick={() => handleMoveSlide(idx, -1)}
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={idx === (settings.slides?.length || 0) - 1}
                          title={t('moveDown')}
                          onClick={() => handleMoveSlide(idx, 1)}
                        >
                          ↓
                        </Button>

                        {/* Удаление */}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          title={t('removeSlide')}
                          onClick={() => handleRemoveSlide(idx)}
                        >
                          ✕
                        </Button>
                      </div>

                      {/* Кликабельный URL слайда */}
                      <Input
                        className="ml-[4.25rem]"
                        placeholder={t('slideLinkPlaceholder')}
                        value={slide.clickableUrl || ''}
                        onChange={(e) => {
                          const newSlides = [...(settings.slides || [])];
                          newSlides[idx] = { ...slide, clickableUrl: e.target.value || undefined };
                          setSettings({ ...settings, slides: newSlides });
                        }}
                      />
                    </div>
                  );
                })}

                <Button type="button" variant="outline" size="sm" onClick={handleAddSlides}>
                  {t('addSlides')}
                </Button>
              </div>
            )}

            {/* ─── CTA Buttons (hidden for banner_link preset) ─── */}
            {showCtaFields && (
              <>
                <div>
                  <Label>{t('primaryCtaLabel')}</Label>
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
                  <Label>{t('secondaryCtaLabel')}</Label>
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
              </>
            )}
          </div>
        );
      case 'map':
        return (
          <div className="space-y-4">
            <div>
              <Label>{t('address')}</Label>
              <Input
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('latitude')}</Label>
                <Input
                  type="number"
                  value={settings.latitude || ''}
                  onChange={(e) => setSettings({ ...settings, latitude: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>{t('longitude')}</Label>
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
              <Label>{t('itemsComma')}</Label>
              <Input
                value={typeof settings.items === 'string' ? settings.items : settings.items?.join(', ') || ''}
                onChange={(e) => setSettings({ ...settings, items: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('displayType')}</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={settings.displayType || 'categories'}
                onChange={(e) => setSettings({ ...settings, displayType: e.target.value })}
              >
                <option value="categories">{t('categories')}</option>
                <option value="products">{t('products')}</option>
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
              <Label>{t('displayMode')}</Label>
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
                  <SelectValue placeholder={t('displayMode')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">{t('manualCustom')}</SelectItem>
                  <SelectItem value="ecommerce">{t('ecommerceProducts')}</SelectItem>
                  <SelectItem value="menu">{t('menuItems')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('itemsPerRow')}</Label>
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
                    {t('saveSectionFirst')}
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
        const checkoutFlow = settings.checkoutFlow || 'inline';
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('checkoutFlow')}</Label>
              <Select
                value={checkoutFlow}
                onValueChange={(val) =>
                  setSettings({
                    ...settings,
                    checkoutFlow: val as 'inline' | 'redirect',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectCheckoutFlow')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inline">{t('inlineStandard')}</SelectItem>
                  <SelectItem value="redirect">{t('redirectToPage')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t('checkoutFlowHint')}</p>
            </div>

            <div className="space-y-2">
              <Label>{t('sideContentType')}</Label>
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
                  <SelectValue placeholder={t('selectSideContent')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('noneSingleColumn')}</SelectItem>
                  <SelectItem value="map">{t('googleMap')}</SelectItem>
                  <SelectItem value="text">{t('customText')}</SelectItem>
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
                <Label>{t('customText')}</Label>
                <Textarea
                  placeholder={t('customTextPlaceholder')}
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
      case 'dynamic_form': {
        const dfSettings = settings as DynamicFormSettings;
        const [currentLang, setCurrentLang] = useState<string>('base');
        const tDf = useTranslations('admin.sectionForm.dynamicForm');

        const handleFieldsChange = (fields: FormField[]) => {
          setSettings({ ...settings, fields });
        };

        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-sm font-medium text-gray-700">{t('language')}</span>
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

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('submitButtonLabel')} {currentLang !== 'base' && `(${currentLang.toUpperCase()})`}</Label>
                <Input
                  value={currentLang === 'base' ? (dfSettings.submitLabel || '') : (dfSettings.submitLabelI18n?.[currentLang] || '')}
                  onChange={(e) => {
                    if (currentLang === 'base') {
                      setSettings({ ...settings, submitLabel: e.target.value });
                    } else {
                      setSettings({
                        ...settings,
                        submitLabelI18n: { ...(dfSettings.submitLabelI18n || {}), [currentLang]: e.target.value },
                      });
                    }
                  }}
                  placeholder="Submit"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('successMessage')} {currentLang !== 'base' && `(${currentLang.toUpperCase()})`}</Label>
                <Input
                  value={currentLang === 'base' ? (dfSettings.successMessage || '') : (dfSettings.successMessageI18n?.[currentLang] || '')}
                  onChange={(e) => {
                    if (currentLang === 'base') {
                      setSettings({ ...settings, successMessage: e.target.value });
                    } else {
                      setSettings({
                        ...settings,
                        successMessageI18n: { ...(dfSettings.successMessageI18n || {}), [currentLang]: e.target.value },
                      });
                    }
                  }}
                  placeholder="Form submitted successfully!"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('notificationEmail')}</Label>
                <Input
                  type="email"
                  value={dfSettings.notificationEmail || ''}
                  onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
                  placeholder="notifications@example.com"
                />
              </div>

              {/* NEW SECTION: Side Panel Rich Text */}
              <div className="space-y-2 pt-4 border-t">
                <Label>{t('sidePanelText')} {currentLang !== 'base' && `(${currentLang.toUpperCase()})`}</Label>
                <p className="text-xs text-muted-foreground mb-2">{t('sidePanelHint')}</p>
                <div className="border rounded-xl bg-white overflow-hidden min-h-[150px]">
                <ArticleEditor
                    body={currentLang === 'base' ? (dfSettings.sideText || '') : (dfSettings.sideTextI18n?.[currentLang] || '')}
                    onChange={(val: string) => {
                      if (currentLang === 'base') {
                        setSettings({ ...settings, sideText: val });
                      } else {
                        setSettings({
                          ...settings,
                          sideTextI18n: { ...(dfSettings.sideTextI18n || {}), [currentLang]: val },
                        });
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <FormFieldsEditor
              fields={dfSettings.fields || []}
              onChange={handleFieldsChange}
              currentLang={currentLang}
              t={tDf}
            />
          </div>
        );
      }
      case 'rich_text': {
        const rtSettings = settings as any;
        const [currentLang, setCurrentLang] = useState<string>('base');

        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-sm font-medium text-gray-700">{t('language')}</span>
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

            <div className="space-y-2">
              <Label>{t('content')} {currentLang !== 'base' && `(${currentLang.toUpperCase()})`}</Label>
              <p className="text-xs text-muted-foreground">{t('richTextHint')}</p>
              <div className="border rounded-xl bg-white overflow-hidden min-h-[250px]">
                <ArticleEditor
                  body={currentLang === 'base' ? (rtSettings.content || '') : (rtSettings.contentI18n?.[currentLang] || '')}
                  onChange={(val: string) => {
                    if (currentLang === 'base') {
                      setSettings({ ...settings, content: val });
                    } else {
                      setSettings({
                        ...settings,
                        contentI18n: { ...(rtSettings.contentI18n || {}), [currentLang]: val },
                      });
                    }
                  }}
                />
              </div>
            </div>
          </div>
        );
      }
      default:
        return <p className="text-sm text-gray-500">{t('additionalItems')}</p>;
    }
  };

  return (
    <div className="p-6 bg-card text-card-foreground rounded-xl border border-border shadow-sm space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t('editSection', { type: type || '' })}</h2>
        <div className="flex items-center gap-2">
          <Label htmlFor="active-toggle">{t('active')}</Label>
          <Switch id="active-toggle" checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">{t('settings')}</h3>
        {renderSettings()}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">{t('translationsHeading')}</h3>
        <TranslatableGroup
          value={translations}
          onChange={setTranslations}
          activeLocales={activeLocales}
          defaultLocale={defaultLocale}
          fields={[
            { key: 'title', label: 'Title' },
            { key: 'subtitle', label: 'Subtitle' },
          ]}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button onClick={handleSave}>{t('saveSection')}</Button>
      </div>
    </div>
  );
}

interface ArticleGridSettingsFormProps {
  settings: ArticleGridSettings;
  onChange: (settings: any) => void;
}

function ArticleGridSettingsForm({ settings, onChange }: ArticleGridSettingsFormProps) {
  const t = useTranslations('admin.sectionForm');
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
        <Label>{t('mode')}</Label>
        <Select
          value={mode}
          onValueChange={(val) =>
            onChange({ ...settings, mode: val as 'latest' | 'manual' })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t('selectMode')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">{t('latestArticles')}</SelectItem>
            <SelectItem value="manual">{t('manuallySelected')}</SelectItem>
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
          <Label>{t('selectedArticles')}</Label>
          {articlesLoading ? (
            <p className="text-sm text-muted-foreground">{t('loadingArticles')}</p>
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
        <Label className="text-sm font-semibold">{t('appearance')}</Label>

        {/* Layout Mode */}
        <div className="space-y-2">
          <Label htmlFor="layoutMode">{t('layoutMode')}</Label>
          <Select
            value={settings.layoutMode || 'grid'}
            onValueChange={(val) =>
              onChange({ ...settings, layoutMode: val as ArticleGridLayoutMode })
            }
          >
            <SelectTrigger id="layoutMode">
              <SelectValue placeholder={t('selectLayoutMode')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">{t('grid')}</SelectItem>
              <SelectItem value="carousel">{t('carousel')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-2">
          <Label htmlFor="aspectRatio">{t('imageAspectRatio')}</Label>
          <Select
            value={settings.aspectRatio || '16:9'}
            onValueChange={(val) =>
              onChange({ ...settings, aspectRatio: val as ArticleGridAspectRatio })
            }
          >
            <SelectTrigger id="aspectRatio">
              <SelectValue placeholder={t('selectAspectRatio')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">{t('widescreen')}</SelectItem>
              <SelectItem value="4:3">{t('standard')}</SelectItem>
              <SelectItem value="1:1">{t('square')}</SelectItem>
              <SelectItem value="9:16">{t('vertical')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Card Variant */}
        <div className="space-y-2">
          <Label htmlFor="cardVariant">{t('cardStyle')}</Label>
          <Select
            value={settings.cardVariant || 'default'}
            onValueChange={(val) =>
              onChange({ ...settings, cardVariant: val as ArticleGridCardVariant })
            }
          >
            <SelectTrigger id="cardVariant">
              <SelectValue placeholder={t('selectCardStyle')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">{t('defaultBelow')}</SelectItem>
              <SelectItem value="overlay">{t('overlay')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Items Per Row */}
        <div className="space-y-2">
          <Label htmlFor="itemsPerRow">{t('itemsPerRowDesktop')}</Label>
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