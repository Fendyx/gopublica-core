'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CheckCircle, Download, ExternalLink, Mail, MapPin, Package, Phone, Store, Truck } from 'lucide-react';
import type { Order } from '@/entities/order/types';
import { hasShippingLabel, resolveDelivery } from './deliveryView';

interface OrderDetailsSheetProps {
  order: Order | null;
  onClose: () => void;
  /** Workflow CTA for the current status (same renderer as the table). */
  renderActions: (order: Order) => React.ReactNode;
}

/** Muted uppercase section label — the only "header" a section gets. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </h4>
  );
}

export default function OrderDetailsSheet({ order, onClose, renderActions }: OrderDetailsSheetProps) {
  const t = useTranslations('admin.ordersPage');
  const td = useTranslations('admin.ordersPage.details');

  if (!order) return null;

  const delivery = resolveDelivery(order);
  const currency = order.pricing.currency.toUpperCase();
  const showLabel = hasShippingLabel(order);

  const renderDeliveryBody = () => {
    switch (delivery.kind) {
      case 'digital':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{td('emailDelivery')}</span>
            </div>
            {order.customer.email && (
              <a
                href={`mailto:${order.customer.email}`}
                className="block pl-6 text-sm text-blue-600 hover:underline"
              >
                {order.customer.email}
              </a>
            )}
          </div>
        );

      case 'locker':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">{td('parcelLocker')}</span>
              {delivery.locker.network && (
                <Badge variant="secondary" className="uppercase">{delivery.locker.network}</Badge>
              )}
            </div>
            <p className="pl-6 font-mono text-sm">{delivery.locker.id}</p>
            {(delivery.locker.address?.street || delivery.locker.address?.city) && (
              <div className="pl-6 flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  {delivery.locker.address?.street}
                  {delivery.locker.address?.street && delivery.locker.address?.city ? ', ' : ''}
                  {delivery.locker.address?.zip} {delivery.locker.address?.city}
                </span>
              </div>
            )}
          </div>
        );

      case 'courier':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">{td('courierDelivery')}</span>
            </div>
            {delivery.address ? (
              <address className="pl-6 not-italic text-sm text-muted-foreground leading-relaxed">
                {delivery.address.street}
                <br />
                {delivery.address.zip} {delivery.address.city}
              </address>
            ) : (
              <p className="pl-6 text-sm italic text-muted-foreground">{td('noAddressProvided')}</p>
            )}
          </div>
        );

      case 'pickup':
        return (
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium">{t('pickup')}</span>
          </div>
        );
    }
  };

  return (
    <Sheet open={!!order} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md lg:max-w-lg p-0 gap-0">
        {/* ── Header ─────────────────────────────────────────────── */}
        <SheetHeader className="border-b px-6 py-5">
          <div className="flex items-center justify-between gap-3 pr-8">
            <SheetTitle className="font-mono text-lg font-semibold">
              #{order._id.slice(-6)}
            </SheetTitle>
            <Badge variant="secondary" className="shrink-0">
              {t(`status.${order.status}`)}
            </Badge>
          </div>
          <SheetDescription>
            {td('createdAt', { date: new Date(order.createdAt).toLocaleString() })}
          </SheetDescription>
        </SheetHeader>

        {/* ── Scrollable body ────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Customer */}
          <section className="space-y-3">
            <SectionLabel>{td('customerInfo')}</SectionLabel>
            <p className="text-sm font-medium">{order.customer.name}</p>
            <div className="space-y-1.5 text-sm">
              <a href={`tel:${order.customer.phone}`} className="flex items-center gap-2 hover:text-primary">
                <Phone className="w-4 h-4 text-muted-foreground" />
                {order.customer.phone}
              </a>
              {order.customer.email && (
                <a href={`mailto:${order.customer.email}`} className="flex items-center gap-2 hover:text-primary">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {order.customer.email}
                </a>
              )}
            </div>
          </section>

          {/* Delivery + label action */}
          <section className="space-y-3">
            <SectionLabel>{t('delivery')}</SectionLabel>
            {renderDeliveryBody()}

            {showLabel && (
              <div className="pt-2 space-y-2 rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium">{td('labelReady')}</span>
                </div>
                {order.shipping?.trackingNumber && (
                  <p className="pl-6 font-mono text-xs text-muted-foreground">
                    {order.shipping.trackingNumber}
                  </p>
                )}
                {order.shipping?.labelUrl && (
                  <Button asChild size="sm" variant="outline" className="mt-1 w-full">
                    <a href={order.shipping.labelUrl} target="_blank" rel="noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      {td('downloadLabel')}
                      <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-50" />
                    </a>
                  </Button>
                )}
              </div>
            )}
          </section>

          {/* Items */}
          <section className="space-y-3">
            <SectionLabel>{td('itemsCount', { count: order.items.length })}</SectionLabel>
            <ul className="divide-y">
              {order.items.map((item, idx) => (
                <li key={idx} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm">
                      <span className="font-semibold tabular-nums">{item.quantity}×</span>{' '}
                      {item.name}
                    </span>
                    <span className="text-sm tabular-nums whitespace-nowrap">
                      {(item.price * item.quantity).toFixed(2)} {currency}
                    </span>
                  </div>
                  {item.basePrice != null && item.basePrice !== item.price && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {td('unitPrice', { price: item.price.toFixed(2), currency })}
                    </p>
                  )}
                  {item.notes && (
                    <p className="mt-0.5 text-xs italic text-muted-foreground">{item.notes}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* Totals */}
          <section className="space-y-3">
            <SectionLabel>{td('summary')}</SectionLabel>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{td('productsValue')}</dt>
                <dd className="tabular-nums">{order.pricing.subtotal.toFixed(2)} {currency}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{td('deliveryCost')}</dt>
                <dd className="tabular-nums">{order.pricing.deliveryFee.toFixed(2)} {currency}</dd>
              </div>
              {order.pricing.serviceFee > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{td('serviceFee')}</dt>
                  <dd className="tabular-nums">{order.pricing.serviceFee.toFixed(2)} {currency}</dd>
                </div>
              )}
              <div className="flex justify-between border-t pt-3 mt-3">
                <dt className="font-semibold">{td('totalDue')}</dt>
                <dd className="font-semibold text-base tabular-nums">
                  {order.pricing.total.toFixed(2)} {currency}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        {/* ── Pinned workflow CTA ────────────────────────────────── */}
        <SheetFooter className="border-t px-6 py-4">
          <div className="flex w-full justify-end">{renderActions(order)}</div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
