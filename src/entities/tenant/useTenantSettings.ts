'use client'
import { useState, useEffect } from 'react';

interface TenantSettings {
  phone?: string;
  address?: string;
  email?: string;
  hours?: string;
  hoursI18n?: Record<string, string>;
  googleMapsUrl?: string;
  seoTitle?: string;
  seoTitleI18n?: Record<string, string>;
  seoDescription?: string;
  seoDescriptionI18n?: Record<string, string>;
  primaryLanguage?: string;
  primaryCurrency?: string;
}

export function useTenantSettings(tenantId: string) {
  const [rawSettings, setRawSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const settings = {
    phone: rawSettings?.phone ?? '',
    address: rawSettings?.address ?? '',
    email: rawSettings?.email ?? '',
    googleMapsUrl: rawSettings?.googleMapsUrl ?? '',
    primaryLanguage: rawSettings?.primaryLanguage ?? 'pl',
    primaryCurrency: rawSettings?.primaryCurrency ?? 'PLN',
    seoTitle: rawSettings?.seoTitle ?? '',
    seoDescription: rawSettings?.seoDescription ?? '',
    hours: rawSettings?.hours ?? '',
  };

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/settings?tenantId=${tenantId}`)
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          setRawSettings(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenantId]);

  return { settings, loading };
}