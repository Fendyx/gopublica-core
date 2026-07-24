'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useBranch } from '@/entities/branch/BranchContext';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Package,
  MapPin,
  Truck,
  Box,
  Store,
  ExternalLink,
  Phone,
  Mail
} from 'lucide-react';
import { Order, OrderConfirmationStatus, OrderStatus } from '@/entities/order/types';
import { getOrders, acceptOrder, declineOrder, updateOrderStatus } from '@/entities/order/api';

export default function OrdersPageContent() {
  const t = useTranslations('admin.ordersPage');
  const { selectedBranch, loading: branchLoading } = useBranch();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Стейт для модалки подробной информации о заказе
  const [activeOrderModal, setActiveOrderModal] = useState<any | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const data = await getOrders(selectedBranch?._id);
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!branchLoading && selectedBranch) {
      fetchOrders();
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
      // Если модалка открыта для этого же заказа, обновляем ее данные
      if (activeOrderModal && activeOrderModal._id === id) {
        const updatedOrders = await getOrders(selectedBranch?._id);
        const updated = updatedOrders.find((o: any) => o._id === id);
        if (updated) setActiveOrderModal(updated);
      }
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

  const renderActions = (order: any, isModal = false) => {
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

  if (branchLoading || loading) return <div className="text-center py-16 text-muted-foreground">{t('loading')}</div>;
  if (!selectedBranch) return <div className="text-center py-16 text-muted-foreground">{t('selectBranch')}</div>;

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            {t('title')} (E-commerce)
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('branchInfo', { name: selectedBranch.name, city: selectedBranch.city ? `(${selectedBranch.city})` : '' })}
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Box className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-lg">{t('empty')}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.idTime')}</TableHead>
                  <TableHead>{t('table.customer')}</TableHead>
                  <TableHead>{t('table.shipping')}</TableHead>
                  <TableHead>{t('table.items')}</TableHead>
                  <TableHead className="text-right">{t('table.total')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead className="text-right">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow 
                    key={order._id} 
                    onClick={() => setActiveOrderModal(order)}
                    className="group hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    {/* INFO COLUMN */}
                    <TableCell className="align-top">
                      <div className="font-mono text-xs text-primary font-semibold">#{order._id.slice(-6)}</div>
                      <div className="text-sm font-medium mt-1">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>

                    {/* CUSTOMER COLUMN */}
                    <TableCell className="align-top">
                      <div className="font-medium flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        {order.customer.name}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{order.customer.phone}</div>
                    </TableCell>

                    {/* SHIPPING COLUMN */}
                    <TableCell className="align-top">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {order.fulfillment.type === 'delivery' ? (
                           <Truck className="w-4 h-4 text-blue-500" />
                        ) : (
                           <Store className="w-4 h-4 text-orange-500" />
                        )}
                        <span className="font-medium text-sm capitalize">
                          {order.fulfillment.type === 'delivery' ? 'Wysyłka' : 'Odbiór'}
                        </span>
                      </div>

                      {order.fulfillment.type === 'delivery' && order.fulfillment.parcelLocker?.enabled && (
                        <div className="text-xs border-l-2 border-blue-500 pl-2 ml-1">
                          <p className="font-semibold text-blue-700 uppercase">{order.fulfillment.parcelLocker.network}</p>
                          <p className="text-muted-foreground font-mono">{order.fulfillment.parcelLocker.lockerId}</p>
                        </div>
                      )}
                    </TableCell>

                    {/* ITEMS COLUMN */}
                    <TableCell className="align-top">
                      <div className="text-sm space-y-1">
                        {order.items.slice(0, 2).map((item: any, idx: number) => (
                          <div key={idx} className="text-xs text-gray-800">
                            <span className="font-semibold">{item.quantity}x</span> {item.name}
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="text-xs text-muted-foreground italic">{t('moreItems', { count: order.items.length - 2 })}</div>
                        )}
                      </div>
                    </TableCell>

                    {/* TOTAL COLUMN */}
                    <TableCell className="align-top text-right">
                      <div className="font-bold text-base text-gray-900">
                        {order.pricing.total.toFixed(2)} {order.pricing.currency.toUpperCase()}
                      </div>
                    </TableCell>

                    {/* STATUS COLUMN */}
                    <TableCell className="align-top">
                      {getStatusBadge(order.status, order.confirmation.status)}
                    </TableCell>

                    {/* ACTIONS COLUMN */}
                    <TableCell className="align-top text-right" onClick={(e) => e.stopPropagation()}>
                      {renderActions(order)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* МОДАЛКА ДЕТАЛЬНОЙ ИНФОРМАЦИИ О ЗАКАЗЕ */}
      <Dialog open={!!activeOrderModal} onOpenChange={(open) => !open && setActiveOrderModal(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {activeOrderModal && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    Zamówienie #{activeOrderModal._id.slice(-6)}
                  </DialogTitle>
                  {getStatusBadge(activeOrderModal.status, activeOrderModal.confirmation.status)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Utworжено: {new Date(activeOrderModal.createdAt).toLocaleString()}
                </p>
              </DialogHeader>

              {/* Данные клиента */}
              <div className="bg-slate-50 p-4 rounded-lg border space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Dane klienta</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{activeOrderModal.customer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${activeOrderModal.customer.phone}`} className="text-blue-600 hover:underline">{activeOrderModal.customer.phone}</a>
                  </div>
                  {activeOrderModal.customer.email && (
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{activeOrderModal.customer.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Способ доставки / Пачкомат */}
{/* Способ доставки / Пачкомат */}
              <div className="bg-slate-50 p-4 rounded-lg border space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Dostawa</h4>
                <div className="text-sm space-y-1">
                  <p className="font-medium capitalize flex items-center gap-2">
                    {activeOrderModal.fulfillment.type === 'delivery' ? <Truck className="w-4 h-4 text-blue-600" /> : <Store className="w-4 h-4 text-orange-600" />}
                    {activeOrderModal.fulfillment.type === 'delivery' ? 'Wysyłka kurierska / Paczkomat' : 'Odbiór własny w sklepie'}
                  </p>

                  {activeOrderModal.fulfillment.parcelLocker?.enabled && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md space-y-1">
                      <p className="text-xs font-bold text-blue-800 uppercase">Paczkomat: {activeOrderModal.fulfillment.parcelLocker.network}</p>
                      <p className="text-xs font-mono font-semibold text-blue-900">ID: {activeOrderModal.fulfillment.parcelLocker.lockerId}</p>
                      {activeOrderModal.fulfillment.parcelLocker.address?.street && (
                        <p className="text-xs text-blue-700">{activeOrderModal.fulfillment.parcelLocker.address.street}</p>
                      )}
                    </div>
                  )}

                  {/* БЛОК С ЭТИКЕТКОЙ (Реальный или Демо для презентации) */}
                  {(activeOrderModal.shipping?.trackingNumber || activeOrderModal.fulfillment.parcelLocker?.enabled) && (
                    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-sm font-bold text-emerald-800">Etykieta nadawcza</p>
                        <p className="text-xs font-mono text-emerald-900 mt-0.5">
                          Tracking: {activeOrderModal.shipping?.trackingNumber || 'FRG-DEMO-8273645'}
                        </p>
                      </div>
                      <a 
                        // Если есть реальная ссылка - берем её. Если нет - даем ссылку на пример PDF от Furgonetka
                        href={activeOrderModal.shipping?.labelUrl || 'https://furgonetka.pl/img/site/help/list_przewozowy_wzor.pdf'} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 flex items-center gap-2 transition-colors"
                      >
                        Pobierz etykietę <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Список товаров */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Zamówione produkty</h4>
                <div className="border rounded-lg divide-y">
                  {activeOrderModal.items.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Ilość: {item.quantity} × {item.basePrice} {activeOrderModal.pricing.currency.toUpperCase()}</p>
                      </div>
                      <div className="font-semibold">
                        {(item.price * item.quantity).toFixed(2)} {activeOrderModal.pricing.currency.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Итоги цен */}
              <div className="bg-gray-50 p-4 rounded-lg border space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Wartość produktów:</span>
                  <span>{activeOrderModal.pricing.subtotal.toFixed(2)} {activeOrderModal.pricing.currency.toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Dostawa:</span>
                  <span>{activeOrderModal.pricing.deliveryFee.toFixed(2)} {activeOrderModal.pricing.currency.toUpperCase()}</span>
                </div>
                {activeOrderModal.pricing.serviceFee > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Opłata serwisowa:</span>
                    <span>{activeOrderModal.pricing.serviceFee.toFixed(2)} {activeOrderModal.pricing.currency.toUpperCase()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t">
                  <span>Razem do zapłaty:</span>
                  <span>{activeOrderModal.pricing.total.toFixed(2)} {activeOrderModal.pricing.currency.toUpperCase()}</span>
                </div>
              </div>

              {/* Управление статусом в модалке */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                {renderActions(activeOrderModal, true)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function OrdersPage() {
  const { selectedBranch } = useBranch();
  return <OrdersPageContent key={selectedBranch?._id} />;
}