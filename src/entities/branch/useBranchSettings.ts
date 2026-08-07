'use client';
import { useState, useEffect } from 'react';
import { useBranch } from '@/entities/branch/BranchContext';
import { useTenant } from '@/entities/tenant/TenantContext';
import type { BranchFeatures } from '@/entities/branch/types';

interface BranchSettings {
  phone: string;
  address: string;
  email: string;
  hours: string; // Оставляем для обратной совместимости, если где-то еще используется
  workingHours: Record<string, string>; // <- ДОБАВИЛИ
  googleMapsUrl: string;
  primaryLanguage: string;
  primaryCurrency: string;
  seoTitle: string;
  seoDescription: string;
  seoTitleI18n: Record<string, string>;
  seoDescriptionI18n: Record<string, string>;
  hoursI18n: Record<string, string>;
  features: BranchFeatures; // <- ДОБАВИЛИ: фичи конкретного филиала (напр. hasVeganTeaser)
}

export function useBranchSettings(): BranchSettings & { loading: boolean } {
  const { selectedBranch, loading: branchLoading } = useBranch();
  const tenant = useTenant();
  const [settings, setSettings] = useState<BranchSettings>({
    phone: tenant?.contact?.phone ?? '',
    address: tenant?.contact?.address ?? '',
    email: tenant?.contact?.email ?? '',
    hours: tenant?.contact?.hours ?? '',
    workingHours: {}, // <- ДОБАВИЛИ
    googleMapsUrl: tenant?.contact?.googleMapsUrl ?? '',
    primaryLanguage: 'pl',
    primaryCurrency: 'PLN',
    seoTitle: tenant?.seo?.title ?? '',
    seoDescription: tenant?.seo?.description ?? '',
    seoTitleI18n: {},
    seoDescriptionI18n: {},
    hoursI18n: {},
    features: {}, // <- ДОБАВИЛИ
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (branchLoading || !selectedBranch) {
      if (!branchLoading && !selectedBranch) setLoading(false);
      return;
    }

    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/saas/settings?tenantId=${selectedBranch.tenantId}&branchId=${selectedBranch._id}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const newSettings = {
          phone: data.phone || tenant?.contact?.phone || '',
          address: data.address || tenant?.contact?.address || '',
          email: data.email || tenant?.contact?.email || '',
          hours: data.hours || tenant?.contact?.hours || '',
          workingHours: data.workingHours || {}, // <- ДОБАВИЛИ (берем из БД)
          googleMapsUrl: data.googleMapsUrl || tenant?.contact?.googleMapsUrl || '',
          primaryLanguage: data.primaryLanguage || 'pl',
          primaryCurrency: data.primaryCurrency || 'PLN',
          seoTitle: data.seoTitle || tenant?.seo?.title || '',
          seoDescription: data.seoDescription || tenant?.seo?.description || '',
          seoTitleI18n: data.seoTitleI18n || {},
          seoDescriptionI18n: data.seoDescriptionI18n || {},
          hoursI18n: data.hoursI18n || {},
          features: data.features || {}, // <- ДОБАВИЛИ: приходит из branch.settingsOverride.features
        };
        setSettings(newSettings);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedBranch, branchLoading, tenant]);

  return { ...settings, loading: loading || branchLoading };
}