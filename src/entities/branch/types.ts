export type VenueType = 'main' | 'concept';

export interface BranchFeatures {
  hasVeganTeaser?: boolean;
}

export interface Branch {
  _id: string;
  tenantId: string;
  name: string;
  slug: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  workingHours?: Record<string, string>;
  coordinates?: { lat: number; lng: number };
  isActive: boolean;
  isDefault?: boolean;

  // "Подфилия": если parentBranchId задан — это под-заведение (напр. веганское
  // кафе в подвале того же здания), отображается вложенно под родителем.
  parentBranchId?: string | null;
  venueType?: VenueType;

  settingsOverride?: {
    phone?: string;
    email?: string;
    address?: string;
    googleMapsUrl?: string;
    hours?: string;
    hoursI18n?: Record<string, string>;
    seoTitle?: string;
    seoTitleI18n?: Record<string, string>;
    seoDescription?: string;
    seoDescriptionI18n?: Record<string, string>;
    primaryLanguage?: string;
    primaryCurrency?: string;
    features?: BranchFeatures;
  };
  createdAt: string;
  updatedAt: string;
}

// Группа: родительский филиал + список его подфилий.
// Удобно для рендера в свитчере (Kraków -> [Kocia Kawiarnia, Wegan (podziemie)])
export interface BranchGroup {
  parent: Branch;
  children: Branch[];
}

// Глобальный тип для Cloudinary (был в том же файле, пусть пока тут полежит)
declare global {
  interface Window {
    cloudinary: any;
  }
}