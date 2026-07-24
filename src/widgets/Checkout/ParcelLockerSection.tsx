'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

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

export default function ParcelLockerSection({ onSelect, selectedLockerId }: Props) {
  const t = useTranslations('checkout');
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

  const openMap = () => {
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
        courierServices: ['inpost', 'orlen', 'dpd', 'poczta'], 
        callback: (params: any) => {
          onSelect({
            id: params.point.code,
            network: params.service || params.provider || params.point.operator || 'inpost', 
            address: {
              street: params.point.street || params.point.name, 
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
            onClick={openMap}
            className="text-sm bg-white border border-blue-200 px-4 py-2 rounded-md text-blue-700 hover:bg-blue-100 transition-colors font-medium"
          >
            {t('change')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openMap}
          disabled={isLoading}
          className="w-full py-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-2 font-medium"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">{t('loadingMap')}</span>
          ) : (
            <span className="flex items-center gap-2">{t('openMap')}</span>
          )}
        </button>
      )}
    </div>
  );
}