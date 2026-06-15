'use client';
import type { MenuItem } from '@/entities/menu-item/types';
import { getLocalizedName, getLocalizedDescription } from '@/shared/lib/localization';
import { useBranch } from '@/entities/branch/BranchContext';
import { useBranchSettings } from '@/entities/branch/useBranchSettings';

interface MenuItemCardProps {
  item: MenuItem;
  mode?: 'public' | 'admin';
  layout?: 'grid' | 'list';
  onEdit?: (item: MenuItem) => void;
  onDelete?: (id: string) => void;
  locale?: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  PLN: 'zł',
  EUR: '€',
  USD: '$',
  UAH: '₴',
  GBP: '£',
  CZK: 'Kč',
  CHF: 'CHF',
};

function getCurrencySymbol(currencyCode?: string): string {
  return currencyCode ? CURRENCY_SYMBOLS[currencyCode] || currencyCode : 'zł';
}

export default function MenuItemCard({
  item,
  mode = 'public',
  layout = 'grid',
  onEdit,
  onDelete,
  locale,
}: MenuItemCardProps) {
  const { selectedBranch, branches } = useBranch();
  const { primaryLanguage, primaryCurrency, loading: settingsLoading } = useBranchSettings();
  const showBranchBadge = branches.length > 1 && selectedBranch;

  if (settingsLoading) {
    return <div className="h-48 bg-surface-hover animate-pulse rounded-2xl" />;
  }

  const displayName = locale && primaryLanguage
    ? getLocalizedName(item, locale, primaryLanguage)
    : item.name;
  const displayDescription = locale && primaryLanguage
    ? getLocalizedDescription(item, locale, primaryLanguage)
    : item.description;

  if (layout === 'list') {
    return (
      <article className="group flex items-stretch bg-surface-card border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-dropdown">
        {item.image && (
          <div className="flex-shrink-0 w-28 sm:w-40 overflow-hidden bg-surface-hover">
            <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
          </div>
        )}

        <div className="flex flex-col justify-between flex-1 p-4 gap-2">
          <div className="flex flex-col gap-1">
            <h3 className="font-heading font-semibold text-text-primary text-base leading-snug tracking-tight">{displayName}</h3>
            {displayDescription && <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{displayDescription}</p>}
            <div className="flex flex-wrap gap-1.5 mt-1">
              {item.isVegetarian && <Badge type="veg" />}
              {item.isSpicy && <Badge type="spicy" />}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border-light">
            <Price value={item.price} currency={primaryCurrency} />
            {mode === 'admin' && <AdminActions onEdit={() => onEdit?.(item)} onDelete={() => onDelete?.(item._id!)} />}
          </div>

          {showBranchBadge && (
            <div className="mt-1 text-[10px] text-gray-400 flex items-center gap-1">
              📍 {selectedBranch.city} · {selectedBranch.name}
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col bg-surface-card border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-dropdown">
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-surface-hover">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-text-tertiary"><PlaceholderIcon /></div>
        )}

        {(item.isVegetarian || item.isSpicy) && (
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {item.isVegetarian && <Badge type="veg" />}
            {item.isSpicy && <Badge type="spicy" />}
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4 gap-1.5">
        <h3 className="font-heading font-semibold text-text-primary text-base leading-snug tracking-tight">{displayName}</h3>
        {displayDescription && <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{displayDescription}</p>}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border-light">
          <Price value={item.price} currency={primaryCurrency} />
          {mode === 'admin' && <AdminActions onEdit={() => onEdit?.(item)} onDelete={() => onDelete?.(item._id!)} hidden />}
        </div>

        {showBranchBadge && (
          <div className="mt-1 text-[10px] text-gray-400 flex items-center gap-1">
            📍 {selectedBranch.city} · {selectedBranch.name}
          </div>
        )}
      </div>
    </article>
  );
}

function Price({ value, currency }: { value: number | string; currency?: string }) {
  const symbol = getCurrencySymbol(currency);
  return <span className="font-heading font-bold text-primary text-lg leading-none tracking-tight">{value}<span className="text-xs font-medium opacity-70"> {symbol}</span></span>;
}

function Badge({ type }: { type: 'veg' | 'spicy' }) {
  const styles = type === 'veg' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200';
  return <span className={`inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full leading-none ${styles}`}>
    {type === 'veg' ? '🌱 Veg' : '🌶 Spicy'}
  </span>;
}

function AdminActions({ onEdit, onDelete, hidden }: { onEdit: () => void; onDelete: () => void; hidden?: boolean }) {
  return <div className={`flex items-center gap-1.5 transition-opacity duration-200 ${hidden ? 'opacity-0 group-hover:opacity-100' : ''}`}>
    <button onClick={onEdit} className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors">Edit</button>
    <button onClick={onDelete} className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors">Delete</button>
  </div>;
}

function PlaceholderIcon() {
  return <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
    <rect width="36" height="36" rx="8" fill="currentColor" fillOpacity="0.08" />
    <path d="M11 25l6-8 4 5.5 3-4 5 6.5H11z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" opacity="0.4" />
    <circle cx="14" cy="15" r="2" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
  </svg>;
}