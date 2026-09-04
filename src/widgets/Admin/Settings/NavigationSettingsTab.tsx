'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTenant } from '@/entities/tenant/TenantContext'
import { useBranch } from '@/entities/branch/BranchContext'
import { SYSTEM_PAGES, isSystemPageEnabled, buildDefaultNavigationConfig } from '@/shared/lib/navigation'
import type { NavItem, NavigationConfig, Features } from '@/entities/tenant/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { GripVertical, ArrowRight, ArrowLeft, Save, Loader2, ListOrdered } from 'lucide-react'

// ─── Sortable Nav Item ────────────────────────────────────────────────────────
function SortableNavItem({
  item,
  onToggleVisibility,
  onMoveToDropdown,
  onMoveToPrimary,
  onLabelChange,
  isSystemPageDisabled,
}: {
  item: NavItem
  onToggleVisibility: (id: string) => void
  onMoveToDropdown: (id: string) => void
  onMoveToPrimary: (id: string) => void
  onLabelChange: (id: string, label: string) => void
  isSystemPageDisabled: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Resolve display name
  const sysPage = SYSTEM_PAGES.find((sp) => sp.slug === item.slug)
  const defaultName = sysPage ? sysPage.slug : item.slug
  const displayName = item.label || defaultName
  const isHome = item.type === 'home'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        isSystemPageDisabled
          ? 'bg-muted/30 border-muted opacity-60'
          : 'bg-background border-border hover:border-border/80'
      } ${isDragging ? 'shadow-md z-10' : ''}`}
    >
      {!isHome && (
        <div {...listeners} className="cursor-grab shrink-0 touch-none">
          <GripVertical className="w-4 h-4 text-muted-foreground hover:text-foreground transition" />
        </div>
      )}
      {isHome && <div className="w-4 shrink-0" />}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {item.type === 'system' || item.type === 'home' ? (
            <span className="text-sm font-medium capitalize">{displayName}</span>
          ) : item.type === 'custom' ? (
            <span className="text-sm font-medium">{displayName}</span>
          ) : (
            <Input
              value={item.label}
              onChange={(e) => onLabelChange(item.id, e.target.value)}
              placeholder="Link label"
              className="h-8 text-sm max-w-[200px]"
            />
          )}
          {isSystemPageDisabled && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
              Disabled
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground truncate block">{item.slug}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Visibility toggle */}
        <div className="flex items-center gap-1.5">
          <Switch
            checked={item.isVisible}
            onCheckedChange={() => onToggleVisibility(item.id)}
            disabled={isSystemPageDisabled}
            className="scale-75"
          />
        </div>

        {/* Move between zones */}
        {!isHome && (
          item.placement === 'primary' ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onMoveToDropdown(item.id)}
              disabled={isSystemPageDisabled}
              className="h-7 px-2 text-xs gap-1"
              title="Move to More dropdown"
            >
              <ArrowRight className="w-3 h-3" />
              <span className="hidden sm:inline">More</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onMoveToPrimary(item.id)}
              disabled={isSystemPageDisabled}
              className="h-7 px-2 text-xs gap-1"
              title="Move to Main menu"
            >
              <ArrowLeft className="w-3 h-3" />
              <span className="hidden sm:inline">Menu</span>
            </Button>
          )
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function NavigationSettingsTab() {
  const t = useTranslations('admin.settingsPage.navigation')
  const tenant = useTenant()
  const { selectedBranch } = useBranch()

  const [navConfig, setNavConfig] = useState<NavigationConfig>({ items: [], dropdownLabel: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  const features: Features = tenant?.features || {} as Features

  // Load navigation config on mount
  useEffect(() => {
    if (!tenant) return

    if (tenant.navigation && tenant.navigation.items.length > 0) {
      setNavConfig(tenant.navigation)
    } else {
      // Build default config from features + custom pages
      setNavConfig(buildDefaultNavigationConfig(features, selectedBranch?.customPages))
    }
    setLoading(false)
  }, [tenant, selectedBranch])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // ── Mutations ──────────────────────────────────────────────────────────────
  const updateItem = useCallback((id: string, updater: (item: NavItem) => NavItem) => {
    setNavConfig((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? updater(item) : item)),
    }))
  }, [])

  const onToggleVisibility = useCallback((id: string) => {
    updateItem(id, (item) => ({ ...item, isVisible: !item.isVisible }))
  }, [updateItem])

  const onMoveToDropdown = useCallback((id: string) => {
    updateItem(id, (item) => ({ ...item, placement: 'dropdown' }))
  }, [updateItem])

  const onMoveToPrimary = useCallback((id: string) => {
    updateItem(id, (item) => ({ ...item, placement: 'primary' }))
  }, [updateItem])

  const onLabelChange = useCallback((id: string, label: string) => {
    updateItem(id, (item) => ({ ...item, label }))
  }, [updateItem])

  // ── DnD handlers ──────────────────────────────────────────────────────────
  const handleDragEndPrimary = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setNavConfig((prev) => {
      const primary = prev.items.filter((i) => i.placement === 'primary')
      const other = prev.items.filter((i) => i.placement !== 'primary')

      const oldIndex = primary.findIndex((i) => i.id === active.id)
      const newIndex = primary.findIndex((i) => i.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return prev

      const reordered = arrayMove(primary, oldIndex, newIndex).map((item, idx) => ({
        ...item,
        order: idx,
      }))

      return { ...prev, items: [...reordered, ...other] }
    })
  }, [])

  const handleDragEndDropdown = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setNavConfig((prev) => {
      const dropdown = prev.items.filter((i) => i.placement === 'dropdown')
      const other = prev.items.filter((i) => i.placement !== 'dropdown')

      const oldIndex = dropdown.findIndex((i) => i.id === active.id)
      const newIndex = dropdown.findIndex((i) => i.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return prev

      const reordered = arrayMove(dropdown, oldIndex, newIndex).map((item, idx) => ({
        ...item,
        order: idx,
      }))

      return { ...prev, items: [...other, ...reordered] }
    })
  }, [])

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('saas_token')
      if (!token || !selectedBranch || !tenant) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          navigation: navConfig,
          branchId: selectedBranch._id,
        }),
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        // Refresh tenant context to reflect changes in Navbar
        window.location.reload()
      }
    } catch (err) {
      console.error('Failed to save navigation config:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Loading...</div>
  }

  const primaryItems = navConfig.items
    .filter((i) => i.placement === 'primary')
    .sort((a, b) => a.order - b.order)
  const dropdownItems = navConfig.items
    .filter((i) => i.placement === 'dropdown')
    .sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t('description')}</p>

      {/* Dropdown label setting */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t('dropdownLabel')}</Label>
        <Input
          value={navConfig.dropdownLabel}
          onChange={(e) => setNavConfig((prev) => ({ ...prev, dropdownLabel: e.target.value }))}
          placeholder={t('dropdownLabelPlaceholder')}
          className="max-w-xs"
        />
        <p className="text-xs text-muted-foreground">{t('dropdownLabelHint')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Primary Zone ─────────────────────────────────────────── */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <ListOrdered className="w-4 h-4" />
            {t('mainMenu')}
          </h4>
          <p className="text-xs text-muted-foreground">{t('mainMenuHint')}</p>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndPrimary}>
            <SortableContext items={primaryItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {primaryItems.map((item) => (
                  <SortableNavItem
                    key={item.id}
                    item={item}
                    onToggleVisibility={onToggleVisibility}
                    onMoveToDropdown={onMoveToDropdown}
                    onMoveToPrimary={onMoveToPrimary}
                    onLabelChange={onLabelChange}
                    isSystemPageDisabled={
                      (item.type === 'system' || item.type === 'home') &&
                      !isSystemPageEnabled(
                        SYSTEM_PAGES.find((sp) => sp.slug === item.slug)?.featureFlag ?? null,
                        features,
                      )
                    }
                  />
                ))}
                {primaryItems.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                    {t('noPrimaryItems')}
                  </p>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* ── Dropdown Zone ────────────────────────────────────────── */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <ListOrdered className="w-4 h-4" />
            {t('moreDropdown')}
          </h4>
          <p className="text-xs text-muted-foreground">{t('moreDropdownHint')}</p>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndDropdown}>
            <SortableContext items={dropdownItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {dropdownItems.map((item) => (
                  <SortableNavItem
                    key={item.id}
                    item={item}
                    onToggleVisibility={onToggleVisibility}
                    onMoveToDropdown={onMoveToDropdown}
                    onMoveToPrimary={onMoveToPrimary}
                    onLabelChange={onLabelChange}
                    isSystemPageDisabled={
                      (item.type === 'system' || item.type === 'home') &&
                      !isSystemPageEnabled(
                        SYSTEM_PAGES.find((sp) => sp.slug === item.slug)?.featureFlag ?? null,
                        features,
                      )
                    }
                  />
                ))}
                {dropdownItems.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                    {t('noDropdownItems')}
                  </p>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? t('saving') : saved ? t('saved') : t('save')}
        </Button>
        {saved && <span className="text-sm text-green-600 font-medium">{t('savedMessage')}</span>}
      </div>
    </div>
  )
}
