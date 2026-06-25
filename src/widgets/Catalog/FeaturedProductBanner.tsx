import Link from 'next/link';
import type { MenuItem } from '@/entities/menu-item/types';
import AddToCartButton from '@/widgets/Catalog/AddToCartButton';

export default function FeaturedProductBanner({
  product,
  locale,
  currencySymbol,
}: {
  product: MenuItem;
  locale: string;
  currencySymbol: string;
}) {
  return (
    <div className="flex flex-row w-full bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow min-h-[240px] lg:min-h-[320px]">
      {/* Левая часть – изображение, растянутое на всю доступную высоту */}
      <div className="w-2/5 lg:w-1/2 flex-shrink-0 relative bg-muted/50">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No Image
          </div>
        )}
      </div>

      {/* Правая часть – информация о продукте */}
      <div className="flex flex-col justify-center p-4 lg:p-6 w-3/5 lg:w-1/2 gap-2 lg:gap-3">
        <h2 className="text-xl lg:text-3xl font-bold text-foreground line-clamp-2">
          {product.name}
        </h2>
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-3 hidden sm:block">
            {product.description}
          </p>
        )}
        <div className="text-xl lg:text-2xl font-bold text-primary">
          {product.price} {currencySymbol}
        </div>
        <AddToCartButton product={product} />
      </div>
    </div>
  );
}