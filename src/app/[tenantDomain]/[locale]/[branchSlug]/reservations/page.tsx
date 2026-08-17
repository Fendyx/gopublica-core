// src/app/[tenantDomain]/[locale]/[branchSlug]/reservations/page.tsx
import BookingForm from '@/features/reservation/BookingForm';

export default function TenantReservationsPage() {
  return (
    <main className="pb-16">
      <BookingForm />
    </main>
  );
}
