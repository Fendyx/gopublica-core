'use client';
import { useTranslations } from 'next-intl';
import type { ProductVariant } from '@/entities/menu-item/types';

export default function VariantSelector({
  variants,
  selectedId,
  onChange,
}: {
  variants: ProductVariant[];
  selectedId?: string | null;
  onChange?: (variantId: string) => void;
}) {
  const t = useTranslations('productDetail');
  const currentId = selectedId || variants[0]?.id || '';
  const currentVariant = variants.find(v => v.id === currentId) || null;

  const handleSelect = (id: string) => onChange?.(id);

  const attributeKeys = new Set<string>();
  variants.forEach(v => {
    if (v.attributes) Object.keys(v.attributes).forEach(k => attributeKeys.add(k));
  });

  return (
    <div className="space-y-5">
      {attributeKeys.size > 0 ? (
        Array.from(attributeKeys).map(key => {
          const uniqueValues = Array.from(
            new Set(
              variants
                .filter(v => v.attributes?.[key])
                .map(v => v.attributes![key])
            )
          );

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] tracking-widest uppercase font-medium text-muted-foreground">
                  {key}
                </span>
                {currentVariant?.attributes?.[key] && (
                  <span className="text-[10px] tracking-widest uppercase text-foreground">
                    {currentVariant.attributes[key]}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {uniqueValues.map(value => {
                  const matchedVariant = variants.find(v => v.attributes?.[key] === value);
                  const isSelected = currentVariant?.attributes?.[key] === value;
                  const isOos = (matchedVariant?.stock ?? 1) === 0;

                  return (
                    <button
                      key={value}
                      onClick={() => matchedVariant && handleSelect(matchedVariant.id)}
                      disabled={isOos}
                      className={[
                        'relative min-w-[44px] h-10 px-3',
                        'text-[10px] tracking-widest uppercase',
                        'border transition-colors duration-150',
                        isSelected
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border text-foreground hover:border-foreground',
                        isOos ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
                      ].join(' ')}
                    >
                      {value}
                      {isOos && (
                        <span className="absolute inset-0 overflow-hidden pointer-events-none">
                          <span
                            className="absolute left-0 right-0 top-1/2 h-px bg-current opacity-50"
                            style={{ transform: 'rotate(-18deg) scaleX(1.4)' }}
                          />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })
      ) : (
        <div>
          <span className="block text-[10px] tracking-widest uppercase text-muted-foreground mb-3">
            {t('variant')}
          </span>
          <div className="flex flex-wrap gap-2">
            {variants.map(v => {
              const isSelected = currentId === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => handleSelect(v.id)}
                  className={[
                    'min-w-[44px] h-10 px-3',
                    'text-[10px] tracking-widest uppercase',
                    'border transition-colors duration-150',
                    isSelected
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border text-foreground hover:border-foreground',
                  ].join(' ')}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {currentVariant?.stock != null && (
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
          {currentVariant.stock > 10
            ? t('inStock')
            : currentVariant.stock > 0
            ? t('stockLeft', { count: currentVariant.stock })
            : t('outOfStock')}
        </p>
      )}
    </div>
  );
}