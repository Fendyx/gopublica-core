'use client';

import { useEffect, useState } from 'react';
import type { AttributeRef, AttributeType } from '@/entities/menu-item/types';
import type { ProductAttributeGroup } from '@/entities/product-attribute/types';

export interface LinkedAttribute {
  type: AttributeType;
  attributeId: string;
  name: string;
  slug: string;
  groupName: string;
  groupSlug: string;
  groupIcon?: string;
}

/**
 * Resolves attributeRefs (IDs) to full attribute objects with localized names and slugs.
 * Fetches from /api/saas/product-attributes (public, no auth needed).
 */
export function useLinkedAttributes(
  attributeRefs: AttributeRef[] | undefined,
  tenantId: string,
  locale?: string,
): LinkedAttribute[] {
  const [resolved, setResolved] = useState<LinkedAttribute[]>([]);

  useEffect(() => {
    const refs = attributeRefs ?? [];
    if (refs.length === 0 || !tenantId) {
      setResolved([]);
      return;
    }

    const controller = new AbortController();

    async function resolve() {
      try {
        // Group IDs by type to minimize requests
        const byType = new Map<AttributeType, string[]>();
        for (const ref of refs) {
          const ids = byType.get(ref.type) ?? [];
          ids.push(ref.attributeId);
          byType.set(ref.type, ids);
        }

        const results: LinkedAttribute[] = [];

        const API_BASE =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

        // Fetch attribute groups for group info
        const groupsRes = await fetch(
          `${API_BASE}/api/saas/attribute-groups?tenantId=${tenantId}`,
          { cache: 'no-store', signal: controller.signal },
        );
        const groups: ProductAttributeGroup[] = groupsRes.ok ? await groupsRes.json() : [];
        const groupBySlug = new Map(groups.map((g) => [g.slug, g]));

        // Fetch all attributes per type (small datasets, typically <50)
        const fetches = [...byType.entries()].map(async ([type, ids]) => {
          const params = new URLSearchParams({ tenantId, type });
          const res = await fetch(
            `${API_BASE}/api/saas/product-attributes?${params}`,
            { cache: 'no-store', signal: controller.signal },
          );
          if (!res.ok) return;
          const attrs: { _id: string; name: string; slug: string; translations?: Record<string, { name?: string }> }[] =
            await res.json();
          const byId = new Map(attrs.map((a) => [a._id, a]));

          const group = groupBySlug.get(type);

          for (const id of ids) {
            const attr = byId.get(id);
            if (attr) {
              // Resolve localized name
              const localizedName = locale
                ? attr.translations?.[locale]?.name || attr.translations?.[locale?.split('-')[0]]?.name || attr.name
                : attr.name;
              const localizedGroupName = locale && group
                ? group.translations?.[locale]?.name || group.translations?.[locale?.split('-')[0]]?.name || group.name
                : group?.name || type;

              results.push({
                type,
                attributeId: id,
                name: localizedName,
                slug: attr.slug,
                groupName: localizedGroupName,
                groupSlug: group?.slug || type,
                groupIcon: group?.icon,
              });
            }
          }
        });

        await Promise.all(fetches);
        setResolved(results);
      } catch {
        // Silently fail — attributes just won't render
      }
    }

    resolve();
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(attributeRefs ?? []), tenantId, locale]);

  return resolved;
}
