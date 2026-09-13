'use client';
import { useTranslations } from 'next-intl';

export default function DeliveryRow({ inStock }: { inStock: boolean }) {
  const t = useTranslations('productDetail');
  return (
    <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="tracking-wide">
        {inStock ? t('inStock') : t('outOfStock')}
      </span>
    </div>
  );
}
