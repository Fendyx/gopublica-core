'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface ClassicGalleryProps {
  images: string[];
  productName: string;
  onSelectImage?: (index: number) => void;
}

/**
 * Classic gallery (Amazon/Allegro style):
 * One large main image area with a horizontal row of smaller
 * clickable thumbnails directly below.
 */
export default function ClassicGallery({ images, productName, onSelectImage }: ClassicGalleryProps) {
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

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div
        className="relative w-full aspect-square max-h-[600px] overflow-hidden bg-muted cursor-zoom-in"
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

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelected(idx)}
              className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 overflow-hidden bg-muted transition-all duration-200 ${
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
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
