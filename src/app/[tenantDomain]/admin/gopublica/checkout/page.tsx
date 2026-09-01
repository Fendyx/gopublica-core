'use client';

import { useTranslations } from 'next-intl';
import PlatformCheckout from '@/widgets/Admin/PlatformCheckout';

export default function PlatformCheckoutPage() {
  const t = useTranslations('admin.gopublicaPage');

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">{t('checkout')}</h1>
      <PlatformCheckout />
    </div>
  );
}
