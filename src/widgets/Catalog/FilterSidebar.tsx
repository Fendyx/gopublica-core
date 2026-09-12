'use client';
import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { MenuItem, AttributeRef } from '@/entities/menu-item/types';
import type { ProductAttribute, ProductAttributeGroup } from '@/entities/product-attribute/types';
import { useLocale } from 'next-intl';

interface FilterSidebarProps {
  products: MenuItem[];
  attributes: ProductAttribute[];
  attributeGroups: ProductAttributeGroup[];
  categories: any[];
  activeFilters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  categories: string[];
  /** Dynamic: groupSlug → selected attribute IDs */
  attributeFilters: Record<string, string[]>;
  tags: string[];
  priceMin: number | null;
  priceMax: number | null;
  inStock: boolean | null;
}

export const EMPTY_FILTERS: FilterState = {
  categories: [],
  attributeFilters: {},
  tags: [],
  priceMin: null,
  priceMax: null,
  inStock: null,
};

/** Resolve localized name from translations map */
function localized(translations?: Record<string, { name?: string }>, locale?: string, fallback: string = ''): string {
  if (!translations || !locale) return fallback;
  return translations[locale]?.name || translations[locale?.split('-')[0]]?.name || fallback;
}

function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border-light py-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {title}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="mt-2 space-y-2">{children}</div>}
    </div>
  );
}

function CheckboxItem({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded border-border accent-primary"
      />
      <span className="group-hover:text-foreground truncate">{label}</span>
      {count !== undefined && (
        <span className="ml-auto text-xs text-muted-foreground">{count}</span>
      )}
    </label>
  );
}

