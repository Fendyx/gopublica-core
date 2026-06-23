'use client';
import Link from 'next/link';
import EcommerceGridLayout from './EcommerceGridLayout';
import EcommerceCarouselLayout from './EcommerceCarouselLayout';
import EcommerceDynamicGrid from './EcommerceDynamicGrid';
import type { MenuItem } from '@/entities/menu-item/types';

interface Props {
  category: any;
  products: MenuItem[];
  locale: string;
  tenant: any;
}

export default function CategoryViewClient({ category, products, locale, tenant }: Props) {
  const layout = category.layout || 'grid-3';
  const variant = tenant?.theme?.productCardVariant || 'action-bar';
  const currencySymbol = tenant?.primaryCurrency === 'PLN' ? 'zł' : tenant?.primaryCurrency || '€';

  return (
    <section className="py-10 lg:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Хлебные крошки */}
        <div className="mb-8 text-sm text-muted-foreground">
          <Link href={`/${locale}/catalog`} className="hover:text-foreground transition-colors">Catalog</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{category.name}</span>
        </div>

        {/* Баннер категории (если есть фото) */}
        {category.coverImage ? (
          <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden mb-10 border border-border">
            <img src={category.coverImage} alt={category.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 md:p-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg flex items-center gap-3">
                <span>{category.icon}</span> {category.name}
              </h1>
              <p className="text-white/80 mt-1">{products.length} {products.length === 1 ? 'item' : 'items'}</p>
            </div>
          </div>
        ) : (
          <div className="mb-10 flex items-center gap-4">
            <span className="text-4xl">{category.icon}</span>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">{category.name}</h1>
              <p className="text-muted-foreground mt-1">{products.length} {products.length === 1 ? 'item' : 'items'}</p>
            </div>
          </div>
        )}

        {/* Список товаров */}
        {products.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border border-dashed rounded-2xl">
            В этой категории пока нет товаров.
          </div>
        ) : (
          <>
            {layout === 'carousel' && <EcommerceCarouselLayout items={products} locale={locale} variant={variant} currencySymbol={currencySymbol} />}
            {layout === 'dynamic' && <EcommerceDynamicGrid items={products} locale={locale} variant={variant} currencySymbol={currencySymbol} />}
            {layout === 'grid-4' && <EcommerceGridLayout items={products} locale={locale} columns={4} variant={variant} currencySymbol={currencySymbol} />}
            {(layout === 'grid-3' || !layout) && <EcommerceGridLayout items={products} locale={locale} columns={3} variant={variant} currencySymbol={currencySymbol} />}
          </>
        )}
      </div>
    </section>
  );
}