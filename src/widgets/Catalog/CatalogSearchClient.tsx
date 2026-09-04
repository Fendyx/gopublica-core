'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useTenant } from '@/entities/tenant/TenantContext';
import { useBranch } from '@/entities/branch/BranchContext';
import { Search } from 'lucide-react';
import type { MenuItem } from '@/entities/menu-item/types';
import EcommerceGridLayout from '@/widgets/Catalog/EcommerceGridLayout';
import FilterSidebar, { applyFilters, EMPTY_FILTERS, type FilterState } from '@/widgets/Catalog/FilterSidebar';
import type { ProductAttribute } from '@/entities/product-attribute/types';

export default function CatalogSearchClient() {
  const locale = useLocale();
  const { branchSlug } = useParams();
  const branchSlugStr = Array.isArray(branchSlug) ? branchSlug[0] : branchSlug;
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const tenant = useTenant();
  const { selectedBranch } = useBranch();

  const [products, setProducts] = useState<MenuItem[]>([]);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const tenantId = tenant?.tenantId;

  useEffect(() => {
    if (!tenantId || !query) {
      setLoading(false);
      return;
    }
    const fetchSearch = async () => {
      try {
        const branchId = selectedBranch?._id;
        let url = `${process.env.NEXT_PUBLIC_API_URL}/api/public/products/search?tenantId=${tenantId}&q=${encodeURIComponent(query)}`;
        if (branchId) url += `&branchId=${branchId}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) setProducts(await res.json());

        // Also fetch attributes for filters
        const [attrRes, catRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/product-attributes?tenantId=${tenantId}`, { cache: 'no-store' }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/categories?tenantId=${tenantId}&niche=ecommerce`, { cache: 'no-store' }),
        ]);
        if (attrRes.ok) setAttributes(await attrRes.json());
        if (catRes.ok) setCategories(await catRes.json());
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSearch();
  }, [tenantId, query, selectedBranch]);

  const filtered = useMemo(() => applyFilters(products, filters, attributes), [products, filters, attributes]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <div className="mb-8">
        <div className="flex items-center gap-3 text-muted-foreground text-sm mb-2">
          <Search size={16} />
          <span>Search results for</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground">"{query}"</h1>
        <p className="text-muted-foreground mt-1">{filtered.length} products found</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <FilterSidebar
            products={products}
            attributes={attributes}
            categories={categories}
            activeFilters={filters}
            onFilterChange={setFilters}
          />
        </aside>

        {/* Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="text-center py-20 text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground border border-dashed rounded-2xl">
              No products match your search.
            </div>
          ) : (
            <EcommerceGridLayout
              items={filtered}
              columns={3}
              variant={(tenant?.theme?.productCardVariant as any) || 'action-bar'}
            />
          )}
        </div>
      </div>
    </div>
  );
}
