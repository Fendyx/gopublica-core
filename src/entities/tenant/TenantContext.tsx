'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import type { SiteConfig } from '@/entities/tenant/types'
import { normalizeTenantData } from '@/entities/tenant/utils'

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
  initialTenant,
}: {
  children: React.ReactNode
  tenantId: string
  initialTenant?: SiteConfig | null
}) {
  const [tenant, setTenant] = useState<SiteConfig | null>(initialTenant ?? null)
  const [loading, setLoading] = useState(!initialTenant)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Skip client-side fetch when the server already provided tenant data
    if (initialTenant) {
      return
    }

    if (!tenantId) {
      setLoading(false)
      return
    }

    const fetchTenant = async () => {
      try {
        setLoading(true)
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/saas/settings?tenantId=${tenantId}`,
          { cache: 'no-store' }
        )
        if (!res.ok) throw new Error('Failed to load tenant')
        const data = await res.json()
        const config = normalizeTenantData(data, tenantId)
        setTenant(config)
      } catch (err: any) {
        console.error('Tenant fetch error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTenant()
  }, [tenantId, initialTenant])

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