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
  CheckCircle,
  XCircle,
  Clock,
  User,
  Package,
  MapPin,
  Bike,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Order, OrderConfirmationStatus, OrderStatus } from '@/entities/order/types';
import { getOrders, acceptOrder, declineOrder, updateOrderStatus } from '@/entities/order/api';

export default function OrdersPageContent() {
  const t = useTranslations('admin.ordersPage');
  const { selectedBranch, loading: branchLoading } = useBranch();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleAccept = async (id: string) => {
    try {
      await acceptOrder(id);
      fetchOrders();
    } catch (e) {
      console.error(e);
      alert(t('alerts.acceptError'));
    }
  };

  const handleDecline = async (id: string) => {
    const reason = prompt(t('alerts.declinePrompt'));
    if (!reason) return;
    try {
      await declineOrder(id, reason);
      fetchOrders();
    } catch (e) {
      console.error(e);
      alert(t('alerts.declineError'));
    }
  };

  const handleStatusChange = async (id: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(id, newStatus);
      fetchOrders();
    } catch (e) {
      console.error(e);
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
      case 'preparing': return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">{t('status.preparing')}</Badge>;
      case 'ready': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{t('status.ready')}</Badge>;
      case 'out_for_delivery': return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">{t('status.out_for_delivery')}</Badge>;
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
          <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700" onClick={() => handleAccept(order._id)}>
            <CheckCircle className="w-4 h-4 mr-1" /> {t('actions.accept')}
          </Button>
          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleDecline(order._id)}>
            <XCircle className="w-4 h-4 mr-1" /> {t('actions.decline')}
          </Button>
        </div>
      );
    }

    if (status === 'accepted' || status === 'paid') {
      return (
        <Button size="sm" onClick={() => handleStatusChange(order._id, 'preparing')}>
          <Package className="w-4 h-4 mr-1" /> {t('actions.startCooking')}
        </Button>
      );
    }

    if (status === 'preparing') {
      return (
        <Button size="sm" onClick={() => handleStatusChange(order._id, 'ready')}>
          <CheckCircle className="w-4 h-4 mr-1" /> {t('actions.ready')}
        </Button>
      );
    }

    if (status === 'ready') {
      if (fulfillment.type === 'delivery') {
        return (
          <Button size="sm" onClick={() => handleStatusChange(order._id, 'out_for_delivery')}>
            <Bike className="w-4 h-4 mr-1" /> {t('actions.sendCourier')}
          </Button>
        );
      } else {
        return (
          <Button size="sm" onClick={() => handleStatusChange(order._id, 'completed')}>
            <CheckCircle className="w-4 h-4 mr-1" /> {t('actions.handedOver')}
          </Button>
        );
      }
    }

    if (status === 'out_for_delivery') {
      return (
        <Button size="sm" onClick={() => handleStatusChange(order._id, 'completed')}>
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
            {t('title')}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('branchInfo', { name: selectedBranch.name, city: selectedBranch.city ? `(${selectedBranch.city})` : '' })}
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-12 h-12 text-muted-foreground/40 mb-4" />
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
                  <TableHead>{t('table.typeAddress')}</TableHead>
                  <TableHead>{t('table.items')}</TableHead>
                  <TableHead className="text-right">{t('table.total')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead className="text-right">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id} className="group">
                    <TableCell className="align-top">
                      <div className="font-mono text-xs text-muted-foreground">#{order._id.slice(-6)}</div>
                      <div className="text-sm font-medium mt-1">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>

                    <TableCell className="align-top">
                      <div className="font-medium flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        {order.customer.name}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{order.customer.phone}</div>
                      {order.customer.email && (
                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">{order.customer.email}</div>
                      )}
                    </TableCell>

                    <TableCell className="align-top">
                      <div className="flex items-center gap-1.5 mb-1">
                        {order.fulfillment.type === 'delivery' ? (
                          <Bike className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Package className="w-4 h-4 text-orange-500" />
                        )}
                        <span className="font-medium text-sm capitalize">
                          {order.fulfillment.type === 'delivery' ? t('delivery') : t('pickup')}
                        </span>
                      </div>
                      {order.fulfillment.type === 'delivery' && order.fulfillment.address && (
                        <div className="text-xs text-muted-foreground flex items-start gap-1">
                          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>
                            {order.fulfillment.address.city}, {order.fulfillment.address.street}
                          </span>
                        </div>
                      )}
                      {order.fulfillment.scheduledFor && (
                        <div className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
                           <Clock className="w-3 h-3" />
                           {t('scheduledFor')} {new Date(order.fulfillment.scheduledFor).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="align-top">
                      <div className="text-sm space-y-1">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex justify-between gap-4 text-xs">
                            <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                            <span>{item.price * item.quantity}</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="text-xs text-muted-foreground italic">{t('moreItems', { count: order.items.length - 3 })}</div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="align-top text-right">
                      <div className="font-bold text-lg">
                        {order.pricing.total.toFixed(2)} {order.pricing.currency.toUpperCase()}
                      </div>
                      {order.pricing.deliveryFee > 0 && (
                        <div className="text-xs text-muted-foreground">{t('deliveryFee', { fee: order.pricing.deliveryFee })}</div>
                      )}
                    </TableCell>

                    <TableCell className="align-top">
                      {getStatusBadge(order.status, order.confirmation.status)}
                      {order.confirmation.status === 'declined' && order.confirmation.declineReason && (
                        <div className="text-xs text-red-500 mt-1 truncate max-w-[150px]" title={order.confirmation.declineReason}>
                          {order.confirmation.declineReason}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="align-top text-right">
                      {renderActions(order)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}