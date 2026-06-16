'use client';

import { useState } from 'react';
import { Loader2, AlertCircle, Lock, CreditCard, ShieldCheck, BadgeCheck } from 'lucide-react';
import { PaymentElement } from '@stripe/react-stripe-js';

// ─── Хелперы для UI ────────────────────────────────────────────────────────
function TrustBadge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
      <Icon size={14} className="shrink-0 text-green-600" />
      {label}
    </span>
  );
}

// ─── Главный компонент ───────────────────────────────────────────────────────
interface OrderSummarySidebarProps {
  items: any[];
  subtotal: number;
  fees: any;
  estimating: boolean;
  deliveryFee: number;
  fulfillmentType: 'pickup' | 'delivery';
  currencySymbol: string;
  loading: boolean;
  error: string | null;
  stripeLoaded: boolean;
}

export default function OrderSummarySidebar({
  items,
  subtotal,
  fees,
  estimating,
  deliveryFee,
  fulfillmentType,
  currencySymbol,
  loading,
  error,
  stripeLoaded,
}: OrderSummarySidebarProps) {
  const [paymentElementValid, setPaymentElementValid] = useState(false);

  return (
    <div className="bg-surface-card rounded-3xl shadow-card border border-border p-6 lg:p-8">
      {/* --- СПИСОК БЛЮД И СУММА --- */}
      <h3 className="text-xl font-bold text-text-primary mb-6">Ваш заказ</h3>

      <div className="space-y-4 mb-6 max-h-[30vh] overflow-y-auto pr-2">
        {items.map((item: any) => (
          <div key={item.menuItemId} className="flex justify-between text-sm">
            <span className="text-text-secondary">
              <span className="inline-block min-w-[24px] text-center bg-surface-hover rounded text-text-primary font-medium px-1.5 py-0.5 mr-3 text-xs">
                {item.quantity}
              </span>
              {item.name}
            </span>
            <span className="text-text-primary font-medium">
              {(item.price * item.quantity).toFixed(2)} {currencySymbol}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-3 text-sm text-text-secondary border-t border-border-light pt-5 mb-8">
        <div className="flex justify-between">
          <span>Сумма блюд</span>
          <span className="font-medium text-text-primary">{subtotal.toFixed(2)} {currencySymbol}</span>
        </div>
        {fulfillmentType === 'delivery' && (
          <div className="flex justify-between">
            <span>Доставка</span>
            <span className="font-medium text-text-primary">{deliveryFee.toFixed(2)} {currencySymbol}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span>Сервисный сбор</span>
          {estimating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <span className="font-medium text-text-primary">
              {fees?.serviceFee?.toFixed(2) || '—'} {currencySymbol}
            </span>
          )}
        </div>
        <div className="flex justify-between font-extrabold text-xl text-text-primary pt-3 border-t border-border-light mt-3">
          <span>Итого</span>
          {estimating ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <span className="text-primary">
              {fees?.total?.toFixed(2) || '—'} {currencySymbol}
            </span>
          )}
        </div>
      </div>

      {/* --- БЛОК ОПЛАТЫ (PaymentElement) --- */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard size={14} className="text-text-tertiary" />
          <span className="text-sm font-semibold text-text-primary">Способ оплаты</span>
        </div>

        <div className="rounded-xl border border-border bg-surface-page p-4 shadow-sm">
          <PaymentElement
            id="payment-element"
            onChange={(event) => {
              setPaymentElementValid(event.complete);
            }}
            options={{
              layout: 'tabs', // или 'auto'
              defaultValues: {
                billingDetails: {
                  name: '', // будет передано при подтверждении
                },
              },
            }}
          />
        </div>
      </div>

      {/* --- ОШИБКИ --- */}
      {error && (
        <div className="mb-6 flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* --- КНОПКА --- */}
      <button
        type="submit"
        disabled={!stripeLoaded || !fees || loading || !paymentElementValid}
        className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        <Lock size={18} />
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Обработка...
          </>
        ) : fees ? (
          `Оплатить ${fees.total.toFixed(2)} ${currencySymbol}`
        ) : (
          'Оформить заказ'
        )}
      </button>

      {/* --- TRUST BADGES --- */}
      <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
        <TrustBadge icon={ShieldCheck} label="SSL Secured" />
        <span className="text-border text-lg leading-none">·</span>
        <TrustBadge icon={Lock} label="Powered by Stripe" />
        <span className="text-border text-lg leading-none">·</span>
        <TrustBadge icon={BadgeCheck} label="Safe Payment" />
      </div>
    </div>
  );
}