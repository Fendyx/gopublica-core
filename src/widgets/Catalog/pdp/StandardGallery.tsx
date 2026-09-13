'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import ProductInfoPanel from '@/widgets/Catalog/pdp/ProductInfoPanel';
import type { ProductDetailData } from '@/widgets/Catalog/useProductDetail';
import type { MenuItem } from '@/entities/menu-item/types';

interface StandardGalleryProps {
  images: string[];
  productName: string;
}

/**
 * Standard gallery: renders all product images in a vertical stack.
 * Each image fills the column width with a 3:4 aspect ratio.
 */
export function StandardGallery({ images, productName }: StandardGalleryProps) {
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
    <div className="space-y-2">
      {images.map((img, idx) => (
        <div
          key={idx}
          className="group relative overflow-hidden bg-muted w-full aspect-[3/4]"
        >
          <Image
            src={img}
            alt={`${productName} - ${t('view')} ${idx + 1}`}
            fill
            sizes="(max-width: 768px) 33vw, 25vw"
            className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-[1.03]"
          />
        </div>
      ))}
    </div>
  );
}
