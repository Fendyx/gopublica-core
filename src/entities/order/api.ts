import { Order, OrderStatus } from '@/entities/order/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('saas_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const getOrders = async (branchId?: string): Promise<Order[]> => {
  try {
    let url = `${API_URL}/api/saas/orders`;
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch orders');
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
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