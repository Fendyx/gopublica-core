import type { Features, NavItem, NavigationConfig, SiteConfig } from '@/entities/tenant/types'
import type { CustomPage } from '@/entities/branch/types'

// ─── Canonical list of system pages ────────────────────────────────────────────
// This drives both the admin UI and the storefront rendering.
// `featureFlag` = null means always available; otherwise gated by Features.
export const SYSTEM_PAGES = [
  { slug: 'home',         type: 'home' as const,   featureFlag: null,                    defaultLabelKey: 'home' },
  { slug: 'menu',         type: 'system' as const, featureFlag: 'hasMenu',              defaultLabelKey: 'menu' },
  { slug: 'catalog',      type: 'system' as const, featureFlag: 'hasOnlineOrdering',    defaultLabelKey: 'catalog' },
  { slug: 'gallery',      type: 'system' as const, featureFlag: 'hasGallery',           defaultLabelKey: 'gallery' },
  { slug: 'partners',     type: 'system' as const, featureFlag: null,                    defaultLabelKey: 'partners' },
  { slug: 'contacts',     type: 'system' as const, featureFlag: null,                    defaultLabelKey: 'contact' },
  { slug: 'articles',     type: 'system' as const, featureFlag: null,                    defaultLabelKey: 'articles' },
  { slug: 'reservations', type: 'system' as const, featureFlag: 'hasBooking',           defaultLabelKey: 'booking' },
] as const

export type SystemPageEntry = (typeof SYSTEM_PAGES)[number]

/** Check if a system page is enabled by its feature flag (or always if null). */
export function isSystemPageEnabled(
  featureFlag: keyof Features | null,
  features: Features,
): boolean {
  if (!featureFlag) return true
  return Boolean(features[featureFlag])
}

// ─── Label resolution ──────────────────────────────────────────────────────────
// For system pages, we use i18n keys. For custom pages, we use the page title.
// For external links, we use the stored label.

export interface ResolvedNavLink {
  id: string
  href: string
  label: string
  isVisible: boolean
  placement: 'primary' | 'dropdown'
  order: number
  type: NavItem['type']
}

interface GetNavLinksOptions {
  navigation?: NavigationConfig
  tenant: SiteConfig | null
  customPages?: CustomPage[]
  locale: string
  branchSlug: string
  /** i18n translate function scoped to 'nav' namespace — t('home'), etc. */
  t: (key: string) => string
}

/**
 * Resolves navigation items into primary and dropdown link arrays.
 *
 * If no navigation config exists (backwards compatibility), falls back to the
 * current hardcoded link behavior based on feature flags.
 */
