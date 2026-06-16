'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

import { useCartStore } from '@/shared/store/cartStore';
import { useTenant } from '@/entities/tenant/TenantContext';
import { useBranchSettings } from '@/entities/branch/useBranchSettings';

import OrderSummarySidebar from './OrderSummarySidebar';
import DeliveryTimeSection from './DeliveryTimeSection';
import ConfirmLocationSection from './ConfirmLocationSection';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// Внутренний компонент, который находится внутри Elements (имеет доступ к stripe/elements)
function CheckoutForm() {
  const { locale } = useParams<{ tenantDomain: string; locale: string }>();
  const stripe = useStripe();
  const elements = useElements();
  const tenant = useTenant();
  const { primaryCurrency } = useBranchSettings();
  const { items, clearCart, getSubtotal } = useCartStore();

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

  // Оценка суммы
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

    // 1. Валидация и сбор данных с PaymentElement
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

  // Заглушка при пустой корзине
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={48} className="mx-auto text-text-tertiary mb-4" />
        <h2 className="text-xl font-semibold mb-2">Корзина пуста</h2>
        <a href={`/${locale}/menu`} className="inline-block mt-6 px-6 py-3 bg-primary text-white rounded-xl">В меню</a>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-heading font-bold text-text-primary mb-8">Checkout</h1>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="grid gap-10 lg:grid-cols-[1fr_420px] items-start"
      >
        <div className="space-y-6">
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

        <div className="lg:sticky lg:top-8">
          {estimating || !fees ? (
            <div className="bg-surface-card rounded-3xl p-8 animate-pulse space-y-4">
              <div className="h-6 bg-surface-hover rounded w-1/2" />
              <div className="h-4 bg-surface-hover rounded w-3/4" />
              <div className="h-4 bg-surface-hover rounded w-2/3" />
            </div>
          ) : (
            <OrderSummarySidebar
              items={items}
              subtotal={subtotal}
              fees={fees}
              estimating={estimating}
              deliveryFee={deliveryFee}
              fulfillmentType={fulfillmentType}
              currencySymbol={currencySymbol}
              loading={loading}
              error={error}
              stripeLoaded={!!stripe}
            />
          )}
        </div>
      </motion.form>
    </div>
  );
}

// Основной компонент: оборачивает в Elements с примерной суммой
// (точная сумма списывается позже через clientSecret из /pay)
export default function CheckoutLayout() {
  const { primaryCurrency } = useBranchSettings();
  const { items, getSubtotal } = useCartStore();

  const subtotal = getSubtotal();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={48} className="mx-auto text-text-tertiary mb-4" />
        <h2 className="text-xl font-semibold mb-2">Корзина пуста</h2>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: 'payment',
        currency: primaryCurrency?.toLowerCase() || 'pln',
        // примерная сумма только для первичного рендера PaymentElement;
        // реальная сумма списывается по clientSecret, полученному в /pay
        amount: Math.max(Math.round(subtotal * 100), 100),
      }}
    >
      <CheckoutForm />
    </Elements>
  );
}