'use client';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import RelatedProducts from '@/widgets/Catalog/RelatedProducts';
import MobilePDP from '@/widgets/Catalog/pdp/MobilePDP';
import DesktopPDP from '@/widgets/Catalog/pdp/DesktopPDP';
import { useProductDetail } from '@/widgets/Catalog/useProductDetail';
import type { MenuItem } from '@/entities/menu-item/types';

export default function ProductDetail({
  product,
  locale,
  tenant,
}: {
  product: MenuItem;
  locale: string;
  tenant: any;
}) {
  const t = useTranslations('productDetail');
  const { branchSlug } = useParams();
  const detail = useProductDetail(product, locale, tenant);
  const pdpGalleryLayout = tenant.theme?.pdpGalleryLayout ?? 'classic';

  return (
    <div>
      <MobilePDP
        product={product}
        locale={locale}
        branchSlug={branchSlug as string}
        allImages={detail.allImages}
        detail={detail}
        t={t}
      />

      <DesktopPDP
        product={product}
        locale={locale}
        branchSlug={branchSlug as string}
        pdpGalleryLayout={pdpGalleryLayout}
        allImages={detail.allImages}
        detail={detail}
        t={t}
      />

      {product._id && <RelatedProducts productId={product._id} />}
    </div>
  );
}