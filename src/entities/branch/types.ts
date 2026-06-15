export interface Branch {
  _id: string;
  tenantId: string;
  name: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  workingHours?: Record<string, string>;
  coordinates?: { lat: number; lng: number };
  isActive: boolean;
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
  };
  createdAt: string;
  updatedAt: string;
}

// Глобальный тип для Cloudinary (был в том же файле, пусть пока тут полежит)
declare global {
  interface Window {
    cloudinary: any;
  }
}