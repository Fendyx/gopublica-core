'use client';
import { BranchSection } from '@/entities/branch-section/types';
import BookingForm from '@/features/reservation/BookingForm';

interface BookingSectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
}

export default function BookingSection({ section, locale, tenantDomain }: BookingSectionProps) {
  const title = section.translations?.[locale]?.title;
  const subtitle = section.translations?.[locale]?.subtitle;

  return (
    <section className="py-12 bg-surface-page">
      <BookingForm title={title} subtitle={subtitle} />
    </section>
  );
}
