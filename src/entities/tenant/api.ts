// src/entities/tenant/api.ts
export interface TenantSettings {
  tenantId: string;
  niche: 'food' | 'beauty' | 'auto';
  theme: {
    primary: string;
    accent: string;
    fontHeading: string;
    heroStyle: string;
    heroVideoUrl: string;
    menuStyle: string;
    galleryStyle: string;
  };
  features: {
    hasMenu: boolean;
    hasBooking: boolean;
    hasGallery: boolean;
    hasDelivery: boolean;
    hasClickCollect: boolean;
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
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}