'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface ThumbnailsLeftGalleryProps {
  images: string[];
  productName: string;
  onSelectImage?: (index: number) => void;
}

/**
 * Thumbnails-Left gallery (Shopify style):
 * A vertical column of clickable thumbnails on the far left,
 * with the large main image to the right.
 *
 * Note: This component renders only the gallery area.
 * The parent DesktopPDP wraps it in a 3-column grid:
 * [ThumbnailsLeftGallery | ProductInfoPanel].
 */
export default function ThumbnailsLeftGallery({ images, productName, onSelectImage }: ThumbnailsLeftGalleryProps) {
  const t = useTranslations('productDetail');
  const [selected, setSelected] = useState(0);

  if (images.length === 0) {
    return (
      <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center">
        <span className="text-[10px] tracking-widest uppercase text-muted-foreground">
          {t('noPhoto')}
        </span>
      </div>
    );
  }

  // ThumbnailsLeftGallery is rendered as the FIRST grid child in DesktopPDP.
  // The parent grid is: grid-cols-[80px_1fr_420px].
  // This component renders only the thumbnail column (auto-width).
  // The main image is rendered as the SECOND grid child by DesktopPDP.
  //
  // Actually — we render both thumbnails + main image here.
  // The parent grid has 3 columns: [auto | 1fr | 420px].
  // We use col-span-2 to take the first two columns.
  return (
    <div className="col-span-2 flex gap-3 min-w-0">
      {/* Vertical thumbnail column */}
      <div className="flex flex-col gap-2 flex-shrink-0 overflow-y-auto max-h-[600px]">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setSelected(idx)}
            className={`relative flex-shrink-0 w-16 h-20 sm:w-20 sm:h-24 overflow-hidden bg-muted transition-all duration-200 ${
              idx === selected
                ? 'ring-2 ring-foreground ring-offset-2'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            <Image
              src={img}
              alt={`${productName} thumbnail ${idx + 1}`}
              fill
              sizes="80px"
              className="object-contain"
            />
          </button>
        ))}
      </div>

      {/* Main image */}
      <div
        className="relative flex-1 min-w-0 aspect-[3/4] max-h-[600px] overflow-hidden bg-muted cursor-zoom-in"
        onClick={() => onSelectImage?.(selected)}
      >
        <Image
          src={images[selected]}
          alt={`${productName} - ${t('view')} ${selected + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain transition-opacity duration-300"
          priority
        />
      </div>
    </div>
  );
}
