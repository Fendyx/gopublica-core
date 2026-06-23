'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Clock, User, ShoppingBag, Loader2, ArrowLeft, Truck, Store } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

type MyOrder = {
  _id: string;
  createdAt: string;
  status: string;
  pricing: { total: number; currency: string };
  fulfillment: { type: string; address?: any };
  items: Array<{ name: string; quantity: number; price: number }>;
};

const getStatusStyles = (status: string) => {
  const s = status.toLowerCase();
  if (['completed', 'delivered', 'done'].includes(s)) return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800';
  if (['pending', 'processing', 'preparing', 'pending_payment', 'accepted', 'paid'].includes(s)) return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800';
  if (['cancelled', 'failed'].includes(s)) return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800';
  return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
};

export default function MyOrdersPage() {
  const { tenantDomain, locale } = useParams();
  const router = useRouter();
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations('profile');

  // Хелпер для перевода статуса. Если перевода нет — вернет как есть.
  const getTranslatedStatus = (status: string) => {
    const key = `statusLabels.${status}`;
    const translation = t(key);
    // Если next-intl не находит ключ, он возвращает сам ключ (например "profile.statusLabels.foo")
    return translation.includes('statusLabels') ? status : translation;
  };

  useEffect(() => {
    const fetchMyOrders = async () => {
      const token = localStorage.getItem('customer_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        } else if (res.status === 401) {
          localStorage.removeItem('customer_token');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">{t('loadingOrders')}</p>
      </div>
    );
  }

  if (!localStorage.getItem('customer_token')) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 text-center border border-border rounded-2xl bg-card shadow-sm">
        <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2 text-foreground">{t('loginToAccount')}</h2>
        <p className="text-muted-foreground mb-6">{t('loginToSeeOrders')}</p>
        <Button onClick={() => router.push(`/${locale}/menu`)}>{t('goToMenu')}</Button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto p-4 md:p-8 py-12 space-y-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <ShoppingBag className="w-7 h-7 text-primary" />
          {t('myOrders')}
        </h1>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${locale}/profile`}>
            <ArrowLeft className="w-4 h-4 mr-2" /> {t('back')}
          </Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card className="border-dashed border-2 rounded-2xl bg-muted/20">
          <CardContent className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground">{t('noOrders')}</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">{t('timeToCheckMenu')}</p>
            <Button asChild>
              <Link href={`/${locale}/menu`}>{t('goToMenuBtn')}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="rounded-2xl border-border/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-5 border-b border-border/80 bg-muted/30 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      #{order._id.slice(-4).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 capitalize">
                        {order.fulfillment?.type === 'delivery' ? (
                          <><Truck className="w-3.5 h-3.5" /> {t('delivery')}</>
                        ) : (
                          <><Store className="w-3.5 h-3.5" /> {t('pickup')}</>
                        )}
                      </p>
                    </div>
                  </div>
                  {/* Используем перевод статуса здесь */}
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border capitalize ${getStatusStyles(order.status)}`}>
                    {getTranslatedStatus(order.status)}
                  </span>
                </div>

                <CardContent className="p-5 space-y-4">
                  <div className="space-y-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                            {item.quantity}x
                          </span>
                          <span className="font-medium text-foreground">{item.name}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {item.price * item.quantity} {order.pricing.currency}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 mt-2 border-t border-dashed border-border flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">{t('total')}</span>
                    <span className="text-xl font-bold text-foreground">
                      {order.pricing.total} {order.pricing.currency}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}