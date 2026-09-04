'use client';
import { useState } from 'react';
import { BranchSection, ContactBlockSettings } from '@/entities/branch-section/types';
import { useBranchSettings } from '@/entities/branch/useBranchSettings';
import { MapPin, Phone, Mail, Send } from 'lucide-react';

interface ContactBlockSectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
  branchSlug?: string;
}

export default function ContactBlockSection({ section }: ContactBlockSectionProps) {
  const { address, phone, email, googleMapsUrl } = useBranchSettings();
  const settings = (section.settings || {}) as ContactBlockSettings;

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const formFields = settings.formFields || ['name', 'email', 'message'];
  const mapAddress = settings.mapAddress || address || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/forms/${section._id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId: section._id, data: formData }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Form submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderFormField = (field: string) => {
    switch (field) {
      case 'name':
        return (
          <input
            key="name"
            type="text"
            placeholder="Your name"
            value={formData.name || ''}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-2.5 border rounded-lg bg-background text-foreground"
            required
          />
        );
      case 'email':
        return (
          <input
            key="email"
            type="email"
            placeholder="Email address"
            value={formData.email || ''}
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-4 py-2.5 border rounded-lg bg-background text-foreground"
            required
          />
        );
      case 'phone':
        return (
          <input
            key="phone"
            type="tel"
            placeholder="Phone number"
            value={formData.phone || ''}
            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-4 py-2.5 border rounded-lg bg-background text-foreground"
          />
        );
      case 'message':
        return (
          <textarea
            key="message"
            placeholder="Your message"
            value={formData.message || ''}
            onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
            className="w-full px-4 py-2.5 border rounded-lg bg-background text-foreground min-h-[120px]"
            required
          />
        );
      default:
        return null;
    }
  };

  const contactInfo = (
    <div className="space-y-4">
      {address && (
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <p className="text-muted-foreground">{address}</p>
        </div>
      )}
      {phone && (
        <div className="flex items-start gap-3">
          <Phone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <a href={`tel:${phone}`} className="text-muted-foreground hover:text-primary">{phone}</a>
        </div>
      )}
      {email && (
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <a href={`mailto:${email}`} className="text-muted-foreground hover:text-primary">{email}</a>
        </div>
      )}
      {settings.customText && (
        <p className="text-muted-foreground mt-4">{settings.customText}</p>
      )}
    </div>
  );

  const contactForm = settings.showForm !== false && !submitted ? (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formFields.map(renderFormField)}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
        {submitting ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  ) : submitted ? (
    <div className="text-center py-8">
      <p className="text-lg font-medium text-green-600">Thank you! Your message has been sent.</p>
    </div>
  ) : null;

  const mapEmbed = settings.showMap !== false && mapAddress ? (
    <div className="rounded-xl overflow-hidden border aspect-video">
      <iframe
        src={`https://www.google.com/maps?q=${encodeURIComponent(mapAddress)}&output=embed`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
      />
    </div>
  ) : null;

  // Layout based on preset
  const preset = settings.preset || 'split_layout';

  if (preset === 'map_and_form') {
    return (
      <section className="py-10 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {mapEmbed && <div>{mapEmbed}</div>}
            <div className="space-y-6">
              {contactInfo}
              {contactForm}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (preset === 'simple_info') {
    return (
      <section className="py-10 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto space-y-8">
            {contactInfo}
            {mapEmbed}
          </div>
        </div>
      </section>
    );
  }

  // split_layout (default)
  return (
    <section className="py-10 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {contactInfo}
            {mapEmbed}
          </div>
          {contactForm}
        </div>
      </div>
    </section>
  );
}
