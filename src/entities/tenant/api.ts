// src/entities/tenant/api.ts
export interface TenantSettings {
  tenantId: string;
  businessName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  niche: 'food' | 'beauty' | 'auto' | 'ecommerce';
  domain?: string;
  aliases?: string[];
  primaryCurrency: string;
  theme: {
    primary: string;
    accent: string;
    fontHeading: string;
    fontBody?: string;
    heroStyle: string;
    heroVideoUrl?: string;
    heroPosterUrl?: string;
    heroSliderImages?: string[];
    heroBgImage?: string;
    heroSplitImage?: string;
    menuStyle?: string;
    galleryStyle?: string;
    ecommerceLayout?: 'grid-3' | 'grid-4' | 'carousel' | 'dynamic';
    radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    productCardVariant?: 'overlay' | 'action-bar' | 'minimal' | 'hover-vertical' | 'action-overlay' | 'clean';
    pageBgColor?: string;
  };
  features: {
    hasMenu: boolean;
    hasBooking: boolean;
    hasGallery: boolean;
    hasDelivery: boolean;
    hasClickCollect: boolean;
    hasOnlineOrdering: boolean;
    hasJobApplications?: boolean;
  };
  phone: string;
  address: string;
  email: string;
  hours: string;
  seoTitle: string;
  seoDescription: string;
  primaryLanguage: string;
  legal?: {
    legalCompanyName?: string;
    nip?: string;
    regon?: string;
    krs?: string;
  };
  logistics?: {
    enabled: boolean;
    provider: 'furgonetka' | 'none';
    mapApiKey?: string;
    env?: 'sandbox' | 'production';
  };
}

export async function getTenantByDomain(domain: string): Promise<TenantSettings | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/saas/settings/by-domain?domain=${domain}`,
      { next: { tags: [`tenant:domain:${domain}`] }, cache: 'no-store' }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Cached lookup of the canonical domain for a request host.
 *
 * The backend now supports tenant `aliases` (e.g. `tenant.localhost:3000`).
 * This helper:
 *   1. Queries `/api/saas/settings/by-domain?domain=<host>` — the backend
 *      matches against both `domain` and `aliases`.
 *   2. Returns the canonical `domain` (always the primary domain, never the alias).
 *   3. Caches the result in a module-level Map with a TTL so the middleware
 *      does not hammer the backend on every request.
 *
 * Returns `null` when the tenant cannot be resolved.
 */
const DOMAIN_CACHE_TTL = 60_000; // 1 minute
const domainCache = new Map<
  string,
  { canonicalDomain: string; tenantId: string; expires: number }>()
;

export async function resolveCanonicalDomain(
  host: string
): Promise<{ canonicalDomain: string; tenantId: string } | null> {
  const cached = domainCache.get(host);
  if (cached && cached.expires > Date.now()) {
    return { canonicalDomain: cached.canonicalDomain, tenantId: cached.tenantId };
  }

  const tenant = await getTenantByDomain(host);
  if (!tenant) return null;

  const canonicalDomain = tenant.domain ?? host;
  domainCache.set(host, {
    canonicalDomain,
    tenantId: tenant.tenantId,
    expires: Date.now() + DOMAIN_CACHE_TTL,
  });

  return { canonicalDomain, tenantId: tenant.tenantId };
}