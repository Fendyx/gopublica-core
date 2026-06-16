// Тема оформления
export type HeroStyle = 'centered' | 'split' | 'video' | 'slider' | 'image-bg'

export type Theme = {
  primary: string
  accent: string
  fontHeading: string
  fontBody: string
  heroStyle: HeroStyle
}

// Что включено на сайте
export type Features = {
  hasMenu: boolean
  hasBooking: boolean
  hasDelivery: boolean
  hasClickCollect: boolean
  hasGallery: boolean
  hasOnlineOrdering: boolean
}

// Контакты клиента
export type Contact = {
  phone: string
  address: string
  email: string
  hours: string
  googleMapsUrl?: string
}

// SEO мета-теги
export type Seo = {
  title: string
  description: string
}

// Главный тип конфига (то, что придёт с бэка)
export type SiteConfig = {
  clientName: string
  tenantId: string
  theme: Theme
  features: Features
  contact: Contact
  seo: Seo
  menuStyle?: 'grid' | 'list'
  galleryStyle: 'bento' | 'masonry'
  heroVideoUrl?: string
  heroPosterUrl?: string
  heroSliderImages?: string[]
  heroBgImage?: string
}