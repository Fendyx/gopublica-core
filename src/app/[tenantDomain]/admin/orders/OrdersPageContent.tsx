'use client';
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useBranch } from '@/entities/branch/BranchContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  Mail,
  Package,
  Truck,
  Box,
  Store,
  User
} from 'lucide-react';
import { Order, OrderConfirmationStatus, OrderStatus } from '@/entities/order/types';
import { getOrders, acceptOrder, declineOrder, updateOrderStatus } from '@/entities/order/api';
import OrderDetailsSheet from './OrderDetailsSheet';
import { resolveDelivery } from './deliveryView';

export default function OrdersPageContent() {
  const t = useTranslations('admin.ordersPage');
  const tAdmin = useTranslations('admin');
  const { selectedBranch, loading: branchLoading } = useBranch();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // We store only the ID; the order object is derived from `orders`,
  // so status changes re-fetching the list update the open sheet automatically.
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const selectedOrder = orders.find((o) => o._id === selectedOrderId) ?? null;

  const fetchOrders = useCallback(async () => {
    const data = await getOrders(selectedBranch?._id);
    setOrders(data);
    setLoading(false);
  }, [selectedBranch]);

  useEffect(() => {
    if (!branchLoading && selectedBranch) {
      let cancelled = false;
      (async () => {
        const data = await getOrders(selectedBranch._id);
        if (!cancelled) {
          setOrders(data);
          setLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }
  }, [selectedBranch, branchLoading]);

  const handleAccept = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await acceptOrder(id);
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert(t('alerts.acceptError'));
    }
  };


  const handleDecline = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const reason = prompt(t('alerts.declinePrompt'));
    if (!reason) return;
    try {
      await declineOrder(id, reason);
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert(t('alerts.declineError'));
    }
  };

  const handleStatusChange = async (id: string, newStatus: OrderStatus, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await updateOrderStatus(id, newStatus);
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert(t('alerts.updateError'));
    }
  };

  const getStatusBadge = (status: OrderStatus, confirmation: OrderConfirmationStatus) => {
    if (confirmation === 'pending') {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">{t('status.needsResponse')}</Badge>;
    }
    if (confirmation === 'declined') {
      return <Badge variant="destructive">{t('status.declined')}</Badge>;
    }

    switch (status) {
      case 'pending_payment': return <Badge variant="secondary">{t('status.pending_payment')}</Badge>;
      case 'paid': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{t('status.paid')}</Badge>;
      case 'preparing': return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">{t('status.packing')}</Badge>;
      case 'ready': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">{t('status.readyToShip')}</Badge>;
      case 'out_for_delivery': return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">{t('status.shipped')}</Badge>;
      case 'completed': return <Badge variant="default">{t('status.completed')}</Badge>;
      case 'cancelled': return <Badge variant="destructive">{t('status.cancelled')}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const renderActions = (order: Order) => {
    const { status, confirmation, fulfillment } = order;

    if (confirmation.status === 'pending') {
      return (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={(e) => handleAccept(order._id, e)}>
            <CheckCircle className="w-4 h-4 mr-1" /> {t('actions.accept')}
          </Button>
          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={(e) => handleDecline(order._id, e)}>
            <XCircle className="w-4 h-4 mr-1" /> {t('actions.decline')}
          </Button>
        </div>
      );
    }

    if (status === 'accepted' || status === 'paid') {
      return (
        <Button size="sm" onClick={(e) => handleStatusChange(order._id, 'preparing', e)}>
          <Box className="w-4 h-4 mr-1" /> {t('actions.startPacking')}
        </Button>
      );
    }

    if (status === 'preparing') {
      return (
        <Button size="sm" onClick={(e) => handleStatusChange(order._id, 'ready', e)}>
          <Package className="w-4 h-4 mr-1" /> {t('actions.markReady')}
        </Button>
      );
    }

    if (status === 'ready') {
      if (fulfillment.type === 'delivery') {
        return (
          <Button size="sm" onClick={(e) => handleStatusChange(order._id, 'out_for_delivery', e)} className="bg-indigo-600 hover:bg-indigo-700">
            <Truck className="w-4 h-4 mr-1" /> {t('actions.markShipped')}
          </Button>
        );
      } else {
        return (
          <Button size="sm" onClick={(e) => handleStatusChange(order._id, 'completed', e)}>
            <CheckCircle className="w-4 h-4 mr-1" /> {t('actions.handedOver')}
          </Button>
        );
      }
    }

    if (status === 'out_for_delivery') {
      return (
        <Button size="sm" onClick={(e) => handleStatusChange(order._id, 'completed', e)} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
          <CheckCircle className="w-4 h-4 mr-1" /> {t('actions.delivered')}
        </Button>
      );
    }

    return <span className="text-xs text-muted-foreground">{t('actions.noActions')}</span>;
  };

  /** Compact shipping summary for the table cell — driven by the same resolver as the sheet. */
  const renderShippingCell = (order: Order) => {
    const delivery = resolveDelivery(order);

    switch (delivery.kind) {
      case 'digital':
        return (
          <div className="flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-violet-500" />
            <span className="font-medium text-sm">{t('details.emailDeliveryShort')}</span>
          </div>
        );
      case 'locker':
        return (
          <>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Package className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-sm">{t('details.parcelLocker')}</span>
            </div>
            <div className="text-xs border-l-2 border-blue-500 pl-2 ml-1">
              <p className="font-semibold text-blue-700 uppercase">{delivery.locker.network}</p>
              <p className="text-muted-foreground font-mono">{delivery.locker.id}</p>
            </div>
          </>
        );
      case 'courier':
        return (
          <div className="flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-sm">{t('details.courierDelivery')}</span>
          </div>
        );
      case 'pickup':
        return (
          <div className="flex items-center gap-1.5">
            <Store className="w-4 h-4 text-orange-500" />
            <span className="font-medium text-sm capitalize">{t('pickup')}</span>
          </div>
        );
    }
  };

  if (branchLoading || loading) return <div className="text-center py-16 text-muted-foreground">{t('loading')}</div>;
  if (!selectedBranch) return <div className="text-center py-16 text-muted-foreground">{t('selectBranch')}</div>;

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-[var(--admin-accent)]" />
            {t('title')} {tAdmin('ecommerceSuffix')}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('branchInfo', { name: selectedBranch.name, city: selectedBranch.city ? `(${selectedBranch.city})` : '' })}
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
          <Box className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground text-lg">{t('empty')}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="glass-card overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('table.idTime')}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('table.customer')}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('table.shipping')}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('table.items')}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('table.total')}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('table.status')}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order._id}
                      onClick={() => setSelectedOrderId(order._id)}
                      className="border-b border-border/50 last:border-0 hover:bg-surface-hover cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="font-mono text-xs text-[var(--admin-accent)] font-semibold">#{order._id.slice(-6)}</div>
                        <div className="text-sm font-medium mt-1">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          {order.customer.name}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{order.customer.phone}</div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {renderShippingCell(order)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="text-sm space-y-1">
                          {order.items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-semibold">{item.quantity}x</span> {item.name}
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <div className="text-xs text-muted-foreground italic">{t('moreItems', { count: order.items.length - 2 })}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        <div className="font-bold text-base">
                          {order.pricing.total.toFixed(2)} {order.pricing.currency.toUpperCase()}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {getStatusBadge(order.status, order.confirmation.status)}
                      </td>
                      <td className="px-4 py-3 align-top text-right" onClick={(e) => e.stopPropagation()}>
                        {renderActions(order)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile card list */}
          <div className="space-y-3 md:hidden">
            {orders.map((order) => (
              <div
                key={order._id}
                onClick={() => setSelectedOrderId(order._id)}
                className="glass-card p-4 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[var(--admin-accent)] font-semibold">#{order._id.slice(-6)}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {getStatusBadge(order.status, order.confirmation.status)}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-medium text-sm">{order.customer.name}</span>
                  <span className="text-xs text-muted-foreground">{order.customer.phone}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {order.items.length} {order.items.length === 1 ? tAdmin('item') : tAdmin('items')}
                  </div>
                  <div className="font-bold">
                    {order.pricing.total.toFixed(2)} {order.pricing.currency.toUpperCase()}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                  {renderActions(order)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Details drawer */}
      <OrderDetailsSheet
        order={selectedOrder}
        onClose={() => setSelectedOrderId(null)}
        renderActions={renderActions}
      />
    </div>
  );
}

export function OrdersPage() {
  const { selectedBranch } = useBranch();
  return <OrdersPageContent key={selectedBranch?._id} />;
}