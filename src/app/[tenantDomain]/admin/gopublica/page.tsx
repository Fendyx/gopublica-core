'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Megaphone, ShoppingCart } from 'lucide-react';

import MarketplaceGrid from '@/widgets/Admin/MarketplaceGrid';
import ProductDetailSheet from '@/widgets/Admin/ProductDetailSheet';
import PlatformNewsFeed from '@/widgets/Admin/PlatformNewsFeed';
import { usePlatformCartStore } from '@/shared/store/platformCartStore';
import type { MarketplaceProduct } from '@/entities/platformProduct/types';

export default function GopublicaPage() {
  const t = useTranslations('admin.gopublicaPage');
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const itemCount = usePlatformCartStore((s) => s.getItemCount());

  const handleProductSelect = (product: MarketplaceProduct) => {
    setSelectedProduct(product);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            {t('title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>
        {itemCount > 0 && (
          <a
            href="/admin/gopublica/checkout"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            Cart ({itemCount})
          </a>
        )}
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main: Marketplace */}
        <div>
          <MarketplaceGrid onProductSelect={handleProductSelect} />
        </div>

        {/* Sidebar: News */}
        <aside>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <Megaphone className="w-4 h-4 text-primary" />
            {t('whatsNew')}
          </h2>
          <PlatformNewsFeed />
        </aside>
      </div>

      {/* Product Detail Sheet */}
      <ProductDetailSheet
        product={selectedProduct}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}