'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Calendar,
  MapPin,
  Ticket as TicketIcon,
  ShoppingCart,
  Plus,
  Minus,
} from 'lucide-react';
import { useCartStore } from '@/shared/store/cartStore';
import { useToast } from '@/shared/ui/Toast';
import { Button } from '@/components/ui/button';
import type { Article } from '@/entities/article/types';

interface TicketCardProps {
  article: Article;
}

export function TicketCard({ article }: TicketCardProps) {
  const t = useTranslations('article.ticketCard');
  const { showToast } = useToast();
  const { addItem } = useCartStore();

  // Quantity state — must live before the early return below (Rules of Hooks).
  const [quantity, setQuantity] = useState(1);
  const maxQty = Math.max(
    1,
    (article.totalTickets || 0) - (article.ticketsSold || 0)
  );

  if (!article.isEvent) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBuyTicket = () => {
    const uid = `ticket_${article._id}`;
    addItem({
      uid,
      itemType: 'ticket',
      articleId: article._id,
      menuItemId: article._id, // required by CartItem; for tickets it's the event/article id
      name: article.title,
      price: article.ticketPrice || 0,
      basePrice: article.ticketPrice || 0,
      quantity, // selected quantity instead of hardcoded 1
      ticketMeta: {
        eventDate: article.eventDate ?? undefined,
      },
    });
    showToast(t('addedToCart'), 'success');
  };

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 bg-background border-t p-4 shadow-lg lg:relative lg:border-none lg:shadow-none lg:p-0 lg:sticky lg:top-24">
      {/* Mobile: compact horizontal bar */}
      <div className="flex flex-row items-center justify-between gap-4 lg:hidden">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">{t('price')}</span>
          <span className="text-xl font-bold text-primary leading-tight">
            {article.ticketPrice ? formatPrice(article.ticketPrice) : '—'}
          </span>
        </div>

        {/* Quantity selector */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label={t('decreaseQuantity')}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center text-sm font-semibold tabular-nums">
            {quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            disabled={quantity >= maxQty}
            aria-label={t('increaseQuantity')}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Button onClick={handleBuyTicket} className="gap-2 shrink-0">
          <ShoppingCart className="w-4 h-4" />
          {t('buyTicket')}
        </Button>
      </div>

      {/* Desktop: full card layout */}
      <div className="hidden lg:block bg-card border rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <TicketIcon className="w-4 h-4" />
          <span className="font-medium">{t('eventTicket')}</span>
        </div>

        {/* Secondary event details — hidden on mobile, visible on desktop */}
        <div className="hidden lg:block space-y-4 mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{t('eventDate')}</p>
              <p className="font-medium">
                {article.eventDate ? formatDate(article.eventDate) : '—'}
              </p>
            </div>
          </div>

          {article.venueName && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{t('venue')}</p>
                <p className="font-medium">{article.venueName}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-3 border-t">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{t('price')}</p>
              <p className="text-2xl font-bold text-primary">
                {article.ticketPrice ? formatPrice(article.ticketPrice) : '—'}
              </p>
            </div>

            {/* Quantity selector (desktop) */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label={t('decreaseQuantity')}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-sm font-semibold tabular-nums">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                disabled={quantity >= maxQty}
                aria-label={t('increaseQuantity')}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Button onClick={handleBuyTicket} className="w-full gap-2 py-3 text-lg">
          <ShoppingCart className="w-5 h-5" />
          {t('buyTicket')}
        </Button>

        {article.totalTickets && article.ticketsSold !== undefined && (
          <p className="text-center text-xs text-muted-foreground mt-3">
            {t('ticketsLeft', {
              left: article.totalTickets - (article.ticketsSold || 0),
            })}
          </p>
        )}
      </div>
    </div>
  );
}