import { SectionType } from '@/entities/branch-section/types';
import type { BranchSection } from '@/entities/branch-section/types';
import type { ComponentType } from 'react';
import type { MenuItem } from '@/entities/menu-item/types';
import HeroSection from './HeroSection';
import EntityCarousel from './EntityCarousel';
import FeatureCarousel from './FeatureCarousel';
import MapSection from './MapSection';
import BookingSection from './BookingSection';
import FeaturedGridSection from './FeaturedGridSection';
import ArticleGridSection from './ArticleGridSection';
import DynamicFormSection from './DynamicFormSection';
import ContactBlockSection from './ContactBlockSection';
import CategoryListSection from './CategoryListSection';
import RichTextSection from './RichTextSection';
import SystemCatalogSection from './SystemCatalogSection';
import SystemMenuSection from './SystemMenuSection';
import SystemArticlesSection from './SystemArticlesSection';
import SystemGallerySection from './SystemGallerySection';
import SystemContactsSection from './SystemContactsSection';
import SystemBookingCheckoutSection from './SystemBookingCheckoutSection';

interface SectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
  branchSlug?: string;
  /** Pre-fetched dynamic items for carousel sections */
  dynamicItems?: MenuItem[];
  /** Currency symbol for price display */
  currencySymbol?: string;
}

export const sectionRegistry: Record<SectionType, ComponentType<SectionProps>> = {
  hero: HeroSection,
  hero_video: HeroSection, // Legacy fallback
  entity_carousel: EntityCarousel,
  feature_carousel: FeatureCarousel,
  booking: BookingSection,
  map: MapSection,
  menu_categories: FeaturedGridSection,
  article_grid: ArticleGridSection,
  dynamic_form: DynamicFormSection,
  contact_block: ContactBlockSection,
  category_list: CategoryListSection,
  rich_text: RichTextSection,
  // System section types
  system_catalog: SystemCatalogSection,
  system_menu: SystemMenuSection,
  system_articles: SystemArticlesSection,
  system_gallery: SystemGallerySection,
  system_contacts: SystemContactsSection,
  system_booking_checkout: SystemBookingCheckoutSection,
};
