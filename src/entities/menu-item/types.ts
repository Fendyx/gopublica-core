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
}

export type MenuCategory = {
  id: string
  label: string
  items: MenuItem[]
}