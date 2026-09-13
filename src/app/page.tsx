'use client';
import { useTranslations } from 'next-intl';

export default function RootPage() {
  const t = useTranslations('homePage');
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl">{t('siteNotFound')}</h1>
    </div>
  );
}