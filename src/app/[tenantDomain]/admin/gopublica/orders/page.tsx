'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { fetchMyOrders } from '@/entities/platformProduct/api';
import type { PlatformOrder } from '@/entities/platformProduct/types';
import {
  Card,
  CardContent,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart, CheckCircle, Clock, Truck, Package,
} from 'lucide-react';

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-orange-100 text-orange-700',
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function PlatformOrdersPage() {
  const t = useTranslations('admin.gopublicaPage');
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<PlatformOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const success = searchParams.get('success') === 'true';

  useEffect(() => {
    fetchMyOrders()
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-1.5 py-12">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-muted-foreground/30 animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShoppingCart className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight">{t('myOrders')}</h1>
      </div>

      {success && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="p-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-700">
              Your order has been placed successfully!
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {orders.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">{t('noOrders')}</p>
            <p className="text-xs text-muted-foreground/70">{t('noOrdersDesc')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order._id} className="overflow-hidden">
              <div
                className={`h-1 ${
                  order.orderStatus === 'delivered'
                    ? 'bg-green-500'
                    : order.orderStatus === 'cancelled'
                    ? 'bg-red-500'
                    : 'bg-primary'
                }`}
              />
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs text-muted-foreground font-mono">
                    #{order._id.slice(-8).toUpperCase()}
                  </span>
                  <Badge
                    className={`text-[10px] tracking-wider uppercase ${
                      ORDER_STATUS_COLORS[order.orderStatus] || ''
                    }`}
                    variant="secondary"
                  >
                    {order.orderStatus}
                  </Badge>
                  <Badge
                    className={`text-[10px] tracking-wider uppercase ${
                      PAYMENT_STATUS_COLORS[order.paymentStatus] || ''
                    }`}
                    variant="secondary"
                  >
                    {order.paymentStatus}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {order.paymentMethod === 'stripe' ? '💳 Stripe' : '📦 COD'}
                  </Badge>
                  <time className="text-xs text-muted-foreground ml-auto">
                    {new Date(order.createdAt).toLocaleDateString(undefined, {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </time>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      {item.photo && (
                        <img
                          src={item.photo}
                          alt=""
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{item.title}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ×{item.quantity}
                      </span>
                      <span className="text-sm font-medium">
                        {order.pricing.currency} {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border">
                  <span>Total</span>
                  <span>
                    {order.pricing.currency} {order.pricing.total.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
