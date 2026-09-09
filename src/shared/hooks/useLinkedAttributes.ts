'use client';

import { useEffect, useState } from 'react';
import type { AttributeRef, AttributeType } from '@/entities/menu-item/types';

export interface LinkedAttribute {
  type: AttributeType;
  attributeId: string;
  name: string;
  slug: string;
}

/**
 * Resolves attributeRefs (IDs) to full attribute objects with names and slugs.
 * Fetches from /api/saas/product-attributes/suggest (public, no auth needed).
 */
export function useLinkedAttributes(
  attributeRefs: AttributeRef[] | undefined,
  tenantId: string,
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

        // Fetch all attributes per type (small datasets, typically <50)
        const API_BASE =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

        const fetches = [...byType.entries()].map(async ([type, ids]) => {
          const params = new URLSearchParams({ tenantId, type });
          const res = await fetch(
            `${API_BASE}/api/saas/product-attributes?${params}`,
            { cache: 'no-store', signal: controller.signal },
          );
          if (!res.ok) return;
          const attrs: { _id: string; name: string; slug: string }[] =
            await res.json();
          const byId = new Map(attrs.map((a) => [a._id, a]));

          for (const id of ids) {
            const attr = byId.get(id);
            if (attr) {
              results.push({
                type,
                attributeId: id,
                name: attr.name,
                slug: attr.slug,
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
  }, [JSON.stringify(attributeRefs ?? []), tenantId]);

  return resolved;
}
