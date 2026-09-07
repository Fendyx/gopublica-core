'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useParams, usePathname } from 'next/navigation';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { CategoryNavItem, CategoryTreeItem } from '@/entities/product-category/types';

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

  return (
    <li>
      <div className="flex items-center">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 mr-0.5 text-muted-foreground hover:text-foreground shrink-0"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <span className="w-[18px] mr-0.5 shrink-0" />
        )}
        <Link
          href={href}
          onClick={onNavigate}
          className={`block py-1 px-2 text-sm rounded-md transition-colors flex-1 min-w-0 truncate ${
            isActive
              ? 'font-semibold text-primary bg-primary/5'
              : 'text-foreground/80 hover:text-foreground hover:bg-muted/50'
          }`}
          style={isActive ? { borderLeft: '2px solid var(--tenant-primary, hsl(var(--primary)))' } : undefined}
        >
          {node.icon && <span className="mr-1.5">{node.icon}</span>}
          {node.name}
        </Link>
      </div>
      {hasChildren && expanded && (
        <ul className="ml-4 pl-2 border-l border-border-light">
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
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t('catalog')}
      </div>
      <ul className="space-y-0.5 px-1">
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
