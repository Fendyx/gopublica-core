// src/app/[tenantDomain]/[locale]/[branchSlug]/order/cancel/page.tsx
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export default async function CancelPage({
  params,
}: {
  params: Promise<{ tenantDomain: string; locale: string; branchSlug: string }>;
}) {
  const { locale, branchSlug } = await params;
  const t = await getTranslations('order');

  return (
    <div className="max-w-md mx-auto text-center py-20">
      <h1 className="text-2xl font-heading font-bold mb-4">{t('cancel.title')}</h1>
      <p className="text-gray-600">{t('cancel.description')}</p>
      <Link href={`/${locale}/${branchSlug}/catalog`} className="mt-6 inline-block px-6 py-2 bg-primary text-white rounded-full">
        {t('cancel.backToHome')}
      </Link>
    </div>
  );
}
