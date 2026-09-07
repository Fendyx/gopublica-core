export interface CategoryNavItem {
  key: string;
  name: string;
  icon?: string;
  coverImage?: string;
  productCount?: number;
  parentCategoryKey?: string | null;
  order?: number;
}

export interface CategoryTreeItem extends CategoryNavItem {
  children: CategoryTreeItem[];
}
