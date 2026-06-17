'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ShoppingBag, Loader2, AlertCircle, Lock } from 'lucide-react';
import { PaymentElement } from '@stripe/react-stripe-js';
import { useTranslations } from 'next-intl';

import { useCartStore } from '@/shared/store/cartStore';
import { useTenant } from '@/entities/tenant/TenantContext';
import { useBranchSettings } from '@/entities/branch/useBranchSettings';

import OrderSummarySidebar from './OrderSummarySidebar';
import DeliveryTimeSection from './DeliveryTimeSection';
import ConfirmLocationSection from './ConfirmLocationSection';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

function CheckoutForm() {
  const { locale } = useParams<{ tenantDomain: string; locale: string }>();
  const stripe = useStripe();
  const elements = useElements();
  const tenant = useTenant();
  const { primaryCurrency } = useBranchSettings();
  const { items, getSubtotal } = useCartStore();
  const t = useTranslations('checkout');

  const subtotal = getSubtotal();
  const currencySymbol = primaryCurrency === 'PLN' ? 'zł' : primaryCurrency || '€';

  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null);
  const [address, setAddress] = useState({ street: '', city: '', zip: '', lat: 0, lng: 0 });
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fees, setFees] = useState<any>(null);
  const [estimating, setEstimating] = useState(false);

  const deliveryFee = fulfillmentType === 'delivery' ? 5 : 0;

  useEffect(() => {
    if (subtotal <= 0) return setFees(null);
    const tenantId = tenant?.tenantId;
    if (!tenantId) return;

    setEstimating(true);
    fetch(`${API_BASE}/api/orders/public/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
      body: JSON.stringify({ subtotal, deliveryFee }),
    })
      .then((res) => res.json())
      .then((data) => setFees(data))
      .catch(() => setFees(null))
      .finally(() => setEstimating(false));
  }, [subtotal, deliveryFee, tenant?.tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !fees) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'Payment validation failed');
      setLoading(false);
      return;
    }

    try {
      const tenantId = tenant?.tenantId;
      if (!tenantId) throw new Error('Tenant not loaded');

      const resOrder = await fetch(`${API_BASE}/api/orders/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({
          fulfillment: {
            type: fulfillmentType,
            scheduledFor: scheduledFor?.toISOString(),
            address: fulfillmentType === 'delivery' ? address : undefined,
            deliveryInstructions,
            deliveryFee,
          },
          items: items.map((i) => ({
            menuItemId: i.menuItemId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            notes: i.notes,
          })),
          customer,
          locale,
        }),
      });

      if (!resOrder.ok) {
        const errData = await resOrder.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create order');
      }
      const { orderId } = await resOrder.json();

      const resPay = await fetch(`${API_BASE}/api/orders/public/${orderId}/pay`, {
        method: 'POST',
        headers: { 'x-tenant-id': tenantId },
      });
      if (!resPay.ok) {
        const errData = await resPay.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to initiate payment');
      }
      const { clientSecret } = await resPay.json();

      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/${locale}/order/thank-you?orderId=${orderId}`,
          payment_method_data: {
            billing_details: {
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
            },
          },
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        setLoading(false);
        return;
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={48} className="mx-auto text-text-tertiary mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t('emptyCart')}</h2>
        <a href={`/${locale}/menu`} className="inline-block mt-6 px-6 py-3 bg-primary text-white rounded-xl">
          {t('goToMenu')}
        </a>
      </div>
    );
  }

  const payButtonText = fees
    ? t('payTotal', { total: fees.total.toFixed(2), currency: currencySymbol })
    : t('placeOrder');
  const processingContent = (
    <>
      <Loader2 size={20} className="animate-spin" />
      {t('processing')}
    </>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 pb-28 lg:pb-10">
      <h1 className="text-3xl font-heading font-bold text-text-primary mb-8 lg:mb-10">{t('checkout')}</h1>

      <form onSubmit={handleSubmit}>
        <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-12">
          {/* Левая колонка: время и контакты */}
          <div className="space-y-8">
            <DeliveryTimeSection scheduledFor={scheduledFor} setScheduledFor={setScheduledFor} />
            <ConfirmLocationSection
              fulfillmentType={fulfillmentType}
              setFulfillmentType={setFulfillmentType}
              address={address}
              setAddress={setAddress}
              deliveryInstructions={deliveryInstructions}
              setDeliveryInstructions={setDeliveryInstructions}
              customer={customer}
              setCustomer={setCustomer}
            />
          </div>

          {/* Правая колонка (десктоп + мобильные) */}
          <div className="mt-8 lg:mt-0 lg:col-start-2 lg:row-start-1 lg:row-span-3 flex flex-col gap-6">
            <OrderSummarySidebar
              items={items}
              subtotal={subtotal}
              fees={fees}
              estimating={estimating}
              deliveryFee={deliveryFee}
              fulfillmentType={fulfillmentType}
              currencySymbol={currencySymbol}
            />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500">{t('paymentMethod')}</h3>
              <PaymentElement id="payment-element" options={{ layout: 'tabs' }} />
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!stripe || !fees || loading}
              className="hidden lg:flex items-center justify-center gap-2 w-full bg-primary text-white py-3.5 rounded-xl font-semibold text-base shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? processingContent : fees ? <><Lock size={16} />{payButtonText}</> : t('placeOrder')}
            </button>
          </div>
        </div>

        {/* Мобильная фиксированная кнопка */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <button
            type="submit"
            disabled={!stripe || !fees || loading}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? processingContent : payButtonText}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutLayout() {
  const { primaryCurrency } = useBranchSettings();
  const { items, getSubtotal } = useCartStore();
  const t = useTranslations('checkout');

  const subtotal = getSubtotal();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={48} className="mx-auto text-text-tertiary mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t('emptyCart')}</h2>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: 'payment',
        currency: primaryCurrency?.toLowerCase() || 'pln',
        amount: Math.max(Math.round(subtotal * 100), 100),
      }}
    >
      <CheckoutForm />
    </Elements>
  );
}