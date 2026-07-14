'use client';

import { MapPin, User, Phone, Mail, MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ConfirmLocationSectionProps {
  fulfillmentType: 'pickup' | 'delivery';
  setFulfillmentType: (type: 'pickup' | 'delivery') => void;
  address: { street: string; city: string; zip: string; lat: number; lng: number };
  setAddress: (addr: any) => void;
  deliveryInstructions: string;
  setDeliveryInstructions: (val: string) => void;
  customer: { name: string; phone: string; email: string };
  setCustomer: (cust: any) => void;
  isLoggedIn: boolean;
  isEcommerce?: boolean;
}

export default function ConfirmLocationSection({
  fulfillmentType,
  address,
  setAddress,
  deliveryInstructions,
  setDeliveryInstructions,
  customer,
  setCustomer,
  isLoggedIn,
  isEcommerce = false,
}: ConfirmLocationSectionProps) {
  const t = useTranslations('checkout');

  return (
    <section>
      {/* Адрес доставки показывается только если выбрана доставка (для рестиков) ИЛИ это E-commerce */}
      {(fulfillmentType === 'delivery' || isEcommerce) && (
        <>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 mt-6">
            Delivery Address
          </h2>
          <div className="space-y-3 mb-6">
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                required
                placeholder={t('street')}
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                placeholder={t('city')}
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
              />
              <input
                required
                placeholder={t('zip')}
                value={address.zip}
                onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
              />
            </div>
            <div className="relative">
              <MessageSquare size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <textarea
                rows={2}
                placeholder={t('courierInstructions')}
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow resize-none"
              />
            </div>
          </div>
        </>
      )}

      {/* Контактные данные */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-medium text-gray-500 mb-4">{t('contactInfo')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div className="relative">
            <User size={16} className="absolute left-3 top-3.5 text-gray-400" />
            <input
              required
              placeholder={t('name')}
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
            />
          </div>
          <div className="relative">
            <Phone size={16} className="absolute left-3 top-3.5 text-gray-400" />
            <input
              required
              placeholder={t('phone')}
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
            />
          </div>
        </div>
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-3.5 text-gray-400" />
          <input
            required
            type="email"
            placeholder={t('email')}
            value={customer.email}
            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
            disabled={isLoggedIn}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow ${
              isLoggedIn ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
            }`}
          />
        </div>
      </div>
    </section>
  );
}