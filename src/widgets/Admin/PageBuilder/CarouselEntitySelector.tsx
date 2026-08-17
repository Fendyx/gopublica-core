'use client';
import { useState, useEffect } from 'react';
import { fetchMenu } from '@/entities/menu-item/api';
import type { MenuItem } from '@/entities/menu-item/types';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface CarouselEntitySelectorProps {
  mode: 'ecommerce' | 'menu';
  selectionMode: 'items' | 'categories';
  selectedIds: string[];
  selectedCategoryKeys: string[];
  onChange: (ids: string[]) => void;
  onChangeCategories: (keys: string[]) => void;
  onSelectionModeChange: (mode: 'items' | 'categories') => void;
  showViewAll: boolean;
  onViewAllChange: (show: boolean) => void;
  viewAllLabel?: string;
  onViewAllLabelChange: (label: string) => void;
  tenantId: string;
  branchId?: string;
}

interface Category {
  key: string;
  name: string;
  coverImage?: string;
  description?: string;
}

export default function CarouselEntitySelector({
  mode,
  selectionMode,
  selectedIds,
  selectedCategoryKeys,
  onChange,
  onChangeCategories,
  onSelectionModeChange,
  showViewAll,
  onViewAllChange,
  viewAllLabel,
  onViewAllLabelChange,
  tenantId,
  branchId,
}: CarouselEntitySelectorProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Fetch menu items
  useEffect(() => {
    const loadItems = async () => {
      if (!tenantId) return;
      setItemsLoading(true);
      try {
        const data = await fetchMenu(tenantId, branchId || null);
        setItems(data);
      } catch (err) {
        console.error(err);
      } finally {
        setItemsLoading(false);
      }
    };
    loadItems();
  }, [tenantId, branchId]);

  // Fetch categories
  useEffect(() => {
    const loadCategories = async () => {
      if (!tenantId) return;
      setCategoriesLoading(true);
      try {
        const niche = mode === 'ecommerce' ? 'ecommerce' : 'food';
        const params = new URLSearchParams({ tenantId, niche });
        if (branchId) params.set('branchId', branchId);

        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/saas/categories?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    loadCategories();
  }, [tenantId, branchId, mode]);

  const filteredItems = items.filter((item) => {
    if (mode === 'ecommerce') {
      return item.productType === 'physical_product';
    }
    if (mode === 'menu') {
      return item.productType === 'food' || item.productType === 'service';
    }
    return false;
  });

  const toggleId = (id: string) => {
    const updated = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id];
    onChange(updated);
  };

  const toggleCategoryKey = (key: string) => {
    const updated = selectedCategoryKeys.includes(key)
      ? selectedCategoryKeys.filter((k) => k !== key)
      : [...selectedCategoryKeys, key];
    onChangeCategories(updated);
  };

  return (
    <div className="space-y-4">
      {/* Selection Mode Toggle */}
      <div className="space-y-2">
        <Label>Selection Mode</Label>
        <Select
          value={selectionMode}
          onValueChange={(val) => onSelectionModeChange(val as 'items' | 'categories')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select selection mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="items">Select Individual Items</SelectItem>
            <SelectItem value="categories">Select Categories</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Items Selection */}
      {selectionMode === 'items' && (
        <div className="space-y-2">
          <Label>Selected Items</Label>
          {itemsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading items...
            </div>
          ) : filteredItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No items available for the selected mode.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto border rounded-md p-2">
              {filteredItems.map((item) => {
                const itemId = item._id || item.id || '';
                return (
                  <div key={itemId} className="flex items-center gap-2">
                    <Checkbox
                      id={`carousel-item-${itemId}`}
                      checked={selectedIds.includes(itemId)}
                      onCheckedChange={() => toggleId(itemId)}
                    />
                    <Label
                      htmlFor={`carousel-item-${itemId}`}
                      className="cursor-pointer flex-1"
                    >
                      <span className="font-medium">{item.name}</span>
                      {item.price != null && (
                        <span className="text-sm text-muted-foreground block">
                          {item.price.toFixed(2)}
                        </span>
                      )}
                    </Label>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Categories Selection */}
      {selectionMode === 'categories' && (
        <div className="space-y-2">
          <Label>Selected Categories</Label>
          {categoriesLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No categories available.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto border rounded-md p-2">
              {categories.map((cat) => (
                <div key={cat.key} className="flex items-center gap-2">
                  <Checkbox
                    id={`carousel-category-${cat.key}`}
                    checked={selectedCategoryKeys.includes(cat.key)}
                    onCheckedChange={() => toggleCategoryKey(cat.key)}
                  />
                  <Label
                    htmlFor={`carousel-category-${cat.key}`}
                    className="cursor-pointer flex-1"
                  >
                    <span className="font-medium">{cat.name || cat.key}</span>
                    {cat.description && (
                      <span className="text-sm text-muted-foreground block">
                        {cat.description}
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View All Toggle */}
      <div className="space-y-2 pt-2 border-t">
        <div className="flex items-center gap-2">
          <Checkbox
            id="carousel-view-all"
            checked={showViewAll}
            onCheckedChange={(checked) => onViewAllChange(checked === true)}
          />
          <Label htmlFor="carousel-view-all" className="cursor-pointer">
            Show "View All" card at end of carousel
          </Label>
        </div>

        {showViewAll && (
          <div className="space-y-1">
            <Label htmlFor="carousel-view-all-label">
              Custom Label (optional)
            </Label>
            <Input
              id="carousel-view-all-label"
              value={viewAllLabel || ''}
              onChange={(e) => onViewAllLabelChange(e.target.value)}
              placeholder="e.g. View All Desserts"
            />
          </div>
        )}
      </div>
    </div>
  );
}
