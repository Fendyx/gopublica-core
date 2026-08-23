'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Box, Fuel, Truck, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ParcelLocker {
  id: string;
  network?: string;
  address?: {
    street?: string;
    city?: string;
    zip?: string;
  };
}

interface Props {
  onSelect: (locker: ParcelLocker) => void;
  selectedLockerId?: string;
}

// IDs must match Furgonetka courier service identifiers (see furgonetka.pl/api/mapa).
const CARRIERS: { id: string; labelKey: string; Icon: LucideIcon }[] = [
  { id: 'inpost', labelKey: 'carrierInpost', Icon: Box },
  { id: 'orlen', labelKey: 'carrierOrlen', Icon: Fuel },
  { id: 'dpd', labelKey: 'carrierDpd', Icon: Truck },
];

const ALL_CARRIER_IDS = CARRIERS.map((c) => c.id);

export default function ParcelLockerSection({ onSelect, selectedLockerId }: Props) {
  const t = useTranslations('checkout');
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scriptId = 'furgonetka-map-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (script) {
      if (script.getAttribute('data-loaded') === 'true') {
        setIsLoading(false);
      } else {
        script.addEventListener('load', () => setIsLoading(false));
      }
    } else {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = "https://furgonetka.pl/js/dist/map/map.js";
      script.async = true;
      
      script.onload = () => {
        script.setAttribute('data-loaded', 'true');
        setIsLoading(false);
      };
      
      script.onerror = () => {
        setError(t('alerts.mapError'));
        setIsLoading(false);
      };

      document.head.appendChild(script);
    }
  }, [t]);

  const openMap = (carrierIds: string[] = ALL_CARRIER_IDS) => {
    // @ts-ignore
    if (!window.Furgonetka || !window.Furgonetka.Map) {
      setError(t('loadingMap'));
      return;
    }

    try {
      // @ts-ignore
      const mapWidget = new window.Furgonetka.Map({
        apiKey: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJGdXJnb25ldGthLnBsIiwiaWF0IjoxNzg0ODUzOTQwLjIxOTU3Mywic3ViIjoiMzI3N2JmYjMtNGEyZi00ODY4LTlkMzctNzI0MzRlOTQ1NWZhIn0.decVno3WQFqsgy3kL6sVmyNH95C35B_GVeci15t5YFk',
        env: 'sandbox',
        courierServices: carrierIds,
        courierServicesFilter: carrierIds,
        locale,
        callback: (params: any) => {
          onSelect({
            id: params.point.code,
            network: params.point.type || 'unknown',
            address: {
              street: params.point.name,
              city: params.point.city,
              zip: params.point.postcode
            }
          });
        },
      });

      mapWidget.show();

    } catch (err) {
      console.error("Ошибка при открытии карты:", err);
      setError(t('alerts.mapError'));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-medium text-gray-900">{t('selectLocker')}</h3>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
          {error}
        </div>
      )}

      {selectedLockerId ? (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
          <div>
            <p className="text-sm text-blue-600 mb-0.5">{t('selectedLocker')}</p>
            <p className="font-bold text-lg text-blue-900">{selectedLockerId}</p>
          </div>
          <button 
            type="button"
            onClick={() => openMap()}
            className="text-sm bg-white border border-blue-200 px-4 py-2 rounded-md text-blue-700 hover:bg-blue-100 transition-colors font-medium"
          >
            {t('change')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CARRIERS.map(({ id, labelKey, Icon }) => (
              <Card
                key={id}
                role="button"
                tabIndex={0}
                aria-disabled={isLoading}
                onClick={() => !isLoading && openMap([id])}
                onKeyDown={(e) => {
                  if (!isLoading && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    openMap([id]);
                  }
                }}
                className="cursor-pointer items-center justify-center gap-2 py-6 text-center transition-all duration-150 hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 aria-disabled:pointer-events-none aria-disabled:opacity-50"
              >
                <Icon size={24} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-900">{t(labelKey)}</span>
              </Card>
            ))}
          </div>

          <button
            type="button"
            onClick={() => openMap()}
            disabled={isLoading}
            className="self-center text-sm text-gray-500 underline underline-offset-4 hover:text-blue-600 transition-colors"
          >
            {isLoading ? t('loadingMap') : t('showAllCarriers')}
          </button>
        </div>
      )}
    </div>
  );
}