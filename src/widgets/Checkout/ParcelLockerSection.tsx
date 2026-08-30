'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useTenant } from '@/entities/tenant/TenantContext';
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
  const tenant = useTenant();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptFailed, setScriptFailed] = useState(false);

  // Derive Furgonetka config from tenant logistics settings
  const logistics = tenant?.logistics;
  const isFurgonetkaActive = logistics?.enabled === true && logistics?.provider === 'furgonetka';
  const mapApiKey = logistics?.mapApiKey || '';
  const mapEnv = logistics?.env || 'sandbox';

  // Debug: verify logistics data reaches the component
  console.log('DEBUG Tenant Logistics:', {
    raw: tenant?.logistics,
    isFurgonetkaActive,
    mapApiKey: mapApiKey ? `${mapApiKey.substring(0, 20)}...` : '(empty)',
    mapEnv,
  });

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
        setScriptFailed(false);
        setIsLoading(false);
      };
      
      script.onerror = () => {
        console.warn(
          '⚠️ Furgonetka map script failed to load. ' +
          'This is expected on localhost / non-production domains. ' +
          'The map will not work in this environment.'
        );
        setScriptFailed(true);
        setIsLoading(false);
        // Don't set error here — show it only when the user tries to open the map
      };

      document.head.appendChild(script);
    }
  }, [t]);

  const openMap = (carrierIds: string[] = ALL_CARRIER_IDS) => {
    // Clear any previous error
    setError(null);

    // Check if Furgonetka is configured at all
    if (!isFurgonetkaActive || !mapApiKey) {
      setError('Parcel locker selection is not available for this store.');
      return;
    }

    // Check if the script failed to load (e.g. on localhost)
    // @ts-ignore – Furgonetka is injected by their map script at runtime
    if (scriptFailed || !window.Furgonetka || !window.Furgonetka.Map) {
      const isDev = typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
      );
      setError(
        isDev
          ? 'Parcel locker map is unavailable in development (localhost). Furgonetka restricts map access to production domains. Deploy to your production domain to test this feature.'
          : t('alerts.mapError')
      );
      return;
    }

    try {
      // @ts-ignore
      const mapWidget = new window.Furgonetka.Map({
        apiKey: mapApiKey,
        env: mapEnv,
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
      console.error("Error opening parcel locker map:", err);
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