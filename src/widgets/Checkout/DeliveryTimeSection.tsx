'use client';

import { Clock, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface DeliveryTimeSectionProps {
  scheduledFor: Date | null;
  setScheduledFor: (date: Date | null) => void;
}

export default function DeliveryTimeSection({ scheduledFor, setScheduledFor }: DeliveryTimeSectionProps) {
  const t = useTranslations('checkout');
  const [isAsap, setIsAsap] = useState(!scheduledFor);

  const handleAsapClick = () => {
    setIsAsap(true);
    setScheduledFor(null);
  };

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('deliveryTime')}</h2>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleAsapClick}
          className={`flex-1 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
            isAsap
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Clock size={16} />
            {t('asap')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setIsAsap(false)}
          className={`flex-1 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
            !isAsap
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Calendar size={16} />
            {t('schedule')}
          </span>
        </button>
      </div>

      {!isAsap && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            {t('selectDateTime')}
          </label>
          <input
            required
            type="datetime-local"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
            onChange={(e) =>
              setScheduledFor(e.target.value ? new Date(e.target.value) : null)
            }
          />
        </div>
      )}
    </section>
  );
}