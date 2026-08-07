'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Branch, BranchGroup } from '@/entities/branch/types'

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
  // 👈 НОВОЕ: группировка филиалов по city -> [{ parent, children }]
  // children — подфилии (venueType 'concept'), у которых parentBranchId === parent._id
  getBranchGroups: (city: string) => BranchGroup[]
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

  // 👈 "Основные" филиалы — те, у которых нет parentBranchId (или явно venueType 'main').
  // Именно они участвуют в авто-детекции по IP и в верхнеуровневом списке городов.
  const mainBranches = branches.filter(b => !b.parentBranchId)

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

  const mainOf = (data: Branch[]) => data.filter(b => !b.parentBranchId)

  const detectCityByIp = async (branchesData?: Branch[]) => {
    const mains = branchesData ? mainOf(branchesData) : []
    try {
      const res = await fetch('/api/geolocation')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { city } = await res.json()

      if (city && mains.length) {
        const foundCity = mains.some(b => b.city?.toLowerCase() === city.toLowerCase())
        if (foundCity) {
          setSelectedCity(city)
          const firstBranchInCity = mains.find(b => b.city?.toLowerCase() === city.toLowerCase())
          if (firstBranchInCity) setSelectedBranch(firstBranchInCity)
          return
        }
      }
      // fallback
      if (mains.length) {
        const uniqueCities = [...new Set(mains.map(b => b.city).filter(Boolean) as string[])]
        const firstCity = uniqueCities[0] || mains[0].city
        if (firstCity) setSelectedCity(firstCity)
        const firstBranch = mains.find(b => b.city === firstCity)
        if (firstBranch) setSelectedBranch(firstBranch)
      }
    } catch (err) {
      console.error('IP detection failed', err)
      // fallback
      if (mains.length) {
        const uniqueCities = [...new Set(mains.map(b => b.city).filter(Boolean) as string[])]
        const firstCity = uniqueCities[0] || mains[0].city
        if (firstCity) setSelectedCity(firstCity)
        const firstBranch = mains.find(b => b.city === firstCity)
        if (firstBranch) setSelectedBranch(firstBranch)
      }
    }
  }

  const setCity = (city: string) => {
    setSelectedCity(city)
    // При смене города выбираем основной (не под-заведение) филиал в этом городе
    const branchInCity = mainBranches.find(b => b.city === city)
    if (branchInCity) setSelectedBranch(branchInCity)
  }

  const setBranch = (branch: Branch) => {
    setSelectedBranch(branch)
    setSelectedCity(branch.city)
  }

  // 👈 Группировка для UI-свитчера: для указанного города возвращает список
  // { parent, children } — родительский филиал и вложенные под-заведения.
  const getBranchGroups = (city: string): BranchGroup[] => {
    const inCity = branches.filter(b => b.city === city)
    const parents = inCity.filter(b => !b.parentBranchId)
    return parents.map(parent => ({
      parent,
      children: inCity.filter(b => b.parentBranchId === parent._id),
    }))
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
      getBranchGroups,
    }}>
      {children}
    </BranchContext.Provider>
  )
}