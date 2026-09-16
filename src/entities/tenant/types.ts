// Тема оформления
export type HeroStyle = 'centered' | 'split' | 'video' | 'slider' | 'image-bg' | 'compact'
export type EcommerceLayout = 'grid-3' | 'grid-4' | 'carousel' | 'dynamic';
export type PdpGalleryLayout = 'classic' | 'thumbnails-left' | 'stacked-grid' | 'lookbook';

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
    productCardVariant?: 'overlay' | 'action-bar' | 'minimal' | 'horizontal' | 'action-overlay' | 'clean' | 'badge-top' | 'split-action'
    pdpGalleryLayout?: PdpGalleryLayout
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
  hasJobApplications?: boolean
  showCategoryNav?: boolean
  hasSearch?: boolean
  hoverImageSwap?: boolean
  bottomNav?: BottomNavConfig
}

// ─── Mobile Bottom Navigation ─────────────────────────────────────────────────
export type BottomNavItemType = 'home' | 'catalog' | 'search' | 'profile' | 'custom' | 'external'

export interface BottomNavItem {
  id: string
  type: BottomNavItemType
  slug?: string       // for custom pages
  href?: string       // for external links
  label?: string      // optional label override
  icon?: string       // Iconify ID or lucide name
  isVisible: boolean
  order: number
}

export interface BottomNavConfig {
  enabled: boolean
  items: BottomNavItem[]
}

export type ModuleAccessState = {
  enabled: boolean
  canManage: boolean
}

export type ModuleAccess = {
  orders?: ModuleAccessState
  menu?: ModuleAccessState
  reservations?: ModuleAccessState
  gallery?: ModuleAccessState
  news?: ModuleAccessState
  jobs?: ModuleAccessState
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

// Logistics / Furgonetka integration config exposed to the frontend
// NOTE: clientId, clientSecret, and tokens are server-only - never sent to the client.
export type LogisticsConfig = {
  enabled: boolean
  provider: 'furgonetka' | 'none'
  mapApiKey?: string       // JWT for the Furgonetka map widget (separate from OAuth credentials)
  env?: 'sandbox' | 'production'
}

// ─── Navigation Config (tenant-wide Navbar customization) ─────────────────────
export type NavItemType = 'home' | 'system' | 'custom' | 'external'
export type NavItemPlacement = 'primary' | 'dropdown'

export interface NavItem {
  id: string
  type: NavItemType
  slug: string
  label: string
  isVisible: boolean
  placement: NavItemPlacement
  order: number
}

export interface NavigationConfig {
  items: NavItem[]
  dropdownLabel: string
}

// Главный тип конфига (то, что придёт с бэка)
export type SiteConfig = {
  clientName: string
  businessName?: string
  logoUrl?: string
  faviconUrl?: string
  tenantId: string
  domain?: string
  aliases?: string[]
  niche: Niche
  businessType?: string
  moduleAccess?: ModuleAccess
  availableModules?: string[]
  /** Locales this tenant has enabled for content translation (e.g. ['pl','en','de']). */
  activeLocales: string[]
  /** The primary / fallback locale (e.g. 'pl'). Must be one of `activeLocales`. */
  defaultLocale: string
  canManageOrders?: boolean
  canManageMenu?: boolean
  canManageReservations?: boolean
  canManageGallery?: boolean
  canManageNews?: boolean
  canManageJobs?: boolean
  theme: Theme
  features: Features
  contact: Contact
  seo: Seo
  logistics?: LogisticsConfig
  navigation?: NavigationConfig
  /** ISO 4217 currency code used for price display (e.g. 'PLN', 'EUR'). */
  primaryCurrency?: string
}