'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Branch } from '@/entities/branch/types'

interface BranchContextType {
  branches: Branch[]
  cities: string[]
  selectedCity: string | null
  selectedBranch: Branch | null
  loading: boolean
  setCity: (city: string) => void
  setBranch: (branch: Branch) => void
  detectCityByIp: () => Promise<void>
  refetchBranches: () => Promise<void>
}

const BranchContext = createContext<BranchContextType | undefined>(undefined)

export function useBranch() {
  const context = useContext(BranchContext)
  if (!context) throw new Error('useBranch must be used within BranchProvider')
  return context
}

interface Props {
  children: React.ReactNode
  tenantId: string
}

export function BranchProvider({ children, tenantId }: Props) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [loading, setLoading] = useState(true)

  const cities = [...new Set(branches.map((b: Branch) => b.city).filter((c): c is string => !!c))]

  const fetchBranches = async () => {
    if (!tenantId) return []
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/branches/public/${tenantId}`)
      const data: Branch[] = await res.json()
      setBranches(data)
      return data
    } catch (err) {
      console.error(err)
      return []
    }
  }

  const refetchBranches = async () => {
    const data = await fetchBranches()
    if (selectedCity && !data.some(b => b.city === selectedCity)) {
      setSelectedCity(null)
      setSelectedBranch(null)
    }
  }

  useEffect(() => {
    fetchBranches().then(data => {
      detectCityByIp(data)
      setLoading(false)
    })
  }, [tenantId])

  const detectCityByIp = async (branchesData?: Branch[]) => {
    try {
      const res = await fetch('/api/geolocation')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { city } = await res.json()

      if (city && branchesData?.length) {
        const foundCity = branchesData.some(b => b.city?.toLowerCase() === city.toLowerCase())
        if (foundCity) {
          setSelectedCity(city)
          const firstBranchInCity = branchesData.find(b => b.city?.toLowerCase() === city.toLowerCase())
          if (firstBranchInCity) setSelectedBranch(firstBranchInCity)
          return
        }
      }
      // fallback
      if (branchesData?.length) {
        const uniqueCities = [...new Set(branchesData.map(b => b.city).filter(Boolean) as string[])]
        const firstCity = uniqueCities[0] || branchesData[0].city
        if (firstCity) setSelectedCity(firstCity)
        const firstBranch = branchesData.find(b => b.city === firstCity)
        if (firstBranch) setSelectedBranch(firstBranch)
      }
    } catch (err) {
      console.error('IP detection failed', err)
      // fallback
      if (branchesData?.length) {
        const uniqueCities = [...new Set(branchesData.map(b => b.city).filter(Boolean) as string[])]
        const firstCity = uniqueCities[0] || branchesData[0].city
        if (firstCity) setSelectedCity(firstCity)
        const firstBranch = branchesData.find(b => b.city === firstCity)
        if (firstBranch) setSelectedBranch(firstBranch)
      }
    }
  }

  const setCity = (city: string) => {
    setSelectedCity(city)
    const branchInCity = branches.find(b => b.city === city)
    if (branchInCity) setSelectedBranch(branchInCity)
  }

  const setBranch = (branch: Branch) => {
    setSelectedBranch(branch)
    setSelectedCity(branch.city)
  }

  return (
    <BranchContext.Provider value={{
      branches,
      cities,
      selectedCity,
      selectedBranch,
      loading,
      setCity,
      setBranch,
      detectCityByIp,
      refetchBranches,
    }}>
      {children}
    </BranchContext.Provider>
  )
}