'use client';
import { useEffect, useState } from 'react';
import { BranchSection } from '@/entities/branch-section/types';
import { useTenant } from '@/entities/tenant/TenantContext';
import MenuLayout from '@/widgets/Menu/MenuLayout';
import type { MenuItem } from '@/entities/menu-item/types';

interface SystemMenuSectionProps {
  section: BranchSection;
  locale: string;
  tenantDomain: string;
  branchSlug?: string;
}

export default function SystemMenuSection({ section }: SystemMenuSectionProps) {
  const tenant = useTenant();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const tenantId = tenant?.tenantId;
  const branchId = (section as any).branchId;
  const menuStyle = (tenant?.theme?.menuStyle as 'grid' | 'list') || 'grid';

  useEffect(() => {
    if (!tenantId || !branchId) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/menu?tenantId=${tenantId}&branchId=${branchId}`)
      .then(r => r.json())
      .then(data => {
        // Filter to food/service items — exclude e-commerce products
        setItems(data.filter((item: any) => item.productType !== 'physical_product'));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tenantId, branchId]);

  if (loading) {
    return <div className="py-10 text-center text-muted-foreground">Loading menu…</div>;
  }

  if (!items.length) return null;

  return (
    <section id="menu" className="py-16 bg-surface-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MenuLayout items={items} menuStyle={menuStyle} />
      </div>
    </section>
  );
}
