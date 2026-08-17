import ServiceBookingWizard from '@/widgets/ServiceBooking/ServiceBookingWizard';

export const dynamic = 'force-dynamic';

export default function BookingPage() {
  return (
    <main className="container mx-auto py-12 px-4 min-h-screen">
      <ServiceBookingWizard />
    </main>
  );
}
