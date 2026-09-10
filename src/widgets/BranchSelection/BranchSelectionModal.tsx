'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { MapPin, Navigation, ChevronDown, ChevronRight, Check, Loader2, Store } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useBranch } from '@/entities/branch/BranchContext'
import { useBranchSelection } from '@/widgets/BranchSelection/useBranchSelection'
import { haversineDistance, formatDistance } from '@/shared/lib/geo'
import type { Branch } from '@/entities/branch/types'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function BranchSelectionModal({ open, onOpenChange }: Props) {
  const t = useTranslations('branchSelection')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const { branches, selectedBranch } = useBranch()
  const { setSelection } = useBranchSelection()

  const [expandedCity, setExpandedCity] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Only show main branches (no parentBranchId) in the top-level list
  const mainBranches = useMemo(
    () => branches.filter((b) => !b.parentBranchId && b.isActive),
    [branches],
  )

  // Unique cities from main branches
  const cities = useMemo(
    () => [...new Set(mainBranches.map((b) => b.city).filter(Boolean))] as string[],
    [mainBranches],
  )

  // Branches grouped by city, sorted by distance if user location is available
  const branchesByCity = useMemo(() => {
    const grouped: Record<string, Branch[]> = {}
    for (const city of cities) {
      const cityBranches = mainBranches.filter((b) => b.city === city)
      if (userLocation) {
        cityBranches.sort((a, b) => {
          const distA = a.coordinates ? haversineDistance(userLocation.lat, userLocation.lng, a.coordinates.lat, a.coordinates.lng) : Infinity
          const distB = b.coordinates ? haversineDistance(userLocation.lat, userLocation.lng, b.coordinates.lat, b.coordinates.lng) : Infinity
          return distA - distB
        })
      }
      grouped[city] = cityBranches
    }
    return grouped
  }, [mainBranches, cities, userLocation])

  // "Nearby" branches — all branches sorted by distance (across cities)
  const nearbyBranches = useMemo(() => {
    if (!userLocation) return []
    return [...mainBranches]
      .map((b) => ({
        ...b,
        distance: b.coordinates
          ? haversineDistance(userLocation.lat, userLocation.lng, b.coordinates.lat, b.coordinates.lng)
          : Infinity,
      }))
      .filter((b) => b.distance !== Infinity)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5)
  }, [mainBranches, userLocation])

  // Auto-expand the city of the currently selected branch
  useEffect(() => {
    if (open && selectedBranch?.city) {
      setExpandedCity(selectedBranch.city)
    }
  }, [open, selectedBranch?.city])

  const handleSelect = useCallback(
    (branch: Branch) => {
      setSelection(branch.slug, branch.city)
      onOpenChange(false)
      // Navigate to the branch — use current pathname with the new branch slug
      const pathParts = pathname.split('/')
      // Find the locale segment and replace everything after it
      const localeIndex = pathParts.findIndex((p) => p === locale)
      if (localeIndex >= 0) {
        const newPath = `/${locale}/${branch.slug}`
        router.push(newPath)
      } else {
        router.push(`/${locale}/${branch.slug}`)
      }
    },
    [setSelection, onOpenChange, pathname, locale, router],
  )

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(t('locationNotSupported'))
      return
    }
    setLocationLoading(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
        setLocationLoading(false)
      },
      (error) => {
        setLocationLoading(false)
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError(t('locationDenied'))
        } else {
          setLocationError(t('locationError'))
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  }, [t])

  const toggleCity = useCallback(
    (city: string) => {
      setExpandedCity((prev) => (prev === city ? null : city))
    },
    [],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0"
        showCloseButton={true}
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking outside — user must select a branch
          // But allow closing via the X button
          e.preventDefault()
        }}
      >
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="text-lg">{t('title')}</DialogTitle>
          <DialogDescription className="text-sm text-text-tertiary">
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        {/* Use my location button */}
        <div className="px-5 py-3 border-b border-border">
          <Button
            variant="outline"
            onClick={handleUseMyLocation}
            disabled={locationLoading}
            className="w-full justify-start gap-2"
          >
            {locationLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Navigation size={16} />
            )}
            {locationLoading ? t('detecting') : t('useMyLocation')}
          </Button>
          {locationError && (
            <p className="text-xs text-destructive mt-1.5">{locationError}</p>
          )}
        </div>

        {/* Branch list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
          {/* Nearby section (when user location is available) */}
          {nearbyBranches.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                {t('nearby')}
              </h3>
              <div className="space-y-1">
                {nearbyBranches.map((branch) => (
                  <BranchItem
                    key={branch._id}
                    branch={branch}
                    distance={branch.distance}
                    isSelected={selectedBranch?._id === branch._id}
                    onSelect={handleSelect}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All cities */}
          {cities.map((city) => {
            const cityBranches = branchesByCity[city] || []
            const isExpanded = expandedCity === city
            return (
              <div key={city} className="rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => toggleCity(city)}
                  className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <MapPin size={14} className="text-primary shrink-0" />
                    {city}
                    <span className="text-xs text-text-tertiary font-normal">
                      ({cityBranches.length})
                    </span>
                  </span>
                  {isExpanded ? (
                    <ChevronDown size={14} className="text-text-tertiary shrink-0" />
                  ) : (
                    <ChevronRight size={14} className="text-text-tertiary shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-1">
                    {cityBranches.map((branch) => (
                      <BranchItem
                        key={branch._id}
                        branch={branch}
                        isSelected={selectedBranch?._id === branch._id}
                        onSelect={handleSelect}
                        t={t}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── Branch item sub-component ────────────────────────────────── */

function BranchItem({
  branch,
  distance,
  isSelected,
  onSelect,
  t,
}: {
  branch: Branch & { distance?: number }
  distance?: number
  isSelected: boolean
  onSelect: (branch: Branch) => void
  t: ReturnType<typeof useTranslations>
}) {
  return (
    <button
      onClick={() => onSelect(branch)}
      className={cn(
        'flex items-start gap-3 w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all',
        isSelected
          ? 'bg-primary/5 border border-primary/20'
          : 'hover:bg-surface-hover border border-transparent',
      )}
    >
      <Store
        size={16}
        className={cn('mt-0.5 shrink-0', isSelected ? 'text-primary' : 'text-text-tertiary')}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'font-medium truncate',
              isSelected ? 'text-primary' : 'text-text-primary',
            )}
          >
            {branch.name}
          </span>
          {branch.isDefault && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">
              {t('popular')}
            </span>
          )}
        </div>
        {branch.address && (
          <p className="text-xs text-text-tertiary mt-0.5 truncate">{branch.address}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {distance !== undefined && distance !== Infinity && (
          <span className="text-xs text-text-tertiary whitespace-nowrap">
            {formatDistance(distance)}
          </span>
        )}
        {isSelected && <Check size={14} className="text-primary" />}
      </div>
    </button>
  )
}
