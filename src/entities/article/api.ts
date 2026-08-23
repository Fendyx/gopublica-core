import type { Article, Event } from './types';

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

// ─── Event endpoints ────────────────────────────────────────────────

export async function fetchEvents(
  tenantId: string,
  token: string,
  branchId?: string | null
): Promise<Event[]> {
  const params = new URLSearchParams({ tenantId });
  if (branchId) params.set('branchId', branchId);

  const res = await fetch(`${API_URL}/api/saas/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export async function fetchEventById(
  id: string,
  token: string
): Promise<Event> {
  const res = await fetch(`${API_URL}/api/saas/events/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch event');
  return res.json();
}

export async function createEvent(
  data: Partial<Event>,
  token: string
): Promise<Event> {
  const res = await fetch(`${API_URL}/api/saas/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Failed to create event');
  return res.json();
}

export async function updateEvent(
  id: string,
  data: Partial<Event>,
  token: string
): Promise<Event> {
  const res = await fetch(`${API_URL}/api/saas/events/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Failed to update event');
  return res.json();
}

export async function deleteEvent(
  id: string,
  token: string
): Promise<void> {
  const res = await fetch(`${API_URL}/api/saas/events/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Failed to delete event');
}

// ─── Public endpoints ───────────────────────────────────────────────

export async function fetchPublicArticles(
  tenantId: string,
  branchId?: string | null
): Promise<Article[]> {
  const params = new URLSearchParams({ tenantId });
  if (branchId) params.set('branchId', branchId);

  const res = await fetch(`${API_URL}/api/public/articles?${params.toString()}`, {
    next: { tags: [`articles:${tenantId}`] },
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
  const res = await fetch(url, {
    next: { tags: [`articles:${tenantId}`] },
  });

  if (!res.ok) throw new Error('Failed to fetch article');
  const data = await res.json();
  console.log('FRONTEND API RESPONSE:', data);
  return data.article || data;
}

// ─── Public Event endpoints ─────────────────────────────────────────

export async function fetchPublicEvents(
  tenantId: string,
  branchId?: string | null
): Promise<Event[]> {
  const params = new URLSearchParams({ tenantId });
  if (branchId) params.set('branchId', branchId);

  const res = await fetch(`${API_URL}/api/public/events?${params.toString()}`, {
    next: { tags: [`events:${tenantId}`] },
  });

  if (!res.ok) throw new Error('Failed to fetch public events');
  return res.json();
}

export async function fetchPublicEventBySlug(
  tenantId: string,
  slug: string
): Promise<Event> {
  const url = `${API_URL}/api/public/events/${slug}?tenantId=${tenantId}`;
  const res = await fetch(url, {
    next: { tags: [`events:${tenantId}`] },
  });

  if (!res.ok) throw new Error('Failed to fetch event');
  const data = await res.json();
  return data.event || data;
}
