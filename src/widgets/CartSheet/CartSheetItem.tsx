'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCartStore, CartItem } from '@/shared/store/cartStore'

interface CartSheetItemProps {
  item: CartItem
  currencySymbol: string
}

export default function CartSheetItem({ item, currencySymbol }: CartSheetItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)

  return (
    <li className="flex flex-col gap-2 p-3 border border-border rounded-xl bg-surface-hover/50">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <span className="text-foreground font-medium text-sm block truncate">
            {item.name}
          </span>

          {item.modifiers && item.modifiers.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {item.modifiers.map((mod) => (
                <li key={mod.optionId} className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="text-muted-foreground/60">•</span>
                  <span>{mod.optionName}</span>
                  {mod.priceImpact > 0 && (
                    <span className="text-muted-foreground/60">
                      (+{mod.priceImpact.toFixed(2)} {currencySymbol})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {item.notes && (
            <p className="text-xs text-muted-foreground/60 italic mt-1 truncate">
              ✎ {item.notes}
            </p>
          )}
        </div>

        <span className="text-foreground font-semibold text-sm whitespace-nowrap">
          {(item.price * item.quantity).toFixed(2)} {currencySymbol}
        </span>
      </div>

      <div className="flex items-center justify-between mt-1 pt-2 border-t border-border border-dashed">
        <div className="flex items-center gap-1 border border-border rounded-full p-1 bg-background">
          <button
            onClick={() => updateQuantity(item.uid, item.quantity - 1)}
            className="p-1.5 rounded-full hover:bg-surface-hover transition-colors text-muted-foreground"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-sm font-semibold w-6 text-center text-foreground">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.uid, item.quantity + 1)}
            className="p-1.5 rounded-full hover:bg-surface-hover transition-colors text-muted-foreground"
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => removeItem(item.uid)}
          className="p-2 rounded-full text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-colors"
          aria-label="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </li>
  )
}
