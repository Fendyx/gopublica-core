'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ShoppingBag, Loader2, AlertCircle, Lock, User, CheckCircle2, Truck, Package, Store, MapPin } from 'lucide-react';
import { PaymentElement } from '@stripe/react-stripe-js';
import { useTranslations } from 'next-intl';

// UI Components
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

// Logic
import { useCartStore } from '@/shared/store/cartStore';
import { useTenant } from '@/entities/tenant/TenantContext';
import { useBranch } from '@/entities/branch/BranchContext';
import { useBranchSettings } from '@/entities/branch/useBranchSettings';

// Widgets
import OrderSummarySidebar from './OrderSummarySidebar';
import DeliveryTimeSection from './DeliveryTimeSection';
import ConfirmLocationSection from './ConfirmLocationSection';
import ParcelLockerSection from './ParcelLockerSection';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm() {
  const { locale } = useParams<{ tenantDomain: string; locale: string }>();
  const stripe = useStripe();
  const elements = useElements();
  const tenant = useTenant();
  const { selectedBranch } = useBranch();
  const { primaryCurrency } = useBranchSettings();
  const { items, getSubtotal } = useCartStore();
  const t = useTranslations('checkout');

  const subtotal = getSubtotal();
  const currencySymbol = primaryCurrency === 'PLN' ? 'zł' : primaryCurrency || '$';

  // Основные данные
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('delivery');
  
  const [deliveryService, setDeliveryService] = useState(tenant?.niche === 'ecommerce' ? 'furgonetka' : 'courier');
  const [deliveryFee, setDeliveryFee] = useState(tenant?.niche === 'ecommerce' ? 14.99 : 7.00);

  // Стейт для хранения выбранного пачкомата с явной типизацией
  const [selectedParcelLocker, setSelectedParcelLocker] = useState<{id: string, network: string, address: any} | null>(null);

  const [scheduledFor, setScheduledFor] = useState<Date | null>(null);
  
  const [address, setAddress] = useState({ 
    street: '1350 Pennsylvania Avenue NW', 
    city: 'Washington', 
    state: 'DC', 
    zip: '20004', 
    lat: 0, 
    lng: 0 
  });
  
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [customer, setCustomer] = useState({ name: 'John Doe', phone: '+1 234 567 890', email: 'john@example.com' });

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fees, setFees] = useState<any>(null);
  const [estimating, setEstimating] = useState(false);

  const isAccountCreationValid = isLoggedIn || !password || (password.length >= 6 && password === confirmPassword && acceptTerms && acceptPrivacy);

  const isDeliveryValid = deliveryService === 'furgonetka' ? selectedParcelLocker !== null : true;

  useEffect(() => {
    if (subtotal <= 0) return setFees(null);
    setEstimating(true);
    
    const timer = setTimeout(() => {
      const taxRate = 0.08; 
      const taxAmount = subtotal * taxRate;
      const myServiceFee = subtotal * 0.01; 
      
      setFees({
        subtotal: subtotal,
        delivery: deliveryFee,
        tax: taxAmount,
        serviceFee: myServiceFee, 
        total: subtotal + deliveryFee + taxAmount + myServiceFee
      });
      setEstimating(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [subtotal, deliveryFee]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCustomer({ name: '', phone: '', email: '' });
  };

  // РЕАЛЬНАЯ ОТПРАВКА ЗАКАЗА И ОПЛАТА ЧЕРЕЗ STRIPE
// РЕАЛЬНАЯ ОТПРАВКА ЗАКАЗА И ОПЛАТА ЧЕРЕЗ STRIPE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isDeliveryValid) {
        alert("Пожалуйста, выберите пачкомат на карте.");
        return;
    }

    if (!stripe || !elements) {
      setError("Stripe не инициализирован");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ---> 1. ОБЯЗАТЕЛЬНАЯ ВАЛИДАЦИЯ STRIPE ПЕРЕД АСИНХРОННЫМ КОДОМ <---
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || "Пожалуйста, проверьте данные карты.");
        setLoading(false);
        return;
      }

      // 2. Создаем заказ на бэкенде
      const tenantId = tenant?.tenantId || window.location.hostname;
      const orderRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({
          branchId: selectedBranch?._id || null,
          fulfillment: {
            type: fulfillmentType,
            scheduledFor,
            address: deliveryService !== 'furgonetka' ? address : null,
            parcelLocker: deliveryService === 'furgonetka' ? selectedParcelLocker : null,
            deliveryInstructions,
            deliveryFee,
          },
          items: items.map(i => ({
            menuItemId: i.menuItemId,
            name: i.name,
            basePrice: i.price,
            price: i.price,
            quantity: i.quantity,
            notes: i.notes || '',
            modifiers: i.modifiers || [],
          })),
          customer,
          locale,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Ошибка при создании заказа');
      }

      const { orderId, token } = orderData;
      if (token) {
        localStorage.setItem('customer_token', token);
      }

      // 3. Получаем PaymentIntent ClientSecret для этого заказа
      const payRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/public/${orderId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
      });

      const payData = await payRes.json();
      if (!payRes.ok) {
        throw new Error(payData.error || 'Ошибка инициализации платежа');
      }

      const { clientSecret } = payData;

      // 4. Подтверждаем платеж через Stripe Elements
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/${locale}/order/thank-you?orderId=${orderId}`,
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'Ошибка оплаты');
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || 'Произошла ошибка при оформлении заказа');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t('emptyCart')}</h2>
        <a href={`/${locale}/menu`} className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg">
          {t('goToMenu')}
        </a>
      </div>
    );
  }

  const payButtonText = fees ? `Pay ${fees.total.toFixed(2)} ${currencySymbol}` : t('placeOrder');
  
  const processingContent = (
    <>
      <Loader2 size={20} className="animate-spin" />
      Processing...
    </>
  );

  return (
    <div className="platform-ui max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 pb-28 lg:pb-10">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8 lg:mb-10">{t('checkout')}</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-12">
          {/* Левая колонка */}
          <div className="space-y-8">
            
            {isLoggedIn ? (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-1 rounded-full shadow-sm">
                    <User className="text-gray-600 w-4 h-4" />
                  </div>
                  <div className="text-sm text-gray-900">
                    Logged in as <span className="font-medium">{customer.email}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center gap-3">
                <User className="text-gray-500 w-5 h-5 flex-shrink-0" />
                <div className="text-sm text-gray-700">
                  Checking out as guest.
                </div>
              </div>
            )}
            
            <div className="mb-2">
              <h3 className="text-base font-medium text-gray-900 mb-4">Delivery method</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tenant?.niche === 'ecommerce' ? (
                  <>
                    <div 
                      onClick={() => { setFulfillmentType('delivery'); setDeliveryService('furgonetka'); setDeliveryFee(14.99); }}
                      className={`relative rounded-xl p-4 cursor-pointer border transition-all duration-150 flex justify-between items-center ${
                        deliveryService === 'furgonetka' 
                          ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex gap-3 items-center">
                        <MapPin size={20} className={deliveryService === 'furgonetka' ? 'text-blue-600' : 'text-gray-400'}/>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Paczkomat / Punkty</p>
                          <p className="text-xs text-gray-500 mt-0.5">InPost, Orlen, DPD...</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">+{14.99} {currencySymbol}</span>
                    </div>

                    <div 
                      onClick={() => { setFulfillmentType('delivery'); setDeliveryService('ups'); setDeliveryFee(19.00); }}
                      className={`relative rounded-xl p-4 cursor-pointer border transition-all duration-150 flex justify-between items-center ${
                        deliveryService === 'ups' 
                          ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex gap-3 items-center">
                        <Truck size={20} className={deliveryService === 'ups' ? 'text-blue-600' : 'text-gray-400'}/>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Kurier</p>
                          <p className="text-xs text-gray-500 mt-0.5">Dostawa do domu</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">+{19.00} {currencySymbol}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div 
                      onClick={() => { setFulfillmentType('delivery'); setDeliveryService('courier'); setDeliveryFee(7.00); }}
                      className={`relative rounded-xl p-4 cursor-pointer border transition-all duration-150 flex justify-between items-center ${
                        deliveryService === 'courier' 
                          ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex gap-3 items-center">
                        <Truck size={20} className={deliveryService === 'courier' ? 'text-blue-600' : 'text-gray-400'}/>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Local Courier</p>
                          <p className="text-xs text-gray-500 mt-0.5">~35 mins</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">+$7.00</span>
                    </div>

                    <div 
                      onClick={() => { setFulfillmentType('pickup'); setDeliveryService('pickup'); setDeliveryFee(0); }}
                      className={`relative rounded-xl p-4 cursor-pointer border transition-all duration-150 flex justify-between items-center ${
                        deliveryService === 'pickup' 
                          ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex gap-3 items-center">
                        <Store size={20} className={deliveryService === 'pickup' ? 'text-blue-600' : 'text-gray-400'}/>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Store Pickup</p>
                          <p className="text-xs text-gray-500 mt-0.5">Ready in 15 mins</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">Free</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {tenant?.niche !== 'ecommerce' && (
                <DeliveryTimeSection scheduledFor={scheduledFor} setScheduledFor={setScheduledFor} />
            )}
            
            {deliveryService === 'furgonetka' ? (
                <div className="mt-8">
                    <ParcelLockerSection 
                        onSelect={(locker) => setSelectedParcelLocker({
                            id: locker.id,
                            network: locker.network || 'Furgonetka',
                            address: locker.address || {}
                        })} 
                        selectedLockerId={selectedParcelLocker?.id}
                    />
                </div>
            ) : (
                <ConfirmLocationSection
                  fulfillmentType={fulfillmentType}
                  setFulfillmentType={setFulfillmentType}
                  address={address}
                  setAddress={setAddress}
                  deliveryInstructions={deliveryInstructions}
                  setDeliveryInstructions={setDeliveryInstructions}
                  customer={customer}
                  setCustomer={setCustomer}
                  isLoggedIn={isLoggedIn}
                  isEcommerce={tenant?.niche === 'ecommerce'}
                />
            )}

          </div>

          {/* Правая колонка */}
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
              <h3 className="text-base font-medium text-gray-900">{t('paymentMethod')}</h3>
              <PaymentElement id="payment-element" options={{ layout: 'tabs' }} />
            </div>
            
            <button
              type="submit"
              disabled={loading || !isDeliveryValid}
              className="hidden lg:flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3.5 rounded-lg font-semibold text-base shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? processingContent : fees ? <><Lock size={16} />{payButtonText}</> : t('placeOrder')}
            </button>
          </div>
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
        <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t('emptyCart')}</h2>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: 'payment',
        currency: primaryCurrency?.toLowerCase() || 'usd',
        amount: Math.max(Math.round((subtotal + 10) * 100), 100),
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#2563eb', 
            borderRadius: '8px',
          },
        },
      }}
    >
      <CheckoutForm />
    </Elements>
  );
}