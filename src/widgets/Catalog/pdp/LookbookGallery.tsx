'use client';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface LookbookGalleryProps {
  images: string[];
  productName: string;
  onSelectImage?: (index: number) => void;
}

/**
 * Lookbook gallery (asymmetrical masonry):
 * Uses CSS columns for an artistic, editorial layout.
 * Ideal for creative niches (fashion lookbooks, art, design).
 * The right-side ProductInfoPanel uses `position: sticky`
 * so it stays in view while the user scrolls through images.
 */
export default function LookbookGallery({ images, productName, onSelectImage }: LookbookGalleryProps) {
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

  // Vary aspect ratios for an editorial, asymmetrical masonry feel
  const aspects = ['aspect-[3/4]', 'aspect-[2/3]', 'aspect-square', 'aspect-[4/5]', 'aspect-[3/5]'];

  return (
    <div className="columns-1 xl:columns-2 gap-3">
      {images.map((img, idx) => (
        <div
          key={idx}
          className={`group relative overflow-hidden bg-muted w-full mb-3 break-inside-avoid cursor-zoom-in ${aspects[idx % aspects.length]}`}
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
