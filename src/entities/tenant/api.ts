// src/entities/tenant/api.ts
export interface TenantSettings {
  tenantId: string;
  businessName?: string;
  niche: 'food' | 'beauty' | 'auto' | 'ecommerce';
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
}

export async function getTenantByDomain(domain: string): Promise<TenantSettings | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/saas/settings/by-domain?domain=${domain}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}