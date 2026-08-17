'use client';
import { SectionType } from '@/entities/branch-section/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Calendar } from 'lucide-react';

interface SectionTypePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: SectionType) => void;
}

const availableTypes: { type: SectionType; label: string; description: string; icon?: React.ElementType }[] = [
  {
    type: 'hero',
    label: 'Hero',
    description: 'Flexible hero section with video, image, or slider media and fullscreen/compact layouts.',
  },
  {
    type: 'entity_carousel',
    label: 'Entity Carousel',
    description: 'Horizontal slider for team members, animals, or services.',
  },
  {
    type: 'feature_carousel',
    label: 'Feature Carousel',
    description: 'Grid slider for highlights or features.',
  },
  {
    type: 'map',
    label: 'Location Map',
    description: 'Google Maps embed with address.',
  },
  {
    type: 'menu_categories',
    label: 'Featured Grid',
    description: 'Grid of clickable categories or products.',
  },
  {
    type: 'article_grid',
    label: 'Article Grid',
    description: 'Display articles in a responsive grid (latest or manually selected).',
    icon: FileText,
  },
  {
    type: 'booking',
    label: 'Booking Form',
    description: 'Embed the standard reservation form.',
    icon: Calendar,
  },
];

export default function SectionTypePicker({ isOpen, onClose, onSelect }: SectionTypePickerProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Section Type</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          {availableTypes.map(({ type, label, description, icon: Icon }) => (
            <button
              key={type}
              type="button"
              className="hover:border-primary cursor-pointer p-4 border rounded-xl bg-card text-left transition-colors"
              onClick={() => onSelect(type)}
            >
              <div className="flex items-center gap-2 mb-1">
                {Icon && <Icon className="w-4 h-4 text-primary" />}
                <span className="font-bold">{label}</span>
              </div>
              <span className="text-sm text-muted-foreground">{description}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
