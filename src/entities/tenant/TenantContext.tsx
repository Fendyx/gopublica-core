'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import type { SiteConfig } from '@/entities/tenant/types'

interface TenantContextType {
  tenant: SiteConfig | null
  loading: boolean
  error: string | null
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  loading: true,
  error: null,
})

export function TenantProvider({
  children,
  tenantId,
}: {
  children: React.ReactNode
  tenantId: string
}) {
  const [tenant, setTenant] = useState<SiteConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    const fetchTenant = async () => {
      try {
        setLoading(true)
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/saas/settings?tenantId=${tenantId}`
        )
        if (!res.ok) throw new Error('Failed to load tenant')
        const data = await res.json()

        // Преобразуем плоский ответ бэка в структуру SiteConfig
        const config: SiteConfig = {
          clientName: data.restaurantName ?? data.name ?? '',
          tenantId: data.tenantId ?? tenantId,
          theme: {
            primary: data.theme?.primary ?? '#ff0505',
            accent: data.theme?.accent ?? '#F1A208',
            fontHeading: data.theme?.fontHeading ?? 'playfair',
            fontBody: data.theme?.fontBody ?? 'inter',
            heroStyle: data.theme?.heroStyle ?? 'video',
          },
          features: {
            hasMenu: data.features?.hasMenu ?? true,
            hasBooking: data.features?.hasBooking ?? true,
            hasDelivery: data.features?.hasDelivery ?? false,
            hasClickCollect: data.features?.hasClickCollect ?? false,
            hasGallery: data.features?.hasGallery ?? true,
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
          menuStyle: data.theme?.menuStyle ?? 'grid',
          galleryStyle: data.theme?.galleryStyle ?? 'bento',
          heroVideoUrl: data.theme?.heroVideoUrl ?? '',
          heroPosterUrl: data.theme?.heroPosterUrl ?? '',
          heroSliderImages: data.theme?.heroSliderImages ?? [],
          heroBgImage: data.theme?.heroBgImage ?? '',
        }
        setTenant(config)
      } catch (err: any) {
        console.error('Tenant fetch error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTenant()
  }, [tenantId])

  return (
    <TenantContext.Provider value={{ tenant, loading, error }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant(): SiteConfig | null {
  const { tenant } = useContext(TenantContext)
  return tenant
}

export function useTenantContext() {
  return useContext(TenantContext)
}