export function getNavLinks({
  navigation,
  tenant,
  customPages,
  locale,
  branchSlug,
  t,
}: GetNavLinksOptions): { primary: ResolvedNavLink[]; dropdown: ResolvedNavLink[] } {
  const features = tenant?.features

  // ── Fallback: no navigation config → use current hardcoded logic ──────────
  if (!navigation || !navigation.items || navigation.items.length === 0) {
    const allLinks: ResolvedNavLink[] = []

    // Home — always first
    allLinks.push({
      id: 'home',
      href: `/${locale}/${branchSlug}`,
      label: t('home'),
      isVisible: true,
      placement: 'primary',
      order: 0,
      type: 'home',
    })

    // System pages from feature flags
    if (features?.hasMenu) {
      allLinks.push({
        id: 'menu',
        href: `/${locale}/${branchSlug}/menu`,
        label: t('menu'),
        isVisible: true,
        placement: 'primary',
        order: 10,
        type: 'system',
      })
    }
    if (features?.hasOnlineOrdering) {
      allLinks.push({
        id: 'catalog',
        href: `/${locale}/${branchSlug}/catalog`,
        label: t('catalog'),
        isVisible: true,
        placement: 'primary',
        order: 20,
        type: 'system',
      })
    }
    if (features?.hasGallery) {
      allLinks.push({
        id: 'gallery',
        href: `/${locale}/${branchSlug}/gallery`,
        label: t('gallery'),
        isVisible: true,
        placement: 'primary',
        order: 30,
        type: 'system',
      })
    }

    // Partners — always
    allLinks.push({
      id: 'partners',
      href: `/${locale}/${branchSlug}/partners`,
      label: t('partners'),
      isVisible: true,
      placement: 'primary',
      order: 40,
      type: 'system',
    })

    // Contact — always
    allLinks.push({
      id: 'contacts',
      href: `/${locale}/${branchSlug}/contacts`,
      label: t('contact'),
      isVisible: true,
      placement: 'primary',
      order: 50,
      type: 'system',
    })

    // Custom pages from Branch.customPages[]
    const cps = customPages || []
    cps
      .filter((cp) => cp.isActive)
      .forEach((cp, i) => {
        allLinks.push({
          id: `custom-${cp.slug}`,
          href: `/${locale}/${branchSlug}/p/${cp.slug}`,
          label: cp.title,
          isVisible: true,
          placement: 'dropdown',
          order: 60 + i,
          type: 'custom',
        })
      })

    return {
      primary: allLinks.filter((l) => l.placement === 'primary'),
      dropdown: allLinks.filter((l) => l.placement === 'dropdown'),
    }
  }

  // ── Config-based rendering ────────────────────────────────────────────────
  const { items, dropdownLabel } = navigation
  const resolved: ResolvedNavLink[] = []

  for (const item of items) {
    // Check feature flag for system pages
    if (item.type === 'system' || item.type === 'home') {
      const sysPage = SYSTEM_PAGES.find((sp) => sp.slug === item.slug)
      if (sysPage && !isSystemPageEnabled(sysPage.featureFlag, features || ({} as Features))) {
        continue // Feature disabled — skip this item
      }
    }

    // Resolve href
    let href = ''
    if (item.type === 'home') {
      href = `/${locale}/${branchSlug}`
    } else if (item.type === 'system') {
      href = `/${locale}/${branchSlug}/${item.slug}`
    } else if (item.type === 'custom') {
      // Check if this custom page actually exists on the current branch
      const cpExists = customPages?.some((cp) => cp.slug === item.slug && cp.isActive)
      if (!cpExists) continue // Skip missing/deleted custom pages
      href = `/${locale}/${branchSlug}/p/${item.slug}`
    } else if (item.type === 'external') {
      href = item.slug // For external links, slug stores the full URL
    }

    // Resolve label
    let label = item.label
    if (!label) {
      if (item.type === 'home' || item.type === 'system') {
        const sysPage = SYSTEM_PAGES.find((sp) => sp.slug === item.slug)
        label = sysPage ? t(sysPage.defaultLabelKey) : item.slug
      } else if (item.type === 'custom') {
        const cp = customPages?.find((c) => c.slug === item.slug)
        label = cp?.title || item.slug
      } else {
        label = item.slug
      }
    }

    resolved.push({
      id: item.id,
      href,
      label,
      isVisible: item.isVisible,
      placement: item.placement,
      order: item.order,
      type: item.type,
    })
  }

  // Sort by order within each group
  const visible = resolved.filter((l) => l.isVisible)
  visible.sort((a, b) => a.order - b.order)

  return {
    primary: visible.filter((l) => l.placement === 'primary'),
    dropdown: visible.filter((l) => l.placement === 'dropdown'),
  }
}

/**
 * Returns all visible nav links (both primary and dropdown) in order.
 * Used by Footer which shows everything without the "More" grouping.
 */
export function getAllVisibleNavLinks(options: GetNavLinksOptions): ResolvedNavLink[] {
  const { primary, dropdown } = getNavLinks(options)
  return [...primary, ...dropdown].sort((a, b) => a.order - b.order)
}

/**
 * Builds the default navigation config from feature flags + custom pages.
 * Used by the admin UI to initialize the config when none exists yet.
 */
export function buildDefaultNavigationConfig(
  features: Features | undefined,
  customPages?: CustomPage[],
): NavigationConfig {
  const items: NavItem[] = []
  let order = 0

  for (const sp of SYSTEM_PAGES) {
    const enabled = isSystemPageEnabled(sp.featureFlag, features || ({} as Features))
    items.push({
      id: sp.slug,
      type: sp.type,
      slug: sp.slug,
      label: '',
      isVisible: enabled,
      placement: 'primary',
      order: order++,
    })
  }

  // Add custom pages as dropdown by default
  const cps = customPages || []
  for (const cp of cps.filter((c) => c.isActive)) {
    items.push({
      id: `custom-${cp.slug}`,
      type: 'custom',
      slug: cp.slug,
      label: cp.title,
      isVisible: true,
      placement: 'dropdown',
      order: order++,
    })
  }

  return { items, dropdownLabel: '' }
}
