export type AttributeType = string;

export interface ProductAttributeGroup {
  _id: string;
  tenantId: string;
  name: string;
  slug: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
  translations?: Record<string, { name?: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductAttribute {
  _id: string;
  tenantId: string;
  type: AttributeType;
  groupId?: string | null;
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
