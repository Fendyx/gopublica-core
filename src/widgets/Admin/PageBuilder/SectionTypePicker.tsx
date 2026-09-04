'use client';
import { SectionType } from '@/entities/branch-section/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  GalleryHorizontalEnd,
  Sparkles,
  MapPin,
  Grid3x3,
  FileText,
  Calendar,
  ClipboardList,
  Phone,
  List,
  AlignLeft,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SectionTypePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: SectionType) => void;
}

const sectionIcons: Record<string, React.ElementType> = {
  hero: LayoutDashboard,
  entity_carousel: GalleryHorizontalEnd,
  feature_carousel: Sparkles,
  map: MapPin,
  menu_categories: Grid3x3,
  article_grid: FileText,
  booking: Calendar,
  dynamic_form: ClipboardList,
  contact_block: Phone,
  category_list: List,
  rich_text: AlignLeft,
};

export default function SectionTypePicker({ isOpen, onClose, onSelect }: SectionTypePickerProps) {
  const t = useTranslations('admin.sectionTypes');

  const availableTypes: { type: SectionType; label: string; description: string }[] = [
    { type: 'hero', label: t('hero'), description: t('heroDescription') },
    { type: 'entity_carousel', label: t('entityCarousel'), description: t('entityCarouselDescription') },
    { type: 'feature_carousel', label: t('featureCarousel'), description: t('featureCarouselDescription') },
    { type: 'map', label: t('locationMap'), description: t('locationMapDescription') },
    { type: 'menu_categories', label: t('featuredGrid'), description: t('featuredGridDescription') },
    { type: 'article_grid', label: t('articleGrid'), description: t('articleGridDescription') },
    { type: 'booking', label: t('bookingForm'), description: t('bookingFormDescription') },
    { type: 'dynamic_form', label: t('dynamicForm'), description: t('dynamicFormDescription') },
    { type: 'contact_block', label: t('contactBlock'), description: t('contactBlockDescription') },
    { type: 'category_list', label: t('categoryList'), description: t('categoryListDescription') },
    { type: 'rich_text', label: t('richText'), description: t('richTextDescription') },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[420px] p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-border">
          <SheetTitle className="text-xl">{t('selectType')}</SheetTitle>
          <SheetDescription>Choose a section type to add to your page.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-3">
            {availableTypes.map(({ type, label, description }) => {
              const Icon = sectionIcons[type] || LayoutDashboard;
              return (
                <button
                  key={type}
                  type="button"
                  className="flex items-start gap-3 p-4 border rounded-xl bg-card hover:border-primary hover:bg-accent text-left transition-colors cursor-pointer"
                  onClick={() => onSelect(type)}
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <span className="block font-semibold text-sm leading-snug">{label}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
