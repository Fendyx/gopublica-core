'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface OrderSummarySidebarProps {
  items: any[];
  subtotal: number;
  fees: any;
  estimating: boolean;
  deliveryFee: number;
  fulfillmentType: 'pickup' | 'delivery';
  currencySymbol: string;
}

export default function OrderSummarySidebar({
  items,
  subtotal,
  fees,
  estimating,
  deliveryFee,
  fulfillmentType,
  currencySymbol,
}: OrderSummarySidebarProps) {
  const t = useTranslations('checkout');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('yourOrder')}</h3>

      <ul className="space-y-2 mb-5 max-h-48 overflow-y-auto pr-1">
        {items.map((item: any) => (
          <li key={item.menuItemId} className="flex justify-between text-sm">
            <span className="text-gray-600 truncate">
              <span className="inline-block min-w-[20px] text-center bg-gray-100 rounded text-xs font-medium text-gray-700 mr-2">
                {item.quantity}
              </span>
              {item.name}
            </span>
            <span className="text-gray-800 font-medium ml-2">
              {(item.price * item.quantity).toFixed(2)} {currencySymbol}
            </span>
          </li>
        ))}
      </ul>

      <div className="space-y-2 text-sm text-gray-500 border-t border-gray-100 pt-4">
        <div className="flex justify-between">
          <span>{t('subtotal')}</span>
          <span className="text-gray-800">{subtotal.toFixed(2)} {currencySymbol}</span>
        </div>
        {fulfillmentType === 'delivery' && (
          <div className="flex justify-between">
            <span>{t('delivery')}</span>
            <span className="text-gray-800">{deliveryFee.toFixed(2)} {currencySymbol}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>{t('serviceFee')}</span>
          {estimating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <span className="text-gray-800">{fees?.serviceFee?.toFixed(2) || '—'} {currencySymbol}</span>
          )}
        </div>
        <div className="flex justify-between font-bold text-base text-gray-900 pt-3 border-t border-gray-100 mt-2">
          <span>{t('total')}</span>
          {estimating ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <span className="text-primary text-lg">{fees?.total?.toFixed(2) || '—'} {currencySymbol}</span>
          )}
        </div>
      </div>
    </div>
  );
}