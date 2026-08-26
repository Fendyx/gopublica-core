import type { OrderStatus } from '@/entities/order/types';

/**
 * Lightweight customer record with server-computed stats.
 * Customers are TENANT-scoped (global for the whole store), not branch-scoped.
 */
export interface CustomerSummary {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  /** Lifetime spend, computed by the backend. May be omitted for customers with no orders yet. */
  totalSpent?: number;
  /** Number of orders, computed by the backend. May be omitted for customers with no orders yet. */
  orderCount?: number;
  /** Optional store currency code (e.g. "pln") — confirm with backend whether provided. */
  currency?: string;
  lastOrderAt?: string | null;
  createdAt: string;
}

/** Compact order row shown in the customer's history drawer. */
export interface CustomerOrder {
  _id: string;
  status: OrderStatus;
  pricing: {
    total: number;
    currency: string;
  };
  itemCount?: number;
  createdAt: string;
}

/** Response shape of GET /api/saas/customers/:id */
export interface CustomerDetails {
  customer: CustomerSummary;
  orders: CustomerOrder[];
}
