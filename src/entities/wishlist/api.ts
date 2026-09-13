/**
 * Wishlist API client — thin fetch wrapper for /api/public/wishlist endpoints.
 * All calls require the customer JWT stored in localStorage as `customer_token`.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getCustomerToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('customer_token');
  } catch {
    return null;
  }
}

function authHeaders(): Record<string, string> {
  const token = getCustomerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface WishlistItem {
  productId: string;
  createdAt: string;
}

/**
 * Fetch all wishlisted product IDs for the current customer.
 * Returns an empty array if not authenticated.
 */
export async function fetchWishlist(): Promise<string[]> {
  const token = getCustomerToken();
  if (!token) return [];

  try {
    const res = await fetch(`${API_URL}/api/public/wishlist`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map((i: WishlistItem) => i.productId);
  } catch {
    return [];
  }
}

/**
 * Add a product to the wishlist.
 * Returns true on success.
 */
export async function addToWishlist(productId: string): Promise<boolean> {
  const token = getCustomerToken();
  if (!token) return false;

  try {
    const res = await fetch(`${API_URL}/api/public/wishlist/${productId}`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Remove a product from the wishlist.
 * Returns true on success.
 */
export async function removeFromWishlist(productId: string): Promise<boolean> {
  const token = getCustomerToken();
  if (!token) return false;

  try {
    const res = await fetch(`${API_URL}/api/public/wishlist/${productId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Full product data returned by the /wishlist/products endpoint. */
export interface WishlistProduct {
  _id: string;
  name: string;
  price: number;
  image?: string;
  images?: string[];
  stock?: number;
  category: string;
  compareAtPrice?: number;
  variants?: { id: string; name: string; price?: number }[];
  wishlistedAt: string;
}

/**
 * Fetch full product details for all wishlisted items.
 * Returns an empty array if not authenticated.
 */
export async function fetchWishlistProducts(): Promise<WishlistProduct[]> {
  const token = getCustomerToken();
  if (!token) return [];

  try {
    const res = await fetch(`${API_URL}/api/public/wishlist/products`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}
