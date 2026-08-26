/** Shared view helpers for the admin Customers page (mirrors orders/deliveryView.ts). */

/** First letters of the first two name parts, e.g. "Jan Kowalski" -> "JK". */
export const getInitials = (name?: string): string =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '?';

/** Average order value; 0 when there are no orders yet. Tolerates missing stats. */
export const getAvgOrderValue = (totalSpent?: number, orderCount?: number): number => {
  const count = orderCount || 0;
  return count > 0 ? (totalSpent || 0) / count : 0;
};
