import type { Article } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ─── SaaS (admin) endpoints ─────────────────────────────────────────

export async function fetchArticles(
  tenantId: string,
  token: string,
  branchId?: string | null
): Promise<Article[]> {
  const params = new URLSearchParams({ tenantId });
  if (branchId) params.set('branchId', branchId);

  const res = await fetch(`${API_URL}/api/saas/articles?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch articles');
  return res.json();
}

export async function fetchArticleById(
  id: string,
  token: string
): Promise<Article> {
  const res = await fetch(`${API_URL}/api/saas/articles/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch article');
  return res.json();
}

export async function createArticle(
  data: Partial<Article>,
  token: string
): Promise<Article> {
  const res = await fetch(`${API_URL}/api/saas/articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Failed to create article');
  return res.json();
}

export async function updateArticle(
  id: string,
  data: Partial<Article>,
  token: string
): Promise<Article> {
  const res = await fetch(`${API_URL}/api/saas/articles/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Failed to update article');
  return res.json();
}

export async function deleteArticle(
  id: string,
  token: string
): Promise<void> {
  const res = await fetch(`${API_URL}/api/saas/articles/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Failed to delete article');
}

// ─── Public endpoints ───────────────────────────────────────────────

export async function fetchPublicArticles(
  tenantId: string,
  branchId?: string | null
): Promise<Article[]> {
  const params = new URLSearchParams({ tenantId });
  if (branchId) params.set('branchId', branchId);

  const res = await fetch(`${API_URL}/api/public/articles?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch public articles');
  return res.json();
}

export async function fetchPublicArticleBySlug(
  tenantId: string,
  slug: string
): Promise<Article> {
  const url = `${API_URL}/api/public/articles/${slug}?tenantId=${tenantId}`;
  console.log('FRONTEND FETCH URL:', url);
  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) throw new Error('Failed to fetch article');
  const data = await res.json();
  console.log('FRONTEND API RESPONSE:', data);
  return data.article || data;
}
