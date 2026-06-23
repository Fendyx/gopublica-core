import { headers } from 'next/headers';
import Hero from '@/widgets/Hero';
import About from '@/widgets/About/About';
import CatalogClient from '@/widgets/Catalog/CatalogClient'; // <--- ЗАМЕНИЛИ MenuClient на CatalogClient
import GalleryClient from '@/widgets/Gallery/GalleryClient';
import BookingSection from '@/widgets/Booking/BookingSection';
import Contact from '@/widgets/About/Contact';
import { getTenantByDomain } from '@/entities/tenant/api';

export const dynamic = 'force-dynamic';

export default async function TenantHomePage({
  params,
}: {
  params: { tenantDomain: string; locale: string };
}) {
  const headersList = await headers();
  const host = headersList.get('host') ?? params.tenantDomain;
  const tenant = await getTenantByDomain(host);

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl">Сайт не найден</h1>
      </div>
    );
  }

  return (
    <>
      <Hero />
      <About />
      {/* Используем умный каталог, он сам решит, что рендерить */}
      {tenant.features.hasMenu && <CatalogClient />}
      {tenant.features.hasGallery && <GalleryClient />}
      {tenant.features.hasBooking && <BookingSection />}
      <Contact />
    </>
  );
}