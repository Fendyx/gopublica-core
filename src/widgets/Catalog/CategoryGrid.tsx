'use client';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ImageOff } from 'lucide-react';

export interface CategoryCardData {
  name: string;
  key: string;
  coverImage?: string;
  productCount?: number;
  cardBgColor?: string;
}

// Добавили пропс bgColor
export default function CategoryGrid({ categories, bgColor }: { categories: CategoryCardData[], bgColor?: string }) {
  const locale = useLocale();
  const t = useTranslations('catalog');

  if (!categories || categories.length === 0) return null;

  return (
    // Если bgColor передан — используем его, иначе берем дефолтный фон страницы
    <section className="py-12" style={{ backgroundColor: bgColor || 'var(--color-surface-page)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок секции */}
        <h2 className="uppercase tracking-[0.2em] text-xs text-muted-foreground mb-6 font-semibold">
          {t('shopByCategory')}
        </h2>

        {/* Сетка категорий */}
<div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link 
              key={cat.key} 
              href={`/${locale}/catalog/${cat.key}`} 
              // Используем inline стиль если цвет есть, иначе tailwind класс bg-muted
              className={`relative aspect-[4/5] overflow-hidden rounded-xl border border-border group ${!cat.cardBgColor ? 'bg-muted' : ''}`}
              style={cat.cardBgColor ? { backgroundColor: cat.cardBgColor } : undefined}
            >
              {/* Фото с эффектом наведения */}
              {cat.coverImage ? (
                <img 
                  src={cat.coverImage} 
                  alt={cat.name} 
                  className="object-cover w-full h-full transition-transform duration-500 ease-out group-hover:scale-105" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                  <ImageOff className="w-8 h-8" />
                </div>
              )}
              
              {/* Градиент снизу для читаемости текста */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Текст (Имя и кол-во товаров) */}
              <div className="absolute bottom-0 left-0 p-4 z-10">
                <h3 className="text-lg font-medium text-white drop-shadow-md">{cat.name}</h3>
                {cat.productCount !== undefined && (
                  <p className="text-sm text-white/80 drop-shadow-md">{cat.productCount} {cat.productCount === 1 ? 'item' : 'items'}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}