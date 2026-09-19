'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { SearchX, Home, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/entities/tenant/TenantContext';

/**
 * Tenant-aware 404 page — shown when a route matches the tenant domain
 * but the specific page doesn't exist (e.g. /{tenantDomain}/{locale}/nonexistent).
 *
 * Provides a branded experience with a link back to the tenant's home page.
 */
export default function TenantNotFound() {
  const t = useTranslations('notFound');
  const { locale } = useParams<{ locale: string }>();
  const tenant = useTenant();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
          <SearchX className="w-10 h-10 text-muted-foreground" />
        </div>

        <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
        <h2 className="text-xl font-semibold text-foreground mb-2">{t('title')}</h2>
        <p className="text-muted-foreground mb-8">
          {t('message')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default" className="rounded-xl">
            <Link href={`/${locale}`}>
              <Home className="w-4 h-4 mr-2" /> {t('goHome')}
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl" onClick={() => window.history.back()}>
            <span>
              <ArrowLeft className="w-4 h-4 mr-2" /> Go back
            </span>
          </Button>
        </div>

        {tenant && (
          <p className="mt-8 text-xs text-muted-foreground">
            {tenant.businessName || tenant.clientName}
          </p>
        )}
      </motion.div>
    </div>
  );
}
