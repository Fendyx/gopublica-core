'use client'

import { useLocale } from 'next-intl'
import { Link as IntlLink } from '@/i18n/routing'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/shared/store/cartStore'
import { useBranchSettings } from '@/entities/branch/useBranchSettings'
import CartSheetItem from './CartSheetItem'

const CURRENCY_SYMBOLS: Record<string, string> = {
  PLN: 'zł', EUR: '€', USD: '$', UAH: '₴', GBP: '£', CZK: 'Kč', CHF: 'CHF',
}

function getCurrencySymbol(currencyCode?: string): string {
  return currencyCode ? CURRENCY_SYMBOLS[currencyCode] || currencyCode : 'zł'
}

export default function CartSheetContent() {
  const t = useTranslations('cart')
  const locale = useLocale()
  const router = useRouter()
  const { primaryCurrency } = useBranchSettings()
  const items = useCartStore((s) => s.items)
  const subtotal = useCartStore((s) => s.getSubtotal())
  const closeCart = useCartStore((s) => s.closeCart)

  const currencySymbol = getCurrencySymbol(primaryCurrency)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
        <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {t('emptyTitle')}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {t('emptyDescription')}
        </p>
        <Button asChild variant="outline" onClick={closeCart}>
          <IntlLink href={`/${locale}`}>
            {t('browseMenu')}
          </IntlLink>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable item list */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <ul className="space-y-3">
          {items.map((item) => (
            <CartSheetItem key={item.uid} item={item} currencySymbol={currencySymbol} />
          ))}
        </ul>
      </div>

      {/* Sticky footer */}
      <div className="border-t border-border p-4 space-y-3 bg-background">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">{t('subtotal')}</span>
          <span className="font-semibold text-foreground">
            {subtotal.toFixed(2)} {currencySymbol}
          </span>
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">{t('totalItems', { count: items.reduce((acc, i) => acc + i.quantity, 0) })}</span>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={() => {
            closeCart()
            router.push(`/${locale}/order/checkout`)
          }}
        >
          {t('proceedToCheckout')}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <button
          onClick={closeCart}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          {t('continueShopping')}
        </button>
      </div>
    </div>
  )
}
