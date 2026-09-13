'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, X } from 'lucide-react';

/** Check if an icon value is a legacy emoji character (not an Iconify identifier). */
export function isEmojiIcon(value: string): boolean {
  // Iconify identifiers always contain a colon (e.g. "lucide:package"); emojis don't.
  return !value.includes(':');
}

/** Default icon shown when nothing is selected. */
const DEFAULT_ICON = 'lucide:package';

/** Popular starting icons grouped by category (shown before user searches). */
const POPULAR_ICONS: { label: string; icons: string[] }[] = [
  {
    label: 'Shopping',
    icons: [
      'lucide:package', 'lucide:shopping-bag', 'lucide:gift', 'lucide:tag',
      'lucide:crown', 'lucide:trophy', 'lucide:star', 'lucide:sparkles',
    ],
  },
  {
    label: 'Food & Drink',
    icons: [
      'lucide:utensils-crossed', 'lucide:coffee', 'lucide:cake', 'lucide:pizza',
      'lucide:ice-cream-cone', 'lucide:apple', 'lucide:wine', 'lucide:beer',
    ],
  },
  {
    label: 'Hobbies & Culture',
    icons: [
      'lucide:book-open', 'lucide:palette', 'lucide:music', 'lucide:camera',
      'lucide:gamepad-2', 'lucide:puzzle', 'lucide:ticket', 'lucide:film',
    ],
  },
  {
    label: 'Fashion & Beauty',
    icons: [
      'lucide:shirt', 'lucide:gem', 'lucide:scissors', 'lucide:flower-2', 'lucide:heart',
    ],
  },
  {
    label: 'Home & Living',
    icons: [
      'lucide:home', 'lucide:dog', 'lucide:baby', 'lucide:leaf', 'lucide:tree-pine',
    ],
  },
  {
    label: 'Tech & Sport',
    icons: [
      'lucide:laptop', 'lucide:smartphone', 'lucide:watch', 'lucide:headphones',
      'lucide:cpu', 'lucide:dumbbell', 'lucide:target', 'lucide:zap',
    ],
  },
];

interface IconPickerButtonProps {
  value: string;
  onChange: (iconName: string) => void;
  placeholder?: string;
}

export default function IconPickerButton({
  value,
  onChange,
  placeholder = DEFAULT_ICON,
}: IconPickerButtonProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentValue = value || placeholder;
  const isLegacyEmoji = isEmojiIcon(currentValue);

  /** Search Iconify API with debounced input. */
  const searchIcons = useCallback((searchQuery: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://api.iconify.design/search?query=${encodeURIComponent('lucide:' + trimmed)}&limit=64`
        );
        const data = await res.json();
        setResults(data.icons || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    searchIcons(query);
  }, [query, searchIcons]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0 h-10 w-10"
        onClick={() => setOpen(true)}
        title="Pick an icon"
      >
        {isLegacyEmoji ? (
          <span className="text-lg leading-none">{currentValue}</span>
        ) : (
          <Icon icon={currentValue} className="w-5 h-5" />
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 w-[420px] max-w-[95vw] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogTitle className="px-4 pt-4 pb-2 text-sm font-semibold">Choose an icon</DialogTitle>

          {/* Search input */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search icons..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 pr-8 h-9 text-sm"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Results grid or popular icons */}
          <div className="overflow-y-auto px-4 pb-4">
            {query.trim() ? (
              /* Search results */
              <div>
                {loading ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : results.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    No icons found
                  </div>
                ) : (
                  <div className="grid grid-cols-8 gap-1">
                    {results.map((iconName) => (
                      <IconGridItem
                        key={iconName}
                        iconName={iconName}
                        isSelected={value === iconName}
                        onSelect={(name) => {
                          onChange(name);
                          setOpen(false);
                          setQuery('');
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Popular icon categories */
              <div className="space-y-4">
                {POPULAR_ICONS.map((group) => (
                  <div key={group.label}>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">{group.label}</p>
                    <div className="grid grid-cols-8 gap-1">
                      {group.icons.map((iconName) => (
                        <IconGridItem
                          key={iconName}
                          iconName={iconName}
                          isSelected={value === iconName}
                          onSelect={(name) => {
                            onChange(name);
                            setOpen(false);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Single icon grid item button. */
function IconGridItem({
  iconName,
  isSelected,
  onSelect,
}: {
  iconName: string;
  isSelected: boolean;
  onSelect: (name: string) => void;
}) {
  // Strip prefix for tooltip display (e.g. "lucide:package" → "package")
  const shortName = iconName.split(':')[1] || iconName;

  return (
    <button
      type="button"
      onClick={() => onSelect(iconName)}
      className={`flex items-center justify-center w-9 h-9 rounded-md transition-colors ${
        isSelected
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
      }`}
      title={shortName}
    >
      <Icon icon={iconName} className="w-4 h-4" />
    </button>
  );
}
