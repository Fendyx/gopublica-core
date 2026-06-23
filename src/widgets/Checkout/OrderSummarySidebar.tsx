'use client';

import { Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCartStore } from '@/shared/store/cartStore';

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
  
  // Достаем функции для управления корзиной
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('yourOrder')}</h3>

      {/* Список товаров с управлением количеством */}
      <ul className="space-y-3 mb-5 max-h-[350px] overflow-y-auto pr-1 -mr-1">
        {items.map((item) => (
          <li key={item.uid} className="flex flex-col gap-2 p-3 border border-gray-100 rounded-xl bg-gray-50/50">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-gray-800 font-medium text-sm block truncate">
                  {item.name}
                </span>
                
                {/* Отображение модификаторов (если есть) */}
                {item.modifiers && item.modifiers.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {item.modifiers.map((mod: any) => (
                      <li key={mod.optionId} className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="text-gray-400">•</span>
                        <span>{mod.optionName}</span>
                        {mod.priceImpact > 0 && (
                          <span className="text-gray-400">(+{mod.priceImpact.toFixed(2)} {currencySymbol})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Отображение комментария (если есть) */}
                {item.notes && (
                  <p className="text-xs text-gray-400 italic mt-1 truncate">
                    ✎ {item.notes}
                  </p>
                )}
              </div>

              <span className="text-gray-800 font-semibold text-sm whitespace-nowrap">
                {(item.price * item.quantity).toFixed(2)} {currencySymbol}
              </span>
            </div>

            {/* Контролы управления количеством и удалением */}
            <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-100 border-dashed">
              <div className="flex items-center gap-1 border border-gray-200 rounded-full p-1 bg-white shadow-sm">
                <button 
                  onClick={() => updateQuantity(item.uid, item.quantity - 1)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
                  aria-label="Уменьшить количество"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-semibold w-6 text-center text-gray-800">
                  {item.quantity}
                </span>
                <button 
                  onClick={() => updateQuantity(item.uid, item.quantity + 1)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
                  aria-label="Увеличить количество"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button 
                onClick={() => removeItem(item.uid)}
                className="p-2 rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                aria-label="Удалить товар"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Расчеты стоимости */}
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