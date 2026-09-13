'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useParams, usePathname } from 'next/navigation';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Icon } from '@iconify/react';
import { isEmojiIcon } from '@/shared/ui/IconPickerButton';
import type { CategoryNavItem, CategoryTreeItem } from '@/entities/product-category/types';

/** Legacy emoji → Iconify identifier mapping for backward compatibility. */
const EMOJI_TO_ICONIFY: Record<string, string> = {
  '📚': 'lucide:book-open',
  '📖': 'lucide:book-open',
  '🎨': 'lucide:palette',
  '🎮': 'lucide:gamepad-2',
  '🧸': 'lucide:heart',
  '📦': 'lucide:package',
  '🛍️': 'lucide:shopping-bag',
  '🛍': 'lucide:shopping-bag',
  '🍽️': 'lucide:utensils-crossed',
  '🍽': 'lucide:utensils-crossed',
  '👕': 'lucide:shirt',
  '👗': 'lucide:shirt',
  '💎': 'lucide:gem',
  '🏷️': 'lucide:tag',
  '🏷': 'tag',
};

/**
 * Resolve an icon value to an Iconify identifier string.
 * - If already an Iconify ID (contains ":"), return as-is.
 * - If it's an emoji, look up the mapping.
 * - Otherwise, assume it's a lucide name and prefix it.
 */
function resolveIconifyId(iconValue?: string): string | null {
  if (!iconValue) return null;
  if (iconValue.includes(':')) return iconValue; // already Iconify format
  if (isEmojiIcon(iconValue)) return EMOJI_TO_ICONIFY[iconValue] ?? null;
  // Legacy bare name like "Package" → "lucide:package"
  return `lucide:${iconValue.toLowerCase()}`;
}

function buildTree(categories: CategoryNavItem[]): CategoryTreeItem[] {
  const sorted = [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const map = new Map<string, CategoryTreeItem>();
  const roots: CategoryTreeItem[] = [];

  // First pass: create all nodes
  for (const cat of sorted) {
    map.set(cat.key, { ...cat, children: [] });
  }

  // Second pass: build parent-child relationships
  for (const cat of sorted) {
    const node = map.get(cat.key)!;
    if (cat.parentCategoryKey && map.has(cat.parentCategoryKey)) {
      map.get(cat.parentCategoryKey)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function CategoryNode({
  node,
  activeKey,
  locale,
  branchSlug,
  onNavigate,
  defaultOpen,
}: {
  node: CategoryTreeItem;
  activeKey: string | null;
  locale: string;
  branchSlug: string;
  onNavigate?: () => void;
  defaultOpen?: boolean;
}) {
  const isActive = activeKey === node.key;
  const hasChildren = node.children.length > 0;
  const [expanded, setExpanded] = useState(defaultOpen ?? isActive);
  const href = `/${locale}/${branchSlug}/catalog/${node.key}`;

  const iconId = resolveIconifyId(node.icon);

  return (
    <li>
      <div className="flex items-center">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 mr-0.5 text-gray-500 hover:text-gray-700 shrink-0 transition-colors"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ) : (
          <span className="w-[22px] mr-0.5 shrink-0" />
        )}
        <Link
          href={href}
          onClick={onNavigate}
          className={`flex items-center gap-1.5 py-1.5 px-2.5 text-sm rounded-md transition-colors flex-1 min-w-0 truncate ${
            isActive
              ? 'bg-gray-100 font-medium text-gray-900'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-normal'
          }`}
        >
          {iconId && !hasChildren && (
            <Icon icon={iconId} className="w-4 h-4 shrink-0 text-gray-500" />
          )}
          <span className={hasChildren ? 'font-medium' : ''}>
            {node.translations?.[locale]?.name || node.name}
          </span>
        </Link>
      </div>
      {hasChildren && expanded && (
        <ul className="ml-3 pl-4 border-l border-gray-200 space-y-0.5">
          {node.children.map((child) => (
            <CategoryNode
              key={child.key}
              node={child}
              activeKey={activeKey}
              locale={locale}
              branchSlug={branchSlug}
              onNavigate={onNavigate}
              defaultOpen={!!activeKey && isDescendant(child, activeKey)}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function isDescendant(node: CategoryTreeItem, targetKey: string): boolean {
  for (const child of node.children) {
    if (child.key === targetKey) return true;
    if (isDescendant(child, targetKey)) return true;
  }
  return false;
}

interface CategoryTreeProps {
  categories: CategoryNavItem[];
  onNavigate?: () => void;
  className?: string;
}

export default function CategoryTree({ categories, onNavigate, className }: CategoryTreeProps) {
  const locale = useLocale();
  const { branchSlug } = useParams();
  const pathname = usePathname();
  const t = useTranslations('nav');

  const branchSlugStr = (Array.isArray(branchSlug) ? branchSlug[0] : branchSlug) ?? '';

  const tree = useMemo(() => buildTree(categories), [categories]);

  // Extract active category key from pathname: /{locale}/{branchSlug}/catalog/{key}
  const activeKey = useMemo(() => {
    const match = pathname?.match(/\/catalog\/([^/]+)$/);
    return match ? match[1] : null;
  }, [pathname]);

  if (tree.length === 0) return null;

  return (
    <nav className={className}>
      <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-gray-500">
        {t('catalog')}
      </div>
      <ul className="space-y-1 px-1">
        {tree.map((node) => (
          <CategoryNode
            key={node.key}
            node={node}
            activeKey={activeKey}
            locale={locale}
            branchSlug={branchSlugStr}
            onNavigate={onNavigate}
            defaultOpen={!!activeKey && (node.key === activeKey || isDescendant(node, activeKey))}
          />
        ))}
      </ul>
    </nav>
  );
}
