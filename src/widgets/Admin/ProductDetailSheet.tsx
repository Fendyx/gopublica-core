'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePlatformCartStore } from '@/shared/store/platformCartStore';
import type { MarketplaceProduct } from '@/entities/platformProduct/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Plus, Minus, X, CheckCircle } from 'lucide-react';

interface ProductDetailSheetProps {
  product: MarketplaceProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProductDetailSheet({
  product,
  open,
  onOpenChange,
}: ProductDetailSheetProps) {
  const locale = useLocale();
  const t = useTranslations('admin.productDetailSheet');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = usePlatformCartStore((s) => s.addItem);

  if (!product) return null;

  // Resolve translations
  const title = product.titleI18n?.[locale] || product.title;
  const description = product.descriptionI18n?.[locale] || product.description;

  const handleAdd = () => {
    addItem(
      {
        productId: product._id,
        title: product.title,
        price: product.price,
        currency: product.currency,
        photo: product.photo,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setQuantity(1);
    }, 1500);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        {/* Photo */}
        <div className="relative h-56 bg-muted/30">
          {product.photo ? (
            <img
              src={product.photo}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <ShoppingCart className="w-16 h-16 text-muted-foreground/20" />
            </div>
          )}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-background/80 backdrop-blur hover:bg-background transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <SheetHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-[10px] tracking-wider uppercase">
                {product.category}
              </Badge>
              {product.targetNiches.map((n) => (
                <Badge key={n} variant="outline" className="text-[10px]">
                  {n}
                </Badge>
              ))}
            </div>
            <SheetTitle className="text-xl font-semibold">{title}</SheetTitle>
            <SheetDescription className="text-sm leading-relaxed">
              {description || t('noDescription')}
            </SheetDescription>
          </SheetHeader>

          {/* Price */}
          <div className="text-2xl font-bold">
            {product.currency} {product.price.toFixed(2)}
          </div>

          {/* Specs */}
          {product.specs && product.specs.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">{t('specifications')}</h4>
              <div className="rounded-lg border border-border overflow-hidden">
                {product.specs.map((spec, idx) => (
                  <div
                    key={idx}
                    className={`flex text-sm ${
                      idx % 2 === 0 ? 'bg-muted/20' : ''
                    }`}
                  >
                    <span className="w-1/2 px-3 py-2 font-medium text-muted-foreground">
                      {spec.keyI18n?.[locale] || spec.key}
                    </span>
                    <span className="w-1/2 px-3 py-2">
                      {spec.valueI18n?.[locale] || spec.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Quantity + Add to Cart */}
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-border rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 hover:bg-muted/50 transition-colors rounded-l-lg"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm font-medium min-w-[40px] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 hover:bg-muted/50 transition-colors rounded-r-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <Button
              onClick={handleAdd}
              disabled={added}
              className="flex-1"
            >
              {added ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" /> {t('added')}
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" /> {t('addToCart')}
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
