'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Mail, Package, Phone, ReceiptText } from 'lucide-react';
import type { CustomerOrder, CustomerSummary } from '@/entities/customer/types';
import { getCustomerDetails } from '@/entities/customer/api';
import { getAvgOrderValue, getInitials } from './customerView';

interface CustomerDetailsSheetProps {
  customer: CustomerSummary | null;
  onClose: () => void;
}

/** Order history cache for the last successfully fetched customer. */
interface LoadedHistory {
  customerId: string;
  orders: CustomerOrder[];
}

/** Muted uppercase section label — the only "header" a section gets (same as OrderDetailsSheet). */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </h4>
  );
}

export default function CustomerDetailsSheet({ customer, onClose }: CustomerDetailsSheetProps) {
  const t = useTranslations('admin.customersPage');
  // Reuse the existing order-status vocabulary instead of duplicating it.
  const tStatus = useTranslations('admin.ordersPage.status');

  const [loaded, setLoaded] = useState<LoadedHistory | null>(null);

  // Lazy-load the order history whenever a different customer is opened.
  // Loading is DERIVED (cached id ≠ current id) rather than stored, so no
  // setState is called synchronously inside the effect body.
  useEffect(() => {
    if (!customer) return;
    let cancelled = false;
    (async () => {
      try {
        const details = await getCustomerDetails(customer._id);
        if (!cancelled) setLoaded({ customerId: customer._id, orders: details.orders });
      } catch (err) {
        console.error(err);
        if (!cancelled) setLoaded({ customerId: customer._id, orders: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customer]);

  if (!customer) return null;

  // Backend may omit stats for freshly registered customers — normalize once.
  const totalSpent = customer.totalSpent || 0;
  const orderCount = customer.orderCount || 0;

  const ordersLoading = loaded?.customerId !== customer._id;
  const orders = loaded && loaded.customerId === customer._id ? loaded.orders : [];

  const avgOrderValue = getAvgOrderValue(totalSpent, orderCount);

  return (
    <Sheet open={!!customer} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md lg:max-w-lg p-0 gap-0 flex flex-col">
        {/* ── Header ─────────────────────────────────────────────── */}
        <SheetHeader className="border-b px-6 py-5">
          <div className="flex items-center gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {getInitials(customer.name)}
            </div>
            <div className="min-w-0">
              <SheetTitle className="truncate text-lg font-semibold">{customer.name}</SheetTitle>
              <SheetDescription className="truncate">
                {t('details.registeredOn', { date: new Date(customer.createdAt).toLocaleDateString() })}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* ── Scrollable body ────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Contact */}
          <section className="space-y-3">
            <SectionLabel>{t('details.contactInfo')}</SectionLabel>
            <div className="space-y-1.5 text-sm">
              <a href={`tel:${customer.phone}`} className="flex items-center gap-2 hover:text-primary">
                <Phone className="w-4 h-4 text-muted-foreground" />
                {customer.phone}
              </a>
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="flex items-center gap-2 hover:text-primary">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {customer.email}
                </a>
              )}
            </div>
          </section>

          {/* Stats */}
          <section className="space-y-3">
            <SectionLabel>{t('details.stats')}</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border p-3 text-center">
                <div className="text-base font-bold tabular-nums">{orderCount}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{t('stats.orders')}</div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-base font-bold tabular-nums">
                  {totalSpent.toFixed(2)}
                  {customer.currency ? ` ${customer.currency.toUpperCase()}` : ''}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{t('stats.totalSpent')}</div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-base font-bold tabular-nums">
                  {avgOrderValue.toFixed(2)}
                  {customer.currency ? ` ${customer.currency.toUpperCase()}` : ''}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{t('stats.avgOrderValue')}</div>
              </div>
            </div>
          </section>

          {/* Order history */}
          <section className="space-y-3">
            <SectionLabel>{t('details.orderHistory')}</SectionLabel>

            {ordersLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">{t('details.noOrders')}</p>
            ) : (
              <ul className="divide-y">
                {orders.map((order) => (
                  <li key={order._id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-semibold text-primary">
                        #{order._id.slice(-6)}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ReceiptText className="w-3.5 h-3.5" />
                        {new Date(order.createdAt).toLocaleString()}
                        {typeof order.itemCount === 'number' && (
                          <>
                            <Package className="ml-1 w-3.5 h-3.5" />
                            {order.itemCount}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-semibold tabular-nums">
                        {(order.pricing?.total || 0).toFixed(2)}
                        {order.pricing?.currency ? ` ${order.pricing.currency.toUpperCase()}` : ''}
                      </span>
                      <Badge variant="secondary">{tStatus(order.status)}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
