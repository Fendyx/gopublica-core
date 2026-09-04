'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useTenant } from '@/entities/tenant/TenantContext';
import { fetchMarketplaceProducts } from '@/entities/platformProduct/api';
import { usePlatformCartStore } from '@/shared/store/platformCartStore';
import type { MarketplaceProduct } from '@/entities/platformProduct/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Package, Search, ShoppingCart, Plus, Eye,
} from 'lucide-react';

interface MarketplaceGridProps {
  onProductSelect: (product: MarketplaceProduct) => void;
}

export default function MarketplaceGrid({ onProductSelect }: MarketplaceGridProps) {
  const t = useTranslations('admin.marketplace');
  const tenant = useTenant();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);

  const CATEGORY_OPTIONS = [
    { value: '', label: t('all') },
    { value: 'hardware', label: t('hardware') },
    { value: 'digital', label: t('digital') },
    { value: 'service', label: t('service') },
  ];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const addItem = usePlatformCartStore((s) => s.addItem);

  useEffect(() => {
    if (!tenant?.tenantId) return;
    fetchMarketplaceProducts(tenant.niche)
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tenant?.tenantId, tenant?.niche]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-64 rounded-xl border border-border bg-muted/20 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">{t('loadError')}</p>
          <p className="text-xs text-muted-foreground/70">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {CATEGORY_OPTIONS.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategoryFilter(c.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                categoryFilter === c.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">{t('noProducts')}</p>
            <p className="text-xs text-muted-foreground/70">
              {t('noProductsHint')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <Card
              key={product._id}
              className="overflow-hidden group transition-shadow hover:shadow-md cursor-pointer"
              onClick={() => onProductSelect(product)}
            >
              {/* Photo */}
              <div className="relative h-40 bg-muted/30 overflow-hidden">
                {product.photo ? (
                  <img
                    src={product.photo}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <Package className="w-12 h-12 text-muted-foreground/20" />
                  </div>
                )}
                <Badge
                  variant="secondary"
                  className="absolute top-2 left-2 text-[10px] tracking-wider uppercase"
                >
                  {product.category}
                </Badge>
              </div>

              <CardContent className="p-4">
                <CardTitle className="text-sm font-semibold leading-snug mb-1 line-clamp-1">
                  {product.title}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-2 mb-3">
                  {product.description || t('noDescription')}
                </CardDescription>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">
                    {product.currency} {product.price.toFixed(2)}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onProductSelect(product);
                      }}
                      className="p-1.5 rounded-lg border border-border hover:border-primary/40 transition-colors"
                      title={t('viewDetails')}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addItem({
                          productId: product._id,
                          title: product.title,
                          price: product.price,
                          currency: product.currency,
                          photo: product.photo,
                        });
                      }}
                      className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                      title={t('addToCart')}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
