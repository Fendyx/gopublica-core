'use client';
import { BranchSection } from '@/entities/branch-section/types';
import { useBranchSettings } from '@/entities/branch/useBranchSettings';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

interface SystemContactsSectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
  branchSlug?: string;
}

export default function SystemContactsSection({ section }: SystemContactsSectionProps) {
  const { address, phone, email, hours, googleMapsUrl, loading } = useBranchSettings();

  if (loading) {
    return <div className="py-10 text-center text-muted-foreground">Loading contacts…</div>;
  }

  const hasAnyInfo = address || phone || email || hours;

  if (!hasAnyInfo) return null;

  return (
    <section id="contact" className="py-10 lg:py-16 bg-surface-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold mb-8 text-foreground">Contact</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-muted-foreground">{address}</p>
                </div>
              </div>
            )}
            {phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Phone</p>
                  <a href={`tel:${phone}`} className="text-muted-foreground hover:text-primary transition-colors">
                    {phone}
                  </a>
                </div>
              </div>
            )}
            {email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Email</p>
                  <a href={`mailto:${email}`} className="text-muted-foreground hover:text-primary transition-colors">
                    {email}
                  </a>
                </div>
              </div>
            )}
            {hours && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Working Hours</p>
                  <p className="text-muted-foreground whitespace-pre-line">{hours}</p>
                </div>
              </div>
            )}
          </div>
          {googleMapsUrl && (
            <div className="rounded-xl overflow-hidden border aspect-video">
              <iframe
                src={googleMapsUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
