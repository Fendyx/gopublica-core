import { SectionType } from '@/entities/branch-section/types';
import type { BranchSection } from '@/entities/branch-section/types';
import type { ComponentType } from 'react';
import HeroSection from './HeroSection';
import EntityCarousel from './EntityCarousel';
import FeatureCarousel from './FeatureCarousel';
import MapSection from './MapSection';
import BookingSection from './BookingSection';
import FeaturedGridSection from './FeaturedGridSection';
import ArticleGridSection from './ArticleGridSection';

interface SectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
}

const MenuCategories: ComponentType<SectionProps> = ({ section }) => (
  <div>TODO: {section.type}</div>
);

export const sectionRegistry: Record<SectionType, ComponentType<SectionProps>> = {
  hero: HeroSection,
  hero_video: HeroSection, // Legacy fallback
  entity_carousel: EntityCarousel,
  feature_carousel: FeatureCarousel,
  booking: BookingSection,
  map: MapSection,
  menu_categories: FeaturedGridSection,
  article_grid: ArticleGridSection,
};
