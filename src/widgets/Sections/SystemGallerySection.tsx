'use client';
import { useEffect, useState } from 'react';
import { BranchSection } from '@/entities/branch-section/types';
import { useTenant } from '@/entities/tenant/TenantContext';
import Gallery from '@/widgets/Gallery/Gallery';
import type { GalleryItem } from '@/entities/gallery/types';

interface SystemGallerySectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
  branchSlug?: string;
}

export default function SystemGallerySection({ section }: SystemGallerySectionProps) {
  const tenant = useTenant();
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const tenantId = tenant?.tenantId;
  const branchId = (section as any).branchId;
  const galleryStyle = (tenant?.theme?.galleryStyle as 'bento' | 'masonry') || 'bento';

  useEffect(() => {
    if (!tenantId) return;

    const params = new URLSearchParams({ tenantId });
    if (branchId) params.set('branchId', branchId);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/gallery?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        setImages(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tenantId, branchId]);

  if (loading) {
    return <div className="py-10 text-center text-muted-foreground">Loading gallery…</div>;
  }

  if (!images.length) return null;

  return (
    <section id="gallery" className="py-10 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Gallery images={images} galleryStyle={galleryStyle} />
      </div>
    </section>
  );
}
