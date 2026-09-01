import { API_BASE } from '@/shared/api/apiClient';
import type { MarketplaceProduct, PlatformOrder } from './types';

async function authFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('saas_token') : null;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error: ${res.statusText}`);
  }
  return res.json();
}

// ─── Products ──────────────────────────────────────────────────────────────
export async function fetchMarketplaceProducts(niche?: string): Promise<MarketplaceProduct[]> {
  const params = niche ? `?niche=${encodeURIComponent(niche)}` : '';
  return authFetch<MarketplaceProduct[]>(`/api/platform/products${params}`);
}

// ─── Orders ────────────────────────────────────────────────────────────────
export interface PlatformOrderPayload {
  items: { productId: string; quantity: number }[];
  paymentMethod: 'stripe' | 'cash_on_delivery';
  buyerType: 'private' | 'business';
  nip?: string;
  businessName?: string;
  fulfillment: {
    type: 'parcel_locker' | 'courier' | 'cash_on_delivery';
    parcelLocker?: {
      lockerId: string;
      network: string;
      address?: { street?: string; city?: string; zip?: string };
    };
    address?: {
      name: string;
      phone: string;
      email: string;
      street: string;
      city: string;
      zip: string;
    };
  };
  notes?: string;
}

export async function createPlatformOrder(data: PlatformOrderPayload): Promise<{
  orderId: string;
  clientSecret?: string;
  message?: string;
}> {
  return authFetch('/api/platform/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchMyOrders(): Promise<PlatformOrder[]> {
  return authFetch<PlatformOrder[]>('/api/platform/orders/my');
}

// ─── News ──────────────────────────────────────────────────────────────────
export async function fetchPlatformNews(): Promise<import('./types').PlatformNewsItem[]> {
  return authFetch<import('./types').PlatformNewsItem[]>('/api/platform/news');
}
