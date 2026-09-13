'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Truck, RotateCcw } from 'lucide-react';
import type { MenuItem } from '@/entities/menu-item/types';
import type { LinkedAttribute } from '@/shared/hooks/useLinkedAttributes';
import { hasAttributes, hasWeightVal, hasDims, hasTagsList } from '@/widgets/Catalog/useProductDetailHelpers';
import { resolveName, resolveDescription } from '@/shared/lib/localization';

export default function ProductTabs({
  product,
  hasSpecs,
  linkedAttrs,
  locale,
  t,
}: {
  product: MenuItem;
  hasSpecs: boolean;
  linkedAttrs: LinkedAttribute[];
  locale?: string;
  t: ReturnType<typeof useTranslations<'productDetail'>>;
}) {
  const description = resolveDescription(product, locale);
  const hasDescription = Boolean(description);
  if (!hasDescription && !hasSpecs) return null;

  // Single content → no tab chrome
  if (hasDescription && !hasSpecs) {
    return (
      <div>
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-3">
          {t('description')}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    );
  }

  const defaultTab = hasDescription ? 'description' : 'specifications';

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="w-full justify-start border-b border-border-light rounded-none bg-transparent p-0 gap-0">
        {hasDescription && (
          <TabsTrigger value="description" className="text-[10px] tracking-widest uppercase rounded-none">
            {t('tabDescription')}
          </TabsTrigger>
        )}
        {hasSpecs && (
          <TabsTrigger value="specifications" className="text-[10px] tracking-widest uppercase rounded-none">
            {t('tabSpecifications')}
          </TabsTrigger>
        )}
        <TabsTrigger value="shipping" className="text-[10px] tracking-widest uppercase rounded-none">
          {t('tabShipping')}
        </TabsTrigger>
      </TabsList>

      {hasDescription && (
        <TabsContent value="description" className="pt-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </TabsContent>
      )}

      {hasSpecs && (
        <TabsContent value="specifications" className="pt-4">
          <SpecificationsTab product={product} linkedAttrs={linkedAttrs} t={t} />
        </TabsContent>
      )}

      <TabsContent value="shipping" className="pt-4">
        <ShippingTab t={t} />
      </TabsContent>
    </Tabs>
  );
}

/* ────────── Specifications table ────────── */

function SpecificationsTab({
  product,
  linkedAttrs,
  t,
}: {
  product: MenuItem;
  linkedAttrs: LinkedAttribute[];
  t: ReturnType<typeof useTranslations<'productDetail'>>;
}) {
  const { locale, branchSlug } = useParams();
  const attrs = (product.attributes ?? []).filter(a => a.key?.trim() && a.value?.trim());
  const wgt = hasWeightVal(product);
  const dims = hasDims(product);
  const tags = hasTagsList(product);

  // Deduplicate: exclude old manual attributes whose key matches a linked attribute name
  const linkedNames = new Set(linkedAttrs.map((la) => la.name.toLowerCase()));
  const dedupedAttrs = attrs.filter((a) => !linkedNames.has(a.key.toLowerCase()));

  if (!wgt && !dims && !tags && dedupedAttrs.length === 0 && linkedAttrs.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('noSpecifications')}</p>;
  }

  // Group linked attributes by type for display
  const linkedByType = new Map<string, LinkedAttribute[]>();
  for (const la of linkedAttrs) {
    const list = linkedByType.get(la.groupSlug) ?? [];
    list.push(la);
    linkedByType.set(la.groupSlug, list);
  }

  // Build dimension string - only non-zero parts
  let dimStr = '';
  if (dims) {
    const parts: string[] = [];
    if ((product.dimensions!.length ?? 0) > 0) parts.push(String(product.dimensions!.length));
    if ((product.dimensions!.width ?? 0) > 0) parts.push(String(product.dimensions!.width));
    if ((product.dimensions!.height ?? 0) > 0) parts.push(String(product.dimensions!.height));
    dimStr = parts.join(' \u00d7 ') + ' ' + (product.dimensions!.unit || 'cm');
  }

  return (
    <div className="space-y-0">
      {/* Linked managed attributes (Authors, Genres, etc.) */}
      {linkedAttrs.length > 0 && (
        <div className="mb-4 space-y-2">
          {[...linkedByType.entries()].map(([groupSlug, items]) => (
            <div key={groupSlug} className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[10px] tracking-widest uppercase text-muted-foreground min-w-[70px]">
                {items[0]?.groupIcon} {items[0]?.groupName || groupSlug}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {items.map((attr) => (
                  <Link
                    key={attr.attributeId}
                    href={`/${locale}/${branchSlug}/catalog/${attr.groupSlug}/${attr.slug}`}
                    className="inline-block px-2.5 py-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    {attr.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <table className="w-full text-xs border-collapse">
        <tbody>
          {dedupedAttrs.map((attr, idx) => (
            <tr key={`${attr.key}-${idx}`} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
              <td className="py-2.5 px-3 text-muted-foreground tracking-wide w-[40%]">{attr.key}</td>
              <td className="py-2.5 px-3 text-foreground">{attr.value}</td>
            </tr>
          ))}
          {wgt && (
            <tr className={dedupedAttrs.length % 2 === 0 ? 'bg-muted/30' : ''}>
              <td className="py-2.5 px-3 text-muted-foreground tracking-wide w-[40%]">{t('weight')}</td>
              <td className="py-2.5 px-3 text-foreground">
                {product.weight} {product.weightUnit || 'kg'}
              </td>
            </tr>
          )}
          {dims && (
            <tr className={(dedupedAttrs.length + (wgt ? 1 : 0)) % 2 === 0 ? 'bg-muted/30' : ''}>
              <td className="py-2.5 px-3 text-muted-foreground tracking-wide w-[40%]">{t('dimensions')}</td>
              <td className="py-2.5 px-3 text-foreground">{dimStr}</td>
            </tr>
          )}
        </tbody>
      </table>

      {tags && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {product.tags!.map(tag => (
            <span
              key={tag}
              className="border border-border px-2.5 py-1 text-[9px] tracking-widest uppercase text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────── Shipping & Returns tab ────────── */

function ShippingTab({
  t,
}: {
  t: ReturnType<typeof useTranslations<'productDetail'>>;
}) {
  return (
    <div className="space-y-4 text-xs text-muted-foreground">
      <div className="flex items-start gap-3">
        <Truck size={14} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-foreground font-medium mb-1">{t('shippingInfo')}</p>
          <p className="leading-relaxed">{t('estimatedDelivery')}</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <RotateCcw size={14} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-foreground font-medium mb-1">{t('returnInfo')}</p>
          <p className="leading-relaxed">{t('returnWindow')}</p>
        </div>
      </div>
    </div>
  );
}
