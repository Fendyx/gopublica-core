'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import type { MenuItem, ProductCardVariant } from '@/entities/menu-item/types';
import type { ProductAttribute } from '@/entities/product-attribute/types';
import EcommerceGridLayout from './EcommerceGridLayout';

const CURRENCY_SYMBOLS: Record<string, string> = {
  PLN: 'zł', EUR: '€', USD: '$', UAH: '₴', GBP: '£',
};

function getCurrencySymbol(currencyCode?: string): string {
  return currencyCode ? CURRENCY_SYMBOLS[currencyCode] || currencyCode : 'zł';
}

const TYPE_LABELS: Record<string, string> = {
  author: 'Authors',
  publisher: 'Publishers',
  genre: 'Genres',
  language: 'Languages',
  series: 'Series',
};

interface EntityPageProps {
  attribute: ProductAttribute;
  products: MenuItem[];
  allAttributes: ProductAttribute[];
  tenant: any;
}

export default function EntityPage({ attribute, products, allAttributes, tenant }: EntityPageProps) {
  const locale = useLocale();
  const { branchSlug } = useParams();
  const branchSlugStr = Array.isArray(branchSlug) ? branchSlug[0] : branchSlug;
  const currencySymbol = getCurrencySymbol(tenant?.primaryCurrency);
  const variant = (tenant?.theme?.productCardVariant as ProductCardVariant) || 'action-bar';
  const typeLabel = TYPE_LABELS[attribute.type] || attribute.type;

  return (
    <section className="py-10 lg:py-16 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8 text-sm text-muted-foreground">
          <Link href={`/${locale}/${branchSlugStr}/catalog`} className="hover:text-foreground transition-colors">
            Catalog
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/${locale}/${branchSlugStr}/catalog`} className="hover:text-foreground transition-colors">
            {typeLabel}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{attribute.name}</span>
        </div>

        {/* Entity header */}
        {attribute.image ? (
          <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden mb-10 border border-border">
            <Image
              src={attribute.image}
              alt={attribute.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 md:p-8">
              <p className="text-white/60 text-xs uppercase tracking-widest mb-1">{typeLabel}</p>
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                {attribute.name}
              </h1>
              {attribute.description && (
                <p className="text-white/70 mt-2 text-sm md:text-base max-w-xl">
                  {attribute.description}
                </p>
              )}
              <p className="text-white/80 mt-2">
                {products.length} {products.length === 1 ? 'product' : 'products'}
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-10">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{typeLabel}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">{attribute.name}</h1>
            {attribute.description && (
              <p className="text-muted-foreground mt-2 text-lg">{attribute.description}</p>
            )}
            <p className="text-muted-foreground mt-1">
              {products.length} {products.length === 1 ? 'product' : 'products'}
            </p>
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border border-dashed rounded-2xl">
            No products found for this {attribute.type}.
          </div>
        ) : (
          <EcommerceGridLayout
            items={products}
            columns={3}
            variant={variant}
            currencySymbol={currencySymbol}
          />
        )}
      </div>
    </section>
  );
}
