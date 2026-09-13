// ── Omni-search result types ──────────────────────────────────────────────────

export interface ProductResult {
  _id: string
  name: string
  price: number
  compareAtPrice?: number | null
  image: string
  categoryKey: string
  slug: string
}

export interface CategoryResult {
  _id: string
  key: string
  name: string
  icon: string
  coverImage: string
}

export interface AttributeResult {
  _id: string
  name: string
  slug: string
  type: string
  image: string
  productCount: number
}

export interface OmniSearchResponse {
  products: ProductResult[]
  categories: CategoryResult[]
  attributes: AttributeResult[]
}
