'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, Heart } from 'lucide-react';
import ProductGallery from '@/widgets/Catalog/ProductGallery';
import ShareButton from '@/widgets/Catalog/ShareButton';
import ProductInfoPanel from '@/widgets/Catalog/pdp/ProductInfoPanel';
import ImageLightbox from '@/widgets/Catalog/pdp/ImageLightbox';
import type { ProductDetailData } from '@/widgets/Catalog/useProductDetail';
import type { MenuItem } from '@/entities/menu-item/types';
import { resolveName } from '@/shared/lib/localization';

interface MobilePDPProps {
  product: MenuItem;
  locale: string;
  branchSlug: string;
  allImages: string[];
  detail: ProductDetailData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- next-intl messages type is not exported
  t: ReturnType<() => any>;
}

export default function MobilePDP({
  product,
  locale,
  branchSlug,
  allImages,
  detail,
  t,
}: MobilePDPProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const openLightbox = useCallback((idx: number) => setLightboxIndex(idx), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  return (
    <>
      <div className="lg:hidden">
        <div className="sticky top-0 h-[75vh] z-0 overflow-hidden bg-muted cursor-zoom-in">
          <ProductGallery images={allImages} onTapImage={openLightbox} />

          <div className="absolute inset-x-0 top-0 px-4 pt-4 flex items-center justify-between z-10">
            <Link
              href={`/${locale}/${branchSlug}/catalog`}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] tracking-widest uppercase text-foreground bg-background/60 backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              <ChevronLeft size={10} strokeWidth={2.5} />
              {t('backToCatalog')}
            </Link>

            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={detail.handleWishlistToggle}
                aria-label={detail.wishlisted ? t('removeFromWishlist') : t('addToWishlist')}
                className="w-9 h-9 flex items-center justify-center bg-background/60 backdrop-blur-md"
              >
                <Heart
                  size={16}
                  className={detail.wishlisted ? 'fill-primary text-primary' : 'text-foreground'}
                />
              </button>
              <div className="w-9 h-9 flex items-center justify-center bg-background/60 backdrop-blur-md">
                <ShareButton productName={resolveName(product, locale)} />
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 bg-background -mt-6 min-h-[65vh]">
          <div className="flex justify-center pt-3 pb-2">
            <span className="w-8 h-px bg-border" />
          </div>
          <ProductInfoPanel product={product} detail={detail} compact locale={locale} t={t} />
        </div>
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox images={allImages} initialIndex={lightboxIndex} productName={resolveName(product, locale)} open onClose={closeLightbox} />
      )}
    </>
  );
}
