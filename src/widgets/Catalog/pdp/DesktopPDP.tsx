'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import ProductInfoPanel from '@/widgets/Catalog/pdp/ProductInfoPanel';
import ClassicGallery from '@/widgets/Catalog/pdp/ClassicGallery';
import ThumbnailsLeftGallery from '@/widgets/Catalog/pdp/ThumbnailsLeftGallery';
import StackedGridGallery from '@/widgets/Catalog/pdp/StackedGridGallery';
import LookbookGallery from '@/widgets/Catalog/pdp/LookbookGallery';
import ImageLightbox from '@/widgets/Catalog/pdp/ImageLightbox';
import type { ProductDetailData } from '@/widgets/Catalog/useProductDetail';
import type { MenuItem } from '@/entities/menu-item/types';
import { resolveName } from '@/shared/lib/localization';

interface DesktopPDPProps {
  product: MenuItem;
  locale: string;
  branchSlug: string;
  pdpGalleryLayout: string;
  allImages: string[];
  detail: ProductDetailData;
  t: ReturnType<() => any>;
}

export default function DesktopPDP({
  product,
  locale,
  branchSlug,
  pdpGalleryLayout,
  allImages,
  detail,
  t,
}: DesktopPDPProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const openLightbox = useCallback((idx: number) => setLightboxIndex(idx), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const breadcrumb = (
    <nav className="flex items-center gap-2.5 text-[10px] tracking-widest uppercase text-muted-foreground mb-12">
      <Link
        href={`/${locale}/${branchSlug}/catalog`}
        className="hover:text-foreground transition-colors"
      >
        {t('backToCatalog')}
      </Link>
      <span>/</span>
      <span className="text-foreground truncate max-w-[260px]">{resolveName(product, locale)}</span>
    </nav>
  );

  const infoPanel = <ProductInfoPanel product={product} detail={detail} locale={locale} t={t} />;
  const stickyInfo = <div className="sticky top-4 h-fit">{infoPanel}</div>;

  // ── thumbnails-left: [thumbnails | main-image | info] ─────────────────
  if (pdpGalleryLayout === 'thumbnails-left') {
    return (
      <>
        <div className="hidden lg:block">
          <div className="max-w-[1400px] mx-auto px-12 py-10">
            {breadcrumb}
            <div className="grid grid-cols-[80px_1fr_420px] xl:grid-cols-[88px_1fr_460px] gap-6 items-start">
              <ThumbnailsLeftGallery images={allImages} productName={resolveName(product, locale)} onSelectImage={openLightbox} />
              {stickyInfo}
            </div>
          </div>
        </div>
        {lightboxIndex !== null && (
          <ImageLightbox images={allImages} initialIndex={lightboxIndex} productName={resolveName(product, locale)} open onClose={closeLightbox} />
        )}
      </>
    );
  }

  // ── classic / stacked-grid / lookbook: 2-column grid [gallery | info] ─
  const Gallery =
    pdpGalleryLayout === 'stacked-grid' ? StackedGridGallery :
    pdpGalleryLayout === 'lookbook' ? LookbookGallery :
    ClassicGallery;

  return (
    <>
      <div className="hidden lg:block">
        <div className="max-w-[1400px] mx-auto px-12 py-10">
          {breadcrumb}
          <div className="grid grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px] gap-20 items-start">
            <div>
              <Gallery images={allImages} productName={resolveName(product, locale)} onSelectImage={openLightbox} />
            </div>
            {stickyInfo}
          </div>
        </div>
      </div>
      {lightboxIndex !== null && (
        <ImageLightbox images={allImages} initialIndex={lightboxIndex} productName={resolveName(product, locale)} open onClose={closeLightbox} />
      )}
    </>
  );
}
