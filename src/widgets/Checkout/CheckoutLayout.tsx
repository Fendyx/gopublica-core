'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ShoppingBag, Loader2, AlertCircle, Lock, User, CheckCircle2, LogOut } from 'lucide-react';
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

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

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
  const currencySymbol = primaryCurrency === 'PLN' ? 'zł' : primaryCurrency || '€';

  // Основные данные
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null);
  const [address, setAddress] = useState({ street: '', city: '', zip: '', lat: 0, lng: 0 });
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });

  // NEW: Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fees, setFees] = useState<any>(null);
  const [estimating, setEstimating] = useState(false);

  const deliveryFee = fulfillmentType === 'delivery' ? 5 : 0;

  // Валидация создания аккаунта (только для гостей)
  const isPasswordValid = password.length >= 6;
  const isPasswordMatch = password === confirmPassword;
  const isAccountCreationValid = 
    isLoggedIn || !password || (isPasswordValid && isPasswordMatch && acceptTerms && acceptPrivacy);

  // Проверка авторизации и подгрузка профиля
  useEffect(() => {
    const token = localStorage.getItem('customer_token');
    if (token) {
      setIsLoggedIn(true);
      fetch(`${API_BASE}/api/public/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(data => {
          setCustomer({
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || ''
          });
        })
        .catch(() => {
          // Если токен протух, просто выходим из режима авторизации
          localStorage.removeItem('customer_token');
          setIsLoggedIn(false);
        });
    }
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem('customer_token');
    setIsLoggedIn(false);
    setCustomer({ name: '', phone: '', email: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !fees) return;
    
    if (!isAccountCreationValid) {
      setError('Проверьте правильность пароля и согласие с условиями.');
      return;
    }

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

      const token = localStorage.getItem('customer_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const resOrder = await fetch(`${API_BASE}/api/orders/public`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          branchId: selectedBranch?._id,
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
            basePrice: i.basePrice, // <--- Добавили
            price: i.price,
            quantity: i.quantity,
            notes: i.notes,
            modifiers: i.modifiers, // <--- Добавили
          })),
          customer,
          locale,
          // Отправляем данные для создания аккаунта ТОЛЬКО если пользователь гость и ввел пароль
          password: !isLoggedIn ? (password || undefined) : undefined,
          consents: !isLoggedIn && password ? {
            terms: acceptTerms,
            privacy: acceptPrivacy,
            marketing: false
          } : undefined
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
    <div className="platform-ui max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 pb-28 lg:pb-10">
      <h1 className="text-3xl font-heading font-bold text-text-primary mb-8 lg:mb-10">{t('checkout')}</h1>

      <form onSubmit={handleSubmit}>
        <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-12">
          {/* Левая колонка: данные */}
          <div className="space-y-8">
            
            {/* ИНФОРМЕР АВТОРИЗАЦИИ */}
            {isLoggedIn ? (
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-600 w-5 h-5 flex-shrink-0" />
                  <div className="text-sm text-emerald-800">
                    Вы оформляете заказ как <strong>{customer.email}</strong>. <br/>
                    <span className="text-emerald-600 text-xs">Детали профиля заполнены автоматически.</span>
                  </div>
                </div>
                <button type="button" onClick={handleLogout} className="text-xs text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1">
                  <LogOut size={12} /> Выйти
                </button>
              </div>
            ) : (
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center gap-3">
                <User className="text-blue-600 w-5 h-5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  Вы оформляете заказ как гость. <br/>
                  <span className="text-blue-600 text-xs">Войдите в аккаунт или введите пароль ниже, чтобы создать профиль.</span>
                </div>
              </div>
            )}
            

            {tenant?.niche !== 'ecommerce' && (
                <DeliveryTimeSection scheduledFor={scheduledFor} setScheduledFor={setScheduledFor} />
              )}
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
              isEcommerce={tenant?.niche === 'ecommerce'} // <--- Передаем флаг
            />

            {/* БЛОК СОЗДАНИЯ АККАУНТА (ТОЛЬКО ДЛЯ ГОСТЕЙ) */}
            {!isLoggedIn && (
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-5">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Создать аккаунт (опционально)
                </h3>
                <p className="text-sm text-gray-500">
                  Введите пароль, чтобы создать аккаунт и отслеживать статус заказов в будущем.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Пароль</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Минимум 6 символов"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Повторите пароль</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={password && !isPasswordMatch ? 'border-red-500' : ''}
                    />
                    {password && !isPasswordMatch && (
                      <p className="text-xs text-red-500 mt-1">Пароли не совпадают</p>
                    )}
                  </div>
                </div>

                {password && (
                  <div className="space-y-3 pt-2 border-t border-gray-200">
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        id="terms" 
                        checked={acceptTerms}
                        onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                      />
                      <label htmlFor="terms" className="text-sm text-gray-600 leading-tight cursor-pointer select-none">
                        Я согласен с <a href="#" className="text-primary underline hover:text-primary/80">Условиями использования</a>
                      </label>
                    </div>
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        id="privacy" 
                        checked={acceptPrivacy}
                        onCheckedChange={(checked) => setAcceptPrivacy(checked as boolean)}
                      />
                      <label htmlFor="privacy" className="text-sm text-gray-600 leading-tight cursor-pointer select-none">
                        Я согласен с <a href="#" className="text-primary underline hover:text-primary/80">Политикой конфиденциальности</a>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Правая колонка (оплата и сайдбар) */}
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
              disabled={!stripe || !fees || loading || !isAccountCreationValid}
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
            disabled={!stripe || !fees || loading || !isAccountCreationValid}
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