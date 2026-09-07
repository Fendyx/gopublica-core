'use client'

import { useTranslations } from 'next-intl'
import { useMediaQuery } from '@/shared/lib/useMediaQuery'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useCartStore } from '@/shared/store/cartStore'
import CartSheetContent from './CartSheetContent'

export default function CartSheet() {
  const t = useTranslations('nav')
  const isCartOpen = useCartStore((s) => s.isCartOpen)
  const closeCart = useCartStore((s) => s.closeCart)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  return (
    <Sheet open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent
        side={isDesktop ? 'right' : 'bottom'}
        className={
          isDesktop
            ? 'w-[420px] max-w-[90vw] p-0'
            : 'max-h-[85vh] rounded-t-2xl p-0'
        }
        showCloseButton={isDesktop}
      >
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border">
          <SheetTitle className="text-lg font-semibold">
            {t('cart')}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Review your cart items
          </SheetDescription>
        </SheetHeader>
        <CartSheetContent />
      </SheetContent>
    </Sheet>
  )
}
