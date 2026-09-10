import { Order, OrderStatus } from '@/entities/order/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('saas_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface OrdersQuery {
  branchId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const getOrders = async (branchIdOrQuery?: string | OrdersQuery): Promise<OrdersResponse> => {
  try {
    let url = `${API_URL}/api/saas/orders`;
    const params = new URLSearchParams();

    if (typeof branchIdOrQuery === 'string') {
      if (branchIdOrQuery) params.append('branchId', branchIdOrQuery);
    } else if (branchIdOrQuery) {
      if (branchIdOrQuery.branchId) params.append('branchId', branchIdOrQuery.branchId);
      if (branchIdOrQuery.status) params.append('status', branchIdOrQuery.status);
      if (branchIdOrQuery.page) params.append('page', String(branchIdOrQuery.page));
      if (branchIdOrQuery.limit) params.append('limit', String(branchIdOrQuery.limit));
    }

    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch orders');
    const data = await res.json();
    // Handle both old (array) and new (paginated) response shapes
    if (Array.isArray(data)) {
      return { orders: data, total: data.length, page: 1, limit: 50 };
    }
    return data;
  } catch (error) {
    console.error(error);
    return { orders: [], total: 0, page: 1, limit: 50 };
  }
};

export const acceptOrder = async (orderId: string): Promise<Order> => {
  const res = await fetch(`${API_URL}/api/saas/orders/${orderId}/accept`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to accept order');
  return await res.json();
};

export const declineOrder = async (orderId: string, reason: string): Promise<Order> => {
  const res = await fetch(`${API_URL}/api/saas/orders/${orderId}/decline`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error('Failed to decline order');
  return await res.json();
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<Order> => {
  const res = await fetch(`${API_URL}/api/saas/orders/${orderId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update status');
  return await res.json();
};