import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import Hero from '@/widgets/Hero';
import About from '@/widgets/About/About';
import CatalogClient from '@/widgets/Catalog/CatalogClient';
import GalleryClient from '@/widgets/Gallery/GalleryClient';
import BookingSection from '@/widgets/Booking/BookingSection';
import Contact from '@/widgets/About/Contact';
import ServiceBookingWizard from '@/widgets/ServiceBooking/ServiceBookingWizard';
import BeforeAfterSlider from '@/widgets/Gallery/BeforeAfterSlider';
import AnimatedSection from '@/shared/ui/AnimatedSection';
import { getTenantByDomain } from '@/entities/tenant/api';

// 👇 Добавляем импорт нашего нового виджета
import BranchCrossLink from '@/widgets/BranchCrossLink/BranchCrossLink';

export const dynamic = 'force-dynamic';

export default async function TenantHomePage({
  params,
}: {
  params: { tenantDomain: string; locale: string };
}) {
  const t = await getTranslations('homePage');
  const headersList = await headers();
  const host = headersList.get('host') ?? params.tenantDomain;
  const tenant = await getTenantByDomain(host);

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl">{t('siteNotFound')}</h1>
      </div>
    );
  }

  const isEcommerce = tenant.niche === 'ecommerce';

  return (
    <>
      <Hero />

      {tenant?.niche === 'auto' && (
        <AnimatedSection>
          <ServiceBookingWizard />
        </AnimatedSection>
      )}

      {tenant?.niche === 'auto' && (
        <AnimatedSection className="container mx-auto px-4 py-8">
          <BeforeAfterSlider className="max-w-4xl mx-auto" />
        </AnimatedSection>
      )}

      {/* {!isEcommerce && (
        <AnimatedSection>
          <About />
        </AnimatedSection>
      )} */}

      {tenant.features.hasMenu && (
        <AnimatedSection>
          <CatalogClient />
        </AnimatedSection>
      )}

      {tenant.features.hasGallery && (
        <AnimatedSection>
          <GalleryClient />
        </AnimatedSection>
      )}

      {tenant.features.hasBooking && (
        <AnimatedSection>
          <BookingSection />
        </AnimatedSection>
      )}

      {/* 👇 Оборачиваем в AnimatedSection для красивого эффекта при скролле */}
      <AnimatedSection>
        <BranchCrossLink />
      </AnimatedSection>

      {!isEcommerce && (
        <AnimatedSection>
          <Contact />
        </AnimatedSection>
      )}
    </>
  );
}