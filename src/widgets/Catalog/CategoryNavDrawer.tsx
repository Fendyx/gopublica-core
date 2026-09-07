'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import CategoryTree from './CategoryTree';
import { useCategoryNav } from '@/shared/ui/CategoryNavContext';
import type { CategoryNavItem } from '@/entities/product-category/types';

interface CategoryNavDrawerProps {
  categories: CategoryNavItem[];
}

export default function CategoryNavDrawer({ categories }: CategoryNavDrawerProps) {
  const { mobileDrawerOpen, setMobileDrawerOpen } = useCategoryNav();

  if (!categories || categories.length === 0) return null;

  return (
    <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
      <SheetContent side="left" className="w-72 p-0" showCloseButton={false}>
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="text-base">Catalog</SheetTitle>
        </SheetHeader>
        <div className="py-3 overflow-y-auto h-[calc(100vh-4rem)]">
          <CategoryTree
            categories={categories}
            onNavigate={() => setMobileDrawerOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
