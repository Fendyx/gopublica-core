'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTenant } from '@/entities/tenant/TenantContext'
import { useBranch } from '@/entities/branch/BranchContext'
import { useOmniSearch } from './useOmniSearch'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Search, X, Package, Tag, FolderOpen, ArrowRight } from 'lucide-react'

// ── Flat result item for keyboard navigation ─────────────────────────────────
interface FlatItem {
  id: string
  type: 'product' | 'category' | 'attribute'
  name: string
  href: string
  image?: string
  price?: number
  compareAtPrice?: number | null
  productCount?: number
}

interface OmniSearchDropdownProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function OmniSearchDropdown({
  open,
  onOpenChange,
}: OmniSearchDropdownProps) {
  const t = useTenant()
  const tSearch = useTranslations('search')
  const locale = useLocale()
  const router = useRouter()
  const { selectedBranch } = useBranch()

  const tenantId = t?.tenantId ?? ''
  const branchSlug = selectedBranch?.slug ?? ''

  const { query, setQuery, results, loading, error } = useOmniSearch({
    tenantId,
    branchId: selectedBranch?._id,
    locale,
    enabled: open,
  })

  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Build flat list for keyboard navigation ──────────────────────────────
  const flatItems = useMemo<FlatItem[]>(() => {
    const items: FlatItem[] = []

    results.products.forEach((p) => {
      items.push({
        id: `p-${p._id}`,
        type: 'product',
        name: p.name,
        href: `/${locale}/${branchSlug}/catalog/${p._id}`,
        image: p.image,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
      })
    })

    results.categories.forEach((c) => {
      items.push({
        id: `c-${c.key}`,
        type: 'category',
        name: c.name,
        href: `/${locale}/${branchSlug}/catalog/${c.key}`,
        image: c.coverImage || undefined,
      })
    })

    results.attributes.forEach((a) => {
      items.push({
        id: `a-${a._id}`,
        type: 'attribute',
        name: a.name,
        href: `/${locale}/${branchSlug}/catalog?attribute=${a.slug}`,
        image: a.image || undefined,
        productCount: a.productCount,
      })
    })

    return items
  }, [results, locale, branchSlug])

  const hasResults = flatItems.length > 0
  const hasQuery = query.trim().length >= 2

  // ── Reset active index when results change ───────────────────────────────
  useEffect(() => {
    setActiveIndex(0)
  }, [flatItems.length, query])

  // ── Scroll active item into view ─────────────────────────────────────────
  useEffect(() => {
    if (!listRef.current) return
    const activeEl = listRef.current.querySelector(`[data-index="${activeIndex}"]`)
    activeEl?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  // ── Focus input when opened ──────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  // ── Click outside to close ───────────────────────────────────────────────
  // NOTE: two instances of this dropdown are mounted at the same time (desktop
  // + mobile, one of them hidden via CSS). A click inside the visible instance
  // must NOT be treated as "outside" by the hidden sibling — otherwise the
  // dropdown unmounts on mousedown, the click never lands on the result button
  // and navigation never happens (Enter still worked because it emits no mousedown).
  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (!target) return
      if (dropdownRef.current?.contains(target)) return
      if (inputRef.current?.contains(target)) return
      // Click inside any omni-search dropdown instance (visible one) — keep open
      if (target.closest?.('[data-omni-search]')) return
      // Click on the navbar trigger button — it toggles via its own onClick
      if (target.closest?.('[data-omni-search-trigger]')) return
      onOpenChange(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, onOpenChange])

  // ── Clear query when closing ─────────────────────────────────────────────
  useEffect(() => {
    if (!open) setQuery('')
  }, [open, setQuery])

  // ── Navigate to item ─────────────────────────────────────────────────────
  const navigateTo = useCallback(
    (item: FlatItem) => {
      // Navigate first, then close — avoids unmount before push completes
      router.push(item.href)
      // Defer close/clear to next tick so router.push has time to initiate
      setTimeout(() => {
        onOpenChange(false)
        setQuery('')
      }, 0)
    },
    [onOpenChange, router, setQuery],
  )

  // ── Keyboard handler ─────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((prev) => Math.min(prev + 1, flatItems.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && flatItems[activeIndex]) {
        e.preventDefault()
        navigateTo(flatItems[activeIndex])
      } else if (e.key === 'Escape') {
        onOpenChange(false)
      }
    },
    [flatItems, activeIndex, navigateTo, onOpenChange],
  )

  if (!open) return null

  return (
    <div
      ref={dropdownRef}
      data-omni-search
      className="absolute top-full left-0 min-w-[500px] mt-2 z-50 bg-popover border border-border rounded-xl shadow-lg overflow-hidden"
    >
      {/* ── Inline Search Input ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Search className="w-5 h-5 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tSearch('placeholder')}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          autoComplete="off"
          spellCheck={false}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
        <button
          onClick={() => onOpenChange(false)}
          className="p-1 rounded-md hover:bg-muted transition-colors text-xs text-muted-foreground border border-border px-1.5 py-0.5 font-medium"
        >
          Esc
        </button>
      </div>

      {/* ── Results Area ──────────────────────────────────────────────── */}
      <div ref={listRef} className="max-h-[400px] overflow-y-auto">
        {loading && hasQuery && (
          <div className="p-4 space-y-3">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        )}

        {error && (
          <div className="p-6 text-center text-sm text-destructive">{error}</div>
        )}

        {!hasQuery && !loading && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            {tSearch('hint')}
          </div>
        )}

        {hasQuery && !loading && !hasResults && !error && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            {tSearch('noResults')}{query}{tSearch('noResultsEnd')}
          </div>
        )}

        {hasResults && !loading && (
          <div className="py-2">
            {results.products.length > 0 && (
              <ResultGroup
                icon={<Package className="w-3.5 h-3.5" />}
                label={tSearch('products')}
                items={flatItems.filter((i) => i.type === 'product')}
                flatItems={flatItems}
                activeIndex={activeIndex}
                onHover={setActiveIndex}
                onClick={navigateTo}
                renderItem={(item) => <ProductItem product={item} />}
              />
            )}
            {results.categories.length > 0 && (
              <ResultGroup
                icon={<FolderOpen className="w-3.5 h-3.5" />}
                label={tSearch('categories')}
                items={flatItems.filter((i) => i.type === 'category')}
                flatItems={flatItems}
                activeIndex={activeIndex}
                onHover={setActiveIndex}
                onClick={navigateTo}
                renderItem={(item) => <CategoryItem category={item} />}
              />
            )}
            {results.attributes.length > 0 && (
              <ResultGroup
                icon={<Tag className="w-3.5 h-3.5" />}
                label={tSearch('brandsFilters')}
                items={flatItems.filter((i) => i.type === 'attribute')}
                flatItems={flatItems}
                activeIndex={activeIndex}
                onHover={setActiveIndex}
                onClick={navigateTo}
                renderItem={(item) => <AttributeItem attribute={item} />}
              />
            )}
          </div>
        )}
      </div>

      {hasResults && !loading && (
        <div className="px-4 py-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/30">
          <span>{tSearch('resultCount', { count: flatItems.length })}</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-border bg-background text-[10px]">↑↓</kbd>
              {tSearch('navigate')}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-border bg-background text-[10px]">↵</kbd>
              {tSearch('select')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Result Group ─────────────────────────────────────────────────────────────

function ResultGroup({
  icon, label, items, flatItems, activeIndex, onHover, onClick, renderItem,
}: {
  icon: React.ReactNode
  label: string
  items: FlatItem[]
  flatItems: FlatItem[]
  activeIndex: number
  onHover: (index: number) => void
  onClick: (item: FlatItem) => void
  renderItem: (item: FlatItem) => React.ReactNode
}) {
  if (items.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {icon}
        {label}
      </div>
      {items.map((item) => {
        const globalIdx = flatItems.findIndex((fi) => fi.id === item.id)
        const isActive = globalIdx === activeIndex
        return (
          <div key={item.id} className="px-2">
            <button
              data-index={globalIdx}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                isActive ? 'bg-muted text-foreground' : 'hover:bg-muted/50'
              }`}
              onMouseEnter={() => onHover(globalIdx)}
              onClick={() => onClick(item)}
            >
              {renderItem(item)}
            </button>
          </div>
        )
      })}
      <Separator className="my-1" />
    </div>
  )
}

// ── Product Item ─────────────────────────────────────────────────────────────

function ProductItem({ product }: { product: FlatItem }) {
  return (
    <>
      {product.image ? (
        <img src={product.image} alt={product.name} className="w-10 h-10 rounded-md object-cover shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-1">{product.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {product.price != null && (
            <span className="font-semibold text-foreground">{product.price.toFixed(2)}</span>
          )}
          {product.compareAtPrice != null && product.compareAtPrice > (product.price ?? 0) && (
            <span className="line-through">{product.compareAtPrice.toFixed(2)}</span>
          )}
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </>
  )
}

// ── Category Item ────────────────────────────────────────────────────────────

function CategoryItem({ category }: { category: FlatItem }) {
  return (
    <>
      {category.image ? (
        <img src={category.image} alt={category.name} className="w-10 h-10 rounded-md object-cover shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
          <FolderOpen className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-1">{category.name}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </>
  )
}

// ── Attribute Item ───────────────────────────────────────────────────────────

function AttributeItem({ attribute }: { attribute: FlatItem }) {
  const tSearch = useTranslations('search')
  return (
    <>
      {attribute.image ? (
        <img src={attribute.image} alt={attribute.name} className="w-10 h-10 rounded-md object-cover shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
          <Tag className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-1">{attribute.name}</p>
        {attribute.productCount != null && attribute.productCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {tSearch('productCount', { count: attribute.productCount })}
          </p>
        )}
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </>
  )
}
