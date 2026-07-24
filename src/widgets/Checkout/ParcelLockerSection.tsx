'use client';

import { useEffect, useState } from 'react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scriptId = 'furgonetka-map-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    // Проверяем, есть ли уже скрипт (защита от двойной загрузки)
    if (script) {
      if (script.getAttribute('data-loaded') === 'true') {
        setIsLoading(false);
      } else {
        script.addEventListener('load', () => setIsLoading(false));
      }
    } else {
      // Подключаем новый правильный скрипт из доки
      script = document.createElement('script');
      script.id = scriptId;
      script.src = "https://furgonetka.pl/js/dist/map/map.js";
      script.async = true;
      
      script.onload = () => {
        script.setAttribute('data-loaded', 'true');
        setIsLoading(false);
      };
      
      script.onerror = () => {
        setError("Не удалось загрузить скрипт карты с серверов Furgonetka");
        setIsLoading(false);
      };

      document.head.appendChild(script);
    }
  }, []);

  const openMap = () => {
    // @ts-ignore
    if (!window.Furgonetka || !window.Furgonetka.Map) {
      setError("Скрипт карты еще не инициализирован. Попробуйте через секунду.");
      return;
    }

    try {
      // Инициализируем карту по новой документации
      // @ts-ignore
      const mapWidget = new window.Furgonetka.Map({
        apiKey: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJGdXJnb25ldGthLnBsIiwiaWF0IjoxNzg0ODUyODQ5Ljc4MTE4NSwic3ViIjoiMzI3N2JmYjMtNGEyZi00ODY4LTlkMzctNzI0MzRlOTQ1NWZhIn0.LhOEqrkq-8LqWzWVyrd9DKem9d6RlBe8lw0ExG5VjhQ',
        env: 'sandbox', // <--- ВОТ ЭТОТ ПАРАМЕТР
        courierServices: ['inpost', 'orlen', 'dpd', 'poczta'], // Доступные курьеры
        callback: (params: any) => {
          console.log('Покупатель выбрал пункт:', params);
          
          // Сохраняем данные (API возвращает код в params.point.code)
          onSelect({
            id: params.point.code,
            network: params.point.name,
            address: {
              street: params.point.street,
              city: params.point.city,
              zip: params.point.postcode
            }
          });
        },
      });

      // Открываем модалку
      mapWidget.show();

    } catch (err) {
      console.error("Ошибка при открытии карты:", err);
      setError("Ошибка при запуске виджета Furgonetka.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-medium text-gray-900">Выберите пункт выдачи</h3>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Если пачкомат уже выбран - показываем его ID и кнопку изменения */}
      {selectedLockerId ? (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
          <div>
            <p className="text-sm text-blue-600 mb-0.5">Выбранный пачкомат:</p>
            <p className="font-bold text-lg text-blue-900">{selectedLockerId}</p>
          </div>
          <button 
            type="button"
            onClick={openMap}
            className="text-sm bg-white border border-blue-200 px-4 py-2 rounded-md text-blue-700 hover:bg-blue-100 transition-colors font-medium"
          >
            Изменить
          </button>
        </div>
      ) : (
        /* Если ничего не выбрано - показываем большую кнопку призыва к действию */
        <button
          type="button"
          onClick={openMap}
          disabled={isLoading}
          className="w-full py-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-2 font-medium"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">Загрузка виджета карты...</span>
          ) : (
            <span className="flex items-center gap-2">📍 Открыть карту пачкоматов</span>
          )}
        </button>
      )}
    </div>
  );
}