'use client';

import CategoryTree from './CategoryTree';
import type { CategoryNavItem } from '@/entities/product-category/types';

interface CategoryNavSidebarProps {
  categories: CategoryNavItem[];
}

export default function CategoryNavSidebar({ categories }: CategoryNavSidebarProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <aside className="hidden lg:block sticky top-16 z-40 w-64 shrink-0 h-[calc(100vh-4rem)] overflow-y-auto border-r border-border bg-background/80 backdrop-blur-sm">
      <div className="py-4">
        <CategoryTree categories={categories} />
      </div>
    </aside>
  );
}
