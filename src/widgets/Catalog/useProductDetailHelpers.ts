import type { MenuItem } from '@/entities/menu-item/types';

/* ────────── Attribute helpers (shared between useProductDetail and ProductTabs) ────────── */

export function hasAttributes(product: MenuItem) {
  return (product.attributes ?? []).some(a => a.key?.trim() && a.value?.trim());
}

export function hasWeightVal(product: MenuItem) {
  return product.weight != null && product.weight > 0;
}

export function hasDims(product: MenuItem) {
  if (!product.dimensions) return false;
  return (
    (product.dimensions.length ?? 0) > 0 ||
    (product.dimensions.width ?? 0) > 0 ||
    (product.dimensions.height ?? 0) > 0
  );
}

export function hasTagsList(product: MenuItem) {
  return Boolean(product.tags && product.tags.length > 0);
}
