import { Clock, Calendar } from 'lucide-react';
import { useState } from 'react';

interface DeliveryTimeSectionProps {
  scheduledFor: Date | null;
  setScheduledFor: (date: Date | null) => void;
}

export default function DeliveryTimeSection({ scheduledFor, setScheduledFor }: DeliveryTimeSectionProps) {
  // Локальный стейт, чтобы понимать, выбран ли режим "Как можно скорее"
  const [isAsap, setIsAsap] = useState(!scheduledFor);

  const handleAsapClick = () => {
    setIsAsap(true);
    setScheduledFor(null); // Сбрасываем дату в оркестраторе
  };

  return (
    <div className="bg-surface-card rounded-2xl shadow-card p-6 border border-border">
      <h2 className="text-xl font-semibold mb-6">1. Время получения</h2>

      {/* Кнопки выбора режима */}
      <div className="flex gap-3 mb-4">
        <button
          type="button"
          onClick={handleAsapClick}
          className={`flex-1 p-3 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2 ${
            isAsap 
              ? 'border-primary bg-primary/10 text-primary' 
              : 'border-border text-text-secondary hover:border-border-light'
          }`}
        >
          <Clock size={18} />
          Как можно скорее
        </button>
        
        <button
          type="button"
          onClick={() => setIsAsap(false)}
          className={`flex-1 p-3 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2 ${
            !isAsap 
              ? 'border-primary bg-primary/10 text-primary' 
              : 'border-border text-text-secondary hover:border-border-light'
          }`}
        >
          <Calendar size={18} />
          Запланировать
        </button>
      </div>

      {/* Инпут для выбора конкретного времени (показываем только если не ASAP) */}
      {!isAsap && (
        <div className="animate-in fade-in zoom-in-95 duration-200 mt-4">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Выберите дату и время
          </label>
          <input
            required={!isAsap} // Делаем обязательным только если выбрали "Запланировать"
            type="datetime-local"
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface-page text-text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            onChange={(e) =>
              setScheduledFor(e.target.value ? new Date(e.target.value) : null)
            }
          />
        </div>
      )}
    </div>
  );
}