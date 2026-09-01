export interface ProductSpec {
  key: string;
  value: string;
  keyI18n?: Record<string, string>;
  valueI18n?: Record<string, string>;
}

export interface MarketplaceProduct {
  _id: string;
  title: string;
  titleI18n?: Record<string, string>;
  description: string;
  descriptionI18n?: Record<string, string>;
  price: number;
  currency: string;
  photo: string;
  gallery: string[];
  specs: ProductSpec[];
  targetNiches: string[];
  category: 'hardware' | 'digital' | 'service';
  isActive: boolean;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformOrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  photo: string;
}

export interface PlatformOrderFulfillmentAddress {
  name: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  zip: string;
}

export interface PlatformOrderFulfillment {
  type: 'parcel_locker' | 'courier' | 'cash_on_delivery';
  parcelLocker: {
    enabled: boolean;
    lockerId: string;
    network: string;
    address: PlatformOrderFulfillmentAddress;
  };
  address: PlatformOrderFulfillmentAddress;
  deliveryFee: number;
}

export interface PlatformOrderShipping {
  provider: string | null;
  packageId: string | null;
  trackingNumber: string | null;
  labelUrl: string | null;
  status: 'pending' | 'created' | 'error';
  error: string | null;
}

export interface PlatformOrderPricing {
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
}

export interface PlatformOrder {
  _id: string;
  tenantId: string;
  tenantName: string;
  buyerType: 'private' | 'business';
  businessName: string;
  nip: string;
  items: PlatformOrderItem[];
  paymentMethod: 'stripe' | 'cash_on_delivery';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  fulfillment: PlatformOrderFulfillment;
  pricing: PlatformOrderPricing;
  shipping: PlatformOrderShipping;
  stripePaymentIntentId?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformNewsItem {
  _id: string;
  title: string;
  titleI18n?: Record<string, string>;
  content: string;
  contentI18n?: Record<string, string>;
  type: 'info' | 'update' | 'announcement' | 'promo';
  isActive: boolean;
  publishedAt: string | null;
  createdAt: string;
}
