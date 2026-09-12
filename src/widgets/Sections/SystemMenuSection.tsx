'use client';
import { useEffect, useState } from 'react';
import { BranchSection } from '@/entities/branch-section/types';
import SectionBackground from './SectionBackground';
import { useTenant } from '@/entities/tenant/TenantContext';
import MenuLayout from '@/widgets/Menu/MenuLayout';
import type { MenuItem } from '@/entities/menu-item/types';

interface SystemMenuSectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
  branchSlug?: string;
  allMenuItems?: MenuItem[];
  categories?: Array<{ key: string; name: string; icon?: string; translations?: Record<string, { name?: string; description?: string }> }>;
}

export default function SystemMenuSection({ section, allMenuItems, categories }: SystemMenuSectionProps) {
  const tenant = useTenant();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(!allMenuItems);

  const tenantId = tenant?.tenantId;
  const branchId = (section as any).branchId;
  const menuStyle = (tenant?.theme?.menuStyle as 'grid' | 'list') || 'grid';

  // Use pre-fetched data when available, otherwise fall back to client fetch
  useEffect(() => {
    if (allMenuItems) {
      setItems(allMenuItems.filter((item) => item.productType !== 'physical_product'));
      setLoading(false);
      return;
    }
    if (!tenantId || !branchId) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/menu?tenantId=${tenantId}&branchId=${branchId}`)
      .then(r => r.json())
      .then(data => {
        setItems(data.filter((item: any) => item.productType !== 'physical_product'));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tenantId, branchId, allMenuItems]);

  if (loading) {
    return <div className="py-10 text-center text-muted-foreground">Loading menu…</div>;
  }

  if (!items.length) return null;

  // Build categoryMap from pre-fetched categories for MenuLayout
  const categoryMap = categories
    ? Object.fromEntries(categories.map(c => [c.key, { name: c.name, icon: c.icon || '🍽️', translations: c.translations || {} }]))
    : undefined;

  const bg = (section.settings as any)?.background;

  return (
    <section id="menu" className="relative py-16 bg-surface-page">
      <SectionBackground background={bg} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MenuLayout items={items} menuStyle={menuStyle} initialCategoryMap={categoryMap} />
      </div>
    </section>
  );
}
