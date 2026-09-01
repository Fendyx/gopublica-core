'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Branch, BranchGroup } from '@/entities/branch/types'

// Session-level cache: geolocation only needs to fire once per browser session,
// not on every component mount or route navigation.
let geoResolved = false

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
  initialBranch?: Branch | null
  token?: string // JWT token for authenticated requests
}

export function BranchProvider({ children, tenantId, initialBranch, token }: Props) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedCity, setSelectedCity] = useState<string | null>(
    initialBranch ? initialBranch.city : null
  )
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(
    initialBranch ?? null
  )
  const [loading, setLoading] = useState(!initialBranch)

  const cities = [...new Set(branches.map((b: Branch) => b.city).filter((c): c is string => !!c))]

  // 👈 "Основные" филиалы — те, у которых нет parentBranchId (или явно venueType 'main').
  // Именно они участвуют в авто-детекции по IP и в верхнеуровневом списке городов.
  const mainBranches = branches.filter(b => !b.parentBranchId)

  const fetchBranches = async () => {
    if (!tenantId) return []
    try {
      // Use authenticated endpoint when token is available (admin panel)
      // Fall back to public endpoint for public site
      const url = token
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/saas/branches`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/saas/branches/public/${tenantId}`
      
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const res = await fetch(url, { headers })
      const data: Branch[] = await res.json()
      setBranches(data)
      // If we have an initialBranch, ensure it's in the branches list
      if (initialBranch && !data.some(b => b._id === initialBranch._id)) {
        setBranches([initialBranch, ...data])
      }
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
    // If initialBranch was provided (from [branchSlug] layout), skip IP detection
    if (initialBranch) {
      fetchBranches()
      return
    }
    // Always fetch branches — even if geolocation was already resolved this session.
    // The geoResolved flag only controls IP detection, not branch fetching.
    fetchBranches().then(data => {
      if (!geoResolved) {
        // First time: run IP-based city detection, then finalize loading
        detectCityByIp(data).then(() => setLoading(false))
      } else {
        // Geolocation already resolved — auto-select first branch if none selected
        if (!selectedBranch && data.length > 0) {
          const first = data.find(b => !b.parentBranchId) || data[0]
          if (first) {
            setSelectedBranch(first)
            setSelectedCity(first.city)
          }
        }
        setLoading(false)
      }
    })
  }, [tenantId, initialBranch])

  const mainOf = (data: Branch[]) => data.filter(b => !b.parentBranchId)

  const detectCityByIp = async (branchesData?: Branch[]) => {
    // Skip if geolocation was already resolved during this browser session
    if (geoResolved) return
    geoResolved = true

    const mains = branchesData ? mainOf(branchesData) : []
    // Prefer main branches, but fall back to any branch if none exist
    const candidates = mains.length > 0 ? mains : (branchesData || [])

    const selectFirstBranchInCity = (cityName: string) => {
      const found = candidates.find(
        b => b.city?.toLowerCase() === cityName.toLowerCase()
      )
      if (found) {
        setSelectedCity(cityName)
        setSelectedBranch(found)
        return true
      }
      return false
    }

    const selectFirstAvailable = () => {
      if (candidates.length === 0) return
      const uniqueCities = [
        ...new Set(candidates.map(b => b.city).filter(Boolean) as string[]),
      ]
      const firstCity = uniqueCities[0] || candidates[0].city
      if (firstCity) setSelectedCity(firstCity)
      const firstBranch = candidates.find(b => b.city === firstCity)
      if (firstBranch) setSelectedBranch(firstBranch)
    }

    try {
      const res = await fetch('/api/geolocation')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { city } = await res.json()

      if (city) {
        if (selectFirstBranchInCity(city)) return
      }
      // City not found among branches — pick first available
      selectFirstAvailable()
    } catch (err) {
      console.error('IP detection failed', err)
      // Fallback: select first available branch
      selectFirstAvailable()
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