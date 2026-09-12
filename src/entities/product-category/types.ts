export interface CategoryNavItem {
  key: string;
  name: string;
  icon?: string;
  coverImage?: string;
  productCount?: number;
  parentCategoryKey?: string | null;
  order?: number;
  translations?: Record<string, { name?: string; description?: string }>;
}

export interface CategoryTreeItem extends CategoryNavItem {
  children: CategoryTreeItem[];
}
