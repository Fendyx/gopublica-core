import type { Order, ParcelLockerInfo, ShippingAddress } from '@/entities/order/types';

/**
 * Single source of truth for how an order is delivered.
 * Exactly one branch applies per order — both the table and the details
 * sheet render from this, so they can never disagree.
 */
export type DeliveryView =
  | { kind: 'digital' }
  | { kind: 'locker'; locker: ParcelLockerInfo }
  | { kind: 'courier'; address: ShippingAddress | null }
  | { kind: 'pickup' };

/** A locker counts as present if it has a real id (new shape) or the legacy `enabled` flag. */
function hasLocker(locker?: ParcelLockerInfo | null): locker is ParcelLockerInfo {
  return !!locker && (!!locker.id || locker.enabled === true);
}

export function resolveDelivery(order: Order): DeliveryView {
  const f = order.fulfillment;

  switch (f.type) {
    case 'digital':
      return { kind: 'digital' };
    case 'pickup':
      return { kind: 'pickup' };
    case 'delivery':
      if (hasLocker(f.parcelLocker)) return { kind: 'locker', locker: f.parcelLocker };
      // Degraded data (no address recorded) still renders as courier with a fallback note.
      return { kind: 'courier', address: f.address ?? null };
    default:
      return { kind: 'pickup' };
  }
}

/** True only when a REAL carrier label exists — no demo fallbacks in production. */
export function hasShippingLabel(order: Order): boolean {
  return !!(order.shipping?.labelUrl || order.shipping?.trackingNumber);
}
