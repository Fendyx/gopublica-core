import type { CustomerDetails, CustomerSummary } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('saas_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/** Raw backend customer shape — stats may be direct fields or nested in a `stats` object/array. */
interface RawCustomer {
  _id: string;
  name?: string;
  phone?: string;
  email?: string;
  currency?: string;
  totalSpent?: number;
  orderCount?: number;
  totalOrders?: number; // backend naming
  lastOrderAt?: string | null;
  createdAt?: string;
  /** Backend may nest computed stats here (object) or as an aggregation result (array with one item). */
  stats?: {
    totalSpent?: number;
    totalOrders?: number;
    orderCount?: number;
  } | Array<{
    totalSpent?: number;
    totalOrders?: number;
    orderCount?: number;
  }>;
}

/** Extracts stats from whichever shape the backend used and maps to our UI contract. */
const normalizeCustomer = (raw: RawCustomer): CustomerSummary => {
  // `stats` can be an object OR a one-element array (MongoDB $group output).
  const s = Array.isArray(raw.stats) ? raw.stats[0] : raw.stats;

  return {
    _id: raw._id,
    name: raw.name ?? '',
    phone: raw.phone ?? '',
    email: raw.email,
    currency: raw.currency,
    totalSpent: s?.totalSpent ?? raw.totalSpent,
    // Backend calls it `totalOrders`; we expose it as `orderCount`.
    orderCount: s?.totalOrders ?? s?.orderCount ?? raw.orderCount ?? raw.totalOrders,
    lastOrderAt: raw.lastOrderAt,
    createdAt: raw.createdAt ?? '',
  };
};

/**
 * Tenant-scoped list of registered customers with computed stats.
 * The backend returns a paginated envelope `{ page, limit, customers: [...] }`;
 * we normalize it to a flat array (with a fallback for a legacy flat-array response).
 */
export const getCustomers = async (): Promise<CustomerSummary[]> => {
  try {
    const res = await fetch(`${API_URL}/api/saas/customers`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch customers');
    const data = await res.json();
    const list: RawCustomer[] = data.customers || (Array.isArray(data) ? data : []);
    return list.map(normalizeCustomer);
  } catch (error) {
    console.error(error);
    return [];
  }
};

/** Single customer with their full order history: `{ customer, orders }`. */
export const getCustomerDetails = async (customerId: string): Promise<CustomerDetails> => {
  const res = await fetch(`${API_URL}/api/saas/customers/${customerId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch customer details');
  const data = await res.json();
  if (!data?.customer) throw new Error('Unexpected customer details response shape');
  return {
    // Root-level `stats` is merged into the customer so the UI can keep
    // reading `customer.totalSpent` / `customer.orderCount` directly.
    customer: normalizeCustomer({ ...data.customer, stats: data.stats ?? data.customer.stats }),
    orders: data.orders || [],
  };
};
