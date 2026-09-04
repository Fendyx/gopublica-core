'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Link from 'next/link';
import type { MenuItem } from '@/entities/menu-item/types';

interface SearchBarProps {
  tenantId: string;
  branchSlug: string;
}

export default function SearchBar({ tenantId, branchSlug }: SearchBarProps) {
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const CURRENCY_SYMBOLS: Record<string, string> = {
    PLN: 'zł', EUR: '€', USD: '$', UAH: '₴', GBP: '£',
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/public/products/search?tenantId=${tenantId}&q=${encodeURIComponent(q.trim())}`,
        { cache: 'no-store' },
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.slice(0, 8));
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const handleChange = (value: string) => {
    setQuery(value);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/${locale}/${branchSlug}/catalog/search?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => query.trim().length >= 2 && setOpen(true)}
            placeholder="Search books, authors, publishers..."
            className="pl-10 pr-8"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {open && (query.trim().length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-xl shadow-lg z-50 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground text-sm">No results found</div>
          ) : (
            <>
              {results.map((product) => (
                <Link
                  key={product._id}
                  href={`/${locale}/${branchSlug}/catalog/${product._id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs">No img</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.price.toFixed(2)} zł</p>
                  </div>
                </Link>
              ))}
              <Link
                href={`/${locale}/${branchSlug}/catalog/search?q=${encodeURIComponent(query.trim())}`}
                onClick={() => setOpen(false)}
                className="block text-center py-3 text-sm text-primary hover:bg-muted/50 border-t border-border"
              >
                View all results →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