export default function FilterSidebar({
  products,
  attributes,
  attributeGroups,
  categories,
  activeFilters,
  onFilterChange,
}: FilterSidebarProps) {
  const t = useTranslations('catalog');
  const locale = useLocale();

  // Compute available filter values from products
  const filterData = useMemo(() => {
    // Build attribute lookup
    const attrMap = new Map<string, ProductAttribute>();
    for (const attr of attributes) {
      attrMap.set(attr._id, attr);
    }

    // Categories with counts
    const catCounts = new Map<string, number>();
    for (const p of products) {
      const key = p.categoryKey || p.category || '';
      if (key) catCounts.set(key, (catCounts.get(key) || 0) + 1);
    }
    const catList = categories
      .filter((c) => catCounts.has(c.key))
      .map((c) => ({ key: c.key, name: localized(c.translations, locale, c.name), icon: c.icon, count: catCounts.get(c.key) || 0 }))
      .sort((a, b) => b.count - a.count);

    // Dynamic attribute-based filters: groupSlug → items[]
    const attrFilters: Record<string, { id: string; name: string; count: number }[]> = {};

    const attrCounts = new Map<string, Map<string, number>>();
    for (const p of products) {
      for (const ref of p.attributeRefs || []) {
        const groupSlug = ref.type;
        if (!groupSlug) continue;
        if (!attrCounts.has(groupSlug)) attrCounts.set(groupSlug, new Map());
        const map = attrCounts.get(groupSlug)!;
        map.set(ref.attributeId, (map.get(ref.attributeId) || 0) + 1);
      }
    }

    for (const [groupSlug, map] of attrCounts) {
      const list: { id: string; name: string; count: number }[] = [];
      for (const [attrId, count] of map) {
        const attr = attrMap.get(attrId);
        if (attr) list.push({ id: attr._id, name: attr.name, count });
      }
      attrFilters[groupSlug] = list.sort((a, b) => b.count - a.count);
    }

    // Tags
    const tagCounts = new Map<string, number>();
    for (const p of products) {
      for (const tag of p.tags || []) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
    const tagList = Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Price range
    const prices = products.map((p) => p.price).filter((p) => p > 0);
    const priceMin = prices.length ? Math.floor(Math.min(...prices)) : 0;
    const priceMax = prices.length ? Math.ceil(Math.max(...prices)) : 1000;

    return { catList, attrFilters, tagList, priceMin, priceMax };
  }, [products, attributes, categories]);

  const activeCount = useMemo(() => {
    let count = 0;
    count += activeFilters.categories.length;
    for (const ids of Object.values(activeFilters.attributeFilters)) {
      count += ids.length;
    }
    count += activeFilters.tags.length;
    if (activeFilters.priceMin !== null || activeFilters.priceMax !== null) count++;
    if (activeFilters.inStock !== null) count++;
    return count;
  }, [activeFilters]);

  const toggleAttribute = (groupSlug: string, attrId: string) => {
    const current = activeFilters.attributeFilters[groupSlug] || [];
    const next = current.includes(attrId)
      ? current.filter((v) => v !== attrId)
      : [...current, attrId];
    onFilterChange({
      ...activeFilters,
      attributeFilters: { ...activeFilters.attributeFilters, [groupSlug]: next },
    });
  };

  const toggleCategory = (value: string) => {
    const current = activeFilters.categories;
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onFilterChange({ ...activeFilters, categories: next });
  };

  const toggleTag = (value: string) => {
    const current = activeFilters.tags;
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onFilterChange({ ...activeFilters, tags: next });
  };

  const setPrice = (field: 'priceMin' | 'priceMax', value: string) => {
    const num = value === '' ? null : Number(value);
    onFilterChange({ ...activeFilters, [field]: num });
  };

  // Build ordered list of groups that have matching products
  const activeGroupSlugs = Object.keys(filterData.attrFilters).filter(
    (slug) => filterData.attrFilters[slug].length > 0,
  );

  // Sort groups by their sortOrder from attributeGroups config
  const groupOrder = new Map(attributeGroups.map((g, i) => [g.slug, g.sortOrder ?? i]));
  const sortedGroupSlugs = activeGroupSlugs.sort(
    (a, b) => (groupOrder.get(a) ?? 999) - (groupOrder.get(b) ?? 999),
  );

  // Lookup group by slug for localized display name
  const groupBySlug = new Map(attributeGroups.map((g) => [g.slug, g]));

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border-light">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal size={14} />
          Filters
          {activeCount > 0 && (
            <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={() => onFilterChange(EMPTY_FILTERS)}
            className="text-xs text-primary hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Categories */}
      {filterData.catList.length > 0 && (
        <CollapsibleSection title="Category">
          {filterData.catList.map((cat) => (
            <CheckboxItem
              key={cat.key}
              label={cat.icon ? `${cat.icon} ${cat.name}` : cat.name}
              count={cat.count}
              checked={activeFilters.categories.includes(cat.key)}
              onChange={() => toggleCategory(cat.key)}
            />
          ))}
        </CollapsibleSection>
      )}

      {/* Dynamic attribute group filters */}
      {sortedGroupSlugs.map((groupSlug) => {
        const items = filterData.attrFilters[groupSlug];
        if (!items || items.length === 0) return null;
        const group = groupBySlug.get(groupSlug);
        const title = group
          ? `${group.icon || ''} ${localized(group.translations, locale, group.name)}`.trim()
          : groupSlug.charAt(0).toUpperCase() + groupSlug.slice(1).replace(/-/g, ' ');
        return (
          <CollapsibleSection key={groupSlug} title={title} defaultOpen={false}>
            {items.map((item) => (
              <CheckboxItem
                key={item.id}
                label={item.name}
                count={item.count}
                checked={(activeFilters.attributeFilters[groupSlug] || []).includes(item.id)}
                onChange={() => toggleAttribute(groupSlug, item.id)}
              />
            ))}
          </CollapsibleSection>
        );
      })}

      {/* Price */}
      <CollapsibleSection title="Price" defaultOpen={false}>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder={`Min (${filterData.priceMin})`}
            value={activeFilters.priceMin ?? ''}
            onChange={(e) => setPrice('priceMin', e.target.value)}
            className="text-xs h-8"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            placeholder={`Max (${filterData.priceMax})`}
            value={activeFilters.priceMax ?? ''}
            onChange={(e) => setPrice('priceMax', e.target.value)}
            className="text-xs h-8"
          />
        </div>
      </CollapsibleSection>

      {/* Availability */}
      <CollapsibleSection title="Availability" defaultOpen={false}>
        <CheckboxItem
          label="In stock"
          checked={activeFilters.inStock === true}
          onChange={() => onFilterChange({ ...activeFilters, inStock: activeFilters.inStock === true ? null : true })}
        />
        <CheckboxItem
          label="Out of stock"
          checked={activeFilters.inStock === false}
          onChange={() => onFilterChange({ ...activeFilters, inStock: activeFilters.inStock === false ? null : false })}
        />
      </CollapsibleSection>

      {/* Tags */}
      {filterData.tagList.length > 0 && (
        <CollapsibleSection title="Tags" defaultOpen={false}>
          {filterData.tagList.map((tag) => (
            <CheckboxItem
              key={tag.name}
              label={tag.name}
              count={tag.count}
              checked={activeFilters.tags.includes(tag.name)}
              onChange={() => toggleTag(tag.name)}
            />
          ))}
        </CollapsibleSection>
      )}
    </div>
  );
}

// ── Helper: apply filters to products ──
export function applyFilters(products: MenuItem[], filters: FilterState, attributes: ProductAttribute[]): MenuItem[] {
  return products.filter((p) => {
    // Category filter
    if (filters.categories.length > 0) {
      const catKey = p.categoryKey || p.category || '';
      if (!filters.categories.includes(catKey)) return false;
    }

    // Dynamic attribute ref filters: groupSlug → selected IDs
    for (const [groupSlug, selectedIds] of Object.entries(filters.attributeFilters)) {
      if (!selectedIds || selectedIds.length === 0) continue;
      const productAttrIds = (p.attributeRefs || [])
        .filter((r) => r.type === groupSlug)
        .map((r) => r.attributeId);
      if (!selectedIds.some((id) => productAttrIds.includes(id))) return false;
    }

    // Tag filter
    if (filters.tags.length > 0) {
      const productTags = p.tags || [];
      if (!filters.tags.some((t) => productTags.includes(t))) return false;
    }

    // Price filter
    if (filters.priceMin !== null && p.price < filters.priceMin) return false;
    if (filters.priceMax !== null && p.price > filters.priceMax) return false;

    // Stock filter
    if (filters.inStock === true && p.stock != null && p.stock <= 0) return false;
    if (filters.inStock === false && (p.stock == null || p.stock > 0)) return false;

    return true;
  });
}
