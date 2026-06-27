// Тема оформления
export type HeroStyle = 'centered' | 'split' | 'video' | 'slider' | 'image-bg'
export type EcommerceLayout = 'grid-3' | 'grid-4' | 'carousel' | 'dynamic';

export type Theme = {
  primary: string
  accent: string
  fontHeading: string
  fontBody: string
  heroStyle: HeroStyle
  heroVideoUrl?: string
  heroPosterUrl?: string
  heroSliderImages?: string[]
  heroBgImage?: string
  heroSplitImage?: string
  menuStyle?: 'grid' | 'list'
  galleryStyle?: 'bento' | 'masonry'
  ecommerceLayout?: EcommerceLayout
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
    productCardVariant?: 'overlay' | 'action-bar' | 'minimal' | 'hover-vertical' | 'action-overlay' | 'clean'
    categoryBgColor?: string
    pageBgColor?: string
}

// Что включено на сайте
export type Features = {
  hasMenu: boolean
  hasBooking: boolean
  hasDelivery: boolean
  hasClickCollect: boolean
  hasGallery: boolean
  hasOnlineOrdering: boolean
  hasJobApplications?: boolean;
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

// НОВАЯ ТИПИЗАЦИЯ ДЛЯ НИШ
export type Niche = 'food' | 'beauty' | 'ecommerce' | 'auto';

// Главный тип конфига (то, что придёт с бэка)
export type SiteConfig = {
  clientName: string
  businessName?: string
  tenantId: string
  niche: Niche // <--- ДОБАВИЛИ
  theme: Theme
  features: Features
  contact: Contact
  seo: Seo
}