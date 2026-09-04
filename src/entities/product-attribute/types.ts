export type AttributeType = 'author' | 'publisher' | 'genre' | 'language' | 'series' | 'custom';

export interface ProductAttribute {
  _id: string;
  tenantId: string;
  type: AttributeType;
  name: string;
  slug: string;
  translations?: Record<string, { name?: string }>;
  description?: string;
  image?: string;
  productCount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductAttributeTree {
  [type: string]: ProductAttribute[];
}
