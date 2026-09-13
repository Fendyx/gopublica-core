'use client';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface StackedGridGalleryProps {
  images: string[];
  productName: string;
  onSelectImage?: (index: number) => void;
}

/**
 * Stacked-Grid gallery (Zara/Mango style):
 * Images are stacked vertically in a strict 1 or 2 column grid.
 * Enforces a strict aspect ratio (3:4) with object-cover to keep
 * the grid perfectly aligned. The right-side ProductInfoPanel uses
 * `position: sticky` and `top-4` so it stays visible while scrolling.
 */
export default function StackedGridGallery({ images, productName, onSelectImage }: StackedGridGalleryProps) {
  const t = useTranslations('productDetail');

  if (images.length === 0) {
    return (
      <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center">
        <span className="text-[10px] tracking-widest uppercase text-muted-foreground">
          {t('noPhoto')}
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      {images.map((img, idx) => (
        <div
          key={idx}
          className="group relative overflow-hidden bg-muted w-full aspect-[3/4] cursor-zoom-in"
          onClick={() => onSelectImage?.(idx)}
        >
          <Image
            src={img}
            alt={`${productName} - ${t('view')} ${idx + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="w-full h-full object-contain transition-transform duration-700 ease-in-out group-hover:scale-[1.03]"
            preload={idx < 2}
          />
        </div>
      ))}
    </div>
  );
}
