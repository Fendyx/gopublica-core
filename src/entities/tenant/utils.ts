import type { ModuleAccess, Niche, SiteConfig } from '@/entities/tenant/types'

function normalizeNiche(value: unknown): Niche {
  const normalized = String(value ?? '').toLowerCase()
  if (normalized === 'restaurant') return 'food'
  if (['food', 'beauty', 'ecommerce', 'auto'].includes(normalized)) {
    return normalized as Niche
  }
  return 'auto'
}

function normalizeModuleAccess(data: any): ModuleAccess {
  const raw = data?.moduleAccess ?? {}
  const normalizeState = (value: any) => ({
    enabled: Boolean(value?.enabled ?? value?.canManage ?? false),
    canManage: Boolean(value?.canManage ?? value?.enabled ?? false),
  })

  return {
    orders: normalizeState(raw.orders ?? { enabled: data?.canManageOrders ?? false, canManage: data?.canManageOrders ?? false }),
    menu: normalizeState(raw.menu ?? { enabled: data?.canManageMenu ?? false, canManage: data?.canManageMenu ?? false }),
    reservations: normalizeState(raw.reservations ?? { enabled: data?.canManageReservations ?? true, canManage: data?.canManageReservations ?? true }),
    gallery: normalizeState(raw.gallery ?? { enabled: data?.canManageGallery ?? true, canManage: data?.canManageGallery ?? true }),
    news: normalizeState(raw.news ?? { enabled: data?.canManageNews ?? true, canManage: data?.canManageNews ?? true }),
    jobs: normalizeState(raw.jobs ?? { enabled: data?.canManageJobs ?? true, canManage: data?.canManageJobs ?? true }),
  }
}

/**
 * Normalizes raw backend tenant data into the SiteConfig shape used by the UI.
 * Used both for server-provided initialTenant and client-side fetches.
 */
export function normalizeTenantData(data: any, fallbackTenantId: string): SiteConfig {
  const niche = normalizeNiche(data?.niche ?? data?.businessType ?? 'auto')
  const moduleAccess = normalizeModuleAccess(data)
  const hasModuleAccessPayload = Boolean(data?.moduleAccess || data?.canManageMenu !== undefined || data?.canManageOrders !== undefined)

  const canManageOrders = hasModuleAccessPayload
    ? Boolean(data?.canManageOrders ?? moduleAccess.orders?.canManage ?? false)
    : Boolean(data?.features?.hasOnlineOrdering ?? false)
  const canManageMenu = hasModuleAccessPayload
    ? Boolean(data?.canManageMenu ?? moduleAccess.menu?.canManage ?? false)
    : Boolean(data?.features?.hasMenu ?? false)
  const canManageReservations = hasModuleAccessPayload
    ? Boolean(data?.canManageReservations ?? moduleAccess.reservations?.canManage ?? false)
    : Boolean(data?.features?.hasBooking ?? false)
  const canManageGallery = hasModuleAccessPayload
    ? Boolean(data?.canManageGallery ?? moduleAccess.gallery?.canManage ?? false)
    : Boolean(data?.features?.hasGallery ?? false)
  const canManageNews = hasModuleAccessPayload
    ? Boolean(data?.canManageNews ?? moduleAccess.news?.canManage ?? false)
    : Boolean(data?.features?.hasJobApplications ?? false)
  const canManageJobs = hasModuleAccessPayload
    ? Boolean(data?.canManageJobs ?? moduleAccess.jobs?.canManage ?? false)
    : Boolean(data?.features?.hasJobApplications ?? false)

  return {
    clientName: data.restaurantName ?? data.name ?? '',
    businessName: data.businessName || '',
    tenantId: data.tenantId ?? fallbackTenantId,
    niche,
    businessType: data.businessType ?? niche,
    moduleAccess,
    availableModules: Array.isArray(data.availableModules) && data.availableModules.length > 0
      ? data.availableModules
      : Object.entries(moduleAccess)
          .filter(([, value]) => Boolean(value?.enabled))
          .map(([key]) => key),
    canManageOrders,
    canManageMenu,
    canManageReservations,
    canManageGallery,
    canManageNews,
    canManageJobs,
    theme: {
      primary: data.theme?.primary ?? '#ff0505',
      accent: data.theme?.accent ?? '#F1A208',
      fontHeading: data.theme?.fontHeading ?? 'playfair',
      fontBody: data.theme?.fontBody ?? 'inter',
      heroStyle: data.theme?.heroStyle ?? 'video',
      heroVideoUrl: data.theme?.heroVideoUrl ?? '',
      heroPosterUrl: data.theme?.heroPosterUrl ?? '',
      heroSliderImages: data.theme?.heroSliderImages ?? [],
      heroBgImage: data.theme?.heroBgImage ?? '',
      heroSplitImage: data.theme?.heroSplitImage ?? '',
      menuStyle: data.theme?.menuStyle ?? 'grid',
      galleryStyle: data.theme?.galleryStyle ?? 'bento',
      ecommerceLayout: data.theme?.ecommerceLayout ?? 'grid-3',
      radius: data.theme?.radius ?? 'lg',
      productCardVariant: data.theme?.productCardVariant ?? 'action-bar',
      categoryBgColor: data.theme?.categoryBgColor ?? '',
    },
    features: {
      hasMenu: data.features?.hasMenu ?? canManageMenu ?? true,
      hasBooking: data.features?.hasBooking ?? canManageReservations ?? true,
      hasDelivery: data.features?.hasDelivery ?? false,
      hasClickCollect: data.features?.hasClickCollect ?? false,
      hasGallery: data.features?.hasGallery ?? canManageGallery ?? true,
      hasOnlineOrdering: data.features?.hasOnlineOrdering ?? canManageOrders ?? false,
      hasJobApplications: data.features?.hasJobApplications ?? canManageJobs ?? false,
    },
    contact: {
      phone: data.phone ?? '',
      address: data.address ?? '',
      email: data.email ?? '',
      hours: data.hours ?? '',
      googleMapsUrl: data.googleMapsUrl ?? '',
    },
    seo: {
      title: data.seoTitle ?? '',
      description: data.seoDescription ?? '',
    },
  }
}
