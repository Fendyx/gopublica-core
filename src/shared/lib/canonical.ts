/**
 * Canonical URL utilities for multi-tenant alias support.
 *
 * The backend now returns `domain` (canonical) and `aliases` (array) on the
 * tenant settings response. This module centralises the logic of resolving
 * the canonical domain from a request host and building canonical URLs for
 * SEO metadata / absolute links.
 *
 * Invariant: every absolute URL produced here MUST use the canonical domain,
 * never the request alias — even when the visitor arrived through an alias.
 */

export interface TenantDomainInfo {
  domain?: string;
  aliases?: string[];
}

/**
 * Returns the canonical domain for a tenant.
 *
 * - If the tenant payload carries a `domain`, use it.
 * - Otherwise fall back to `host` (e.g. older backend responses or dev mode).
 */
export function getCanonicalDomain(
  tenant: TenantDomainInfo | null | undefined,
  host: string
): string {
  if (tenant?.domain) return tenant.domain;
  return host;
}

/**
 * True when `host` is one of the tenant's aliases (i.e. NOT the canonical domain).
 */
export function isAlias(
  host: string,
  tenant: TenantDomainInfo | null | undefined
): boolean {
  if (!tenant) return false;
  if (host === tenant.domain) return false;
  return Boolean(tenant.aliases?.includes(host));
}

/**
 * Builds an absolute canonical URL for the given pathname.
 *
 * - Always uses the canonical domain (never the request alias).
 * - Preserves the locale prefix when present.
 */
export function buildCanonicalUrl(
  pathname: string,
  canonicalDomain: string
): string {
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `https://${canonicalDomain}${cleanPath}`;
}

/**
 * Extracts the tenantDomain segment from a Next.js params object or pathname.
 * Used by server components to know whether the request came through an alias.
 */
export function extractTenantDomainFromParams(
  params: Record<string, string | string[] | undefined>
): string | undefined {
  const value = params.tenantDomain;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}