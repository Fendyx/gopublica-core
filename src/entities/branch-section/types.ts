import type { ProductCardVariant } from '@/entities/menu-item/types';

export type SectionType = 'hero' | 'hero_video' | 'entity_carousel' | 'feature_carousel' | 'booking' | 'map' | 'menu_categories' | 'article_grid' | 'dynamic_form';

export type CarouselMode = 'manual' | 'ecommerce' | 'menu';
export type CarouselSelectionMode = 'items' | 'categories';

export interface LocalizedText {
  title?: string;
  subtitle?: string;
  story?: string;
  ctaLabel?: string;
}

export type Translations = Record<string, LocalizedText>;

export type HeroMediaType = 'video' | 'image' | 'slider';
export type HeroLayout = 'fullscreen' | 'compact';
export type HeroTextAlign = 'left' | 'center' | 'right';

export type CtaTargetMode = 'section' | 'custom';

export interface HeroCta {
  label?: string;
  /** Какой режим назначения ссылки: выбор секции или произвольный URL */
  targetMode?: CtaTargetMode;
  /** ID существующей секции на странице (когда targetMode === 'section') */
  targetSectionId?: string;
  /** Произвольный URL (когда targetMode === 'custom') */
  customUrl?: string;
  /** Устаревшее поле — тип секции для скролла (обратная совместимость) */
  targetSectionType?: SectionType;
}

export interface HeroSlide {
  /** Image slide source (Cloudinary URL). Canonical field for image slides. */
  imageUrl?: string;
  /** Video slide source (Cloudinary URL). When set (and no imageUrl), renders as video. */
  videoUrl?: string;
}

export interface HeroSettings {
  mediaType: HeroMediaType;
  layout: HeroLayout;
  videoUrl?: string;
  imageUrl?: string;
  slides?: HeroSlide[];
  primaryCta?: HeroCta;
  secondaryCta?: HeroCta;
  /** Content alignment: 'left' | 'center' | 'right'. Defaults to 'center'. */
  textAlign?: HeroTextAlign;
  /** Autoplay interval for the slider in ms. 0 or undefined = default (5000ms). */
  sliderAutoplayMs?: number;
}

export interface BaseCarouselSettings {
  /** Display mode: manual (custom cards), ecommerce (products), or menu (menu items) */
  mode?: CarouselMode;
  /** Number of cards shown per row on desktop (md breakpoint). 3/4/5. */
  desktopItemsPerRow?: 3 | 4 | 5;
  /** Number of items to show per page/viewport (optional, for pagination) */
  limit?: number;
  /** Card variant for ecommerce mode — reuses existing ProductCardVariant */
  productCardVariant?: ProductCardVariant;
  /** Image aspect ratio for ecommerce cards */
  productImageAspectRatio?: string;
  /** Card width preset for ecommerce carousel */
  productCardWidth?: string;
  /** Selection mode: pick individual items or entire categories */
  selectionMode?: CarouselSelectionMode;
  /** Category keys/IDs to include (when selectionMode === 'categories') */
  selectedCategoryKeys?: string[];
  /** Whether to show a "View All" card at the end of the carousel */
  showViewAll?: boolean;
  /** Custom label for the "View All" card (optional, falls back to i18n) */
  viewAllLabel?: string;
}

export interface EntityCarouselSettings extends BaseCarouselSettings {
  /** When mode === 'manual', items are managed via SectionItemList (existing behavior) */
  linkToDetailPage?: boolean;
  /** When mode === 'ecommerce', IDs of selected products (MenuItem._id) */
  selectedProductIds?: string[];
  /** When mode === 'menu', IDs of selected menu items (MenuItem._id) */
  selectedMenuItemIds?: string[];
}

export interface FeatureCarouselSettings extends BaseCarouselSettings {
  /** When mode === 'ecommerce', IDs of selected products */
  selectedProductIds?: string[];
  /** When mode === 'menu', IDs of selected menu items */
  selectedMenuItemIds?: string[];
}

export interface BookingSettings {
  /** Layout mode for the right side of the booking section */
  sideContentType?: 'none' | 'map' | 'text';
  /** Address used when sideContentType === 'map' */
  address?: string;
  /** Custom text shown when sideContentType === 'text' */
  customText?: string;
}

export interface MapSettings {
  latitude: number;
  longitude: number;
  address: string;
}

export interface FeaturedGridSettings {
  displayType: 'categories' | 'products';
  items: string[];
}

export type ArticleGridLayoutMode = 'grid' | 'carousel';
export type ArticleGridAspectRatio = '16:9' | '4:3' | '1:1' | '9:16';
export type ArticleGridCardVariant = 'default' | 'overlay';

export interface ArticleGridSettings {
  mode?: 'latest' | 'manual';
  limit?: number;
  selectedSlugs?: string[];
  layoutMode?: ArticleGridLayoutMode;
  aspectRatio?: ArticleGridAspectRatio;
  cardVariant?: ArticleGridCardVariant;
  itemsPerRow?: number;
}

export type FormFieldType = 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'file' | 'checkbox' | 'radio' | 'date';

export interface FormField {
  id: string;
  label: string;
  labelI18n?: Record<string, string>;
  type: FormFieldType;
  required: boolean;
  options?: string[];
  optionsI18n?: Record<string, string[]>;
  placeholder?: string;
  placeholderI18n?: Record<string, string>;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  order: number;
}

export interface DynamicFormSettings {
  fields: FormField[];
  submitLabel?: string;
  submitLabelI18n?: Record<string, string>;
  successMessage?: string;
  successMessageI18n?: Record<string, string>;
  notificationEmail?: string;
  sideText?: string;
  sideTextI18n?: Record<string, string>;
}

export type SectionSettings =
  | HeroSettings
  | EntityCarouselSettings
  | FeatureCarouselSettings
  | BookingSettings
  | MapSettings
  | FeaturedGridSettings
  | ArticleGridSettings
  | DynamicFormSettings;

export interface BranchSectionItem {
  _id: string;
  tenantId: string;
  branchId: string;
  sectionId: string;
  slug: string;
  media: { type: 'video' | 'image'; url: string };
  order: number;
  translations: Translations;
  isActive: boolean;
  body?: string;
  gallery?: { type: 'video' | 'image'; url: string }[];
  attributes?: { key: string; value: string }[];
}

export interface BranchSection {
  _id: string;
  tenantId: string;
  branchId: string;
  page: string;
  type: SectionType;
  order: number;
  isActive: boolean;
  settings: SectionSettings;
  translations: Translations;
  items?: BranchSectionItem[];
}