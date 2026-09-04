export type Niche = 'food' | 'beauty' | 'ecommerce' | 'auto';
export type ProductType = 'food' | 'service' | 'physical_product' | 'digital';
export type ProductStatus = 'published' | 'draft' | 'hidden';
export type AttributeType = 'author' | 'publisher' | 'genre' | 'language' | 'series' | 'custom';

export interface AttributeRef {
  type: AttributeType;
  attributeId: string;
}
export type ProductCardVariant = 'overlay' | 'action-bar' | 'minimal' | 'hover-vertical' | 'action-overlay' | 'clean';

export interface ProductVariant {
  id: string;
  name: string;              // например "S / Red"
  sku?: string;
  price?: number;
  compareAtPrice?: number;
  stock?: number;
  attributes?: Record<string, string>; // { Size: "S", Color: "Red" }
}

export interface ProductAttribute {
  key: string;   // e.g. "Author", "ISBN"
  value: string; // e.g. "John Doe", "12345"
}

export type MenuItem = {
  _id?: string
  id?: string
  name: string
  description: string
  price: number
  category: string
  categoryKey?: string
  image?: string
  isVegetarian?: boolean
  isSpicy?: boolean
  order?: number
  translations?: Record<string, {
    name?: string;
    description?: string;
  }>;
  hasPersonalization?: boolean;
  modifierGroups?: MenuItemModifierGroup[];
  productType?: ProductType

  sku?: string;
  stock?: number;
  compareAtPrice?: number;
  images?: string[];           // дополнительные картинки
  weight?: number;
  weightUnit?: 'g' | 'kg' | 'lb';
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  tags?: string[];
  variants?: ProductVariant[];
  isFeatured?: boolean;
  attributes?: ProductAttribute[]; // dynamic specifications, e.g. Author / ISBN
  attributeRefs?: AttributeRef[]; // managed attribute references
  status?: ProductStatus;
}

export type MenuCategory = {
  id: string
  label: string
  items: MenuItem[]
}

export interface MenuItemModifierOption {
  id: string;
  name: string;
  price: number; // Наценка
  isDefault?: boolean;
  translations?: Record<string, { name?: string }>;
}

export interface MenuItemModifierGroup {
  id: string;
  name: string;
  type: 'radio' | 'checkbox';
  required: boolean;
  minSelect?: number;
  maxSelect?: number;
  options: MenuItemModifierOption[];
  translations?: Record<string, { name?: string }>;
}

export interface CartModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceImpact: number;
}