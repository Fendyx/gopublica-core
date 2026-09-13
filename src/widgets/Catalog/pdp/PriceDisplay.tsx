'use client';
import { useTranslations } from 'next-intl';

export interface PriceDisplayProps {
  showPrice: boolean;
  displayPrice?: number | null;
  compareAtPrice?: number | null;
  hasDiscount: boolean;
  discountPercent: number;
  currencySymbol: string;
}

export default function PriceDisplay({
  showPrice,
  displayPrice,
  compareAtPrice,
  hasDiscount,
  discountPercent,
  currencySymbol,
}: PriceDisplayProps) {
  const t = useTranslations('productDetail');
  if (!showPrice) {
    return (
      <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
        {t('noPrice')}
      </p>
    );
  }

  return (
    <div className="flex items-baseline gap-3 flex-wrap">
      <span className={`text-2xl font-bold ${hasDiscount ? 'text-destructive' : 'text-foreground'}`}>
        {displayPrice}&nbsp;{currencySymbol}
      </span>
      {hasDiscount && (
        <>
          <span className="text-base text-muted-foreground line-through">
            {compareAtPrice}&nbsp;{currencySymbol}
          </span>
          <span className="text-[9px] tracking-widest uppercase px-2 py-0.5 border border-destructive text-destructive">
            −{discountPercent}%
          </span>
        </>
      )}
    </div>
  );
}
