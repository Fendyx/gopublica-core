export interface OrderItem {
  menuItemId: string;
  name: string;
  basePrice?: number;
  price: number;
  quantity: number;
  notes: string;
  itemType?: 'menu_item' | 'ticket';
  modifiers?: unknown[];
}

export interface OrderCustomer {
  name: string;
  phone: string;
  email?: string;
}

/** Parcel locker chosen at checkout (Furgonetka map widget). */
export interface ParcelLockerInfo {
  id: string;
  network?: string;
  address?: {
    street?: string;
    city?: string;
    zip?: string;
  };
  /** Legacy shape from older checkouts — treated as "locker present". */
  enabled?: boolean;
}

export interface ShippingAddress {
  street: string;
  city: string;
  zip: string;
}

export interface OrderFulfillment {
  type: 'pickup' | 'delivery' | 'digital';
  scheduledFor: string | null;
  address?: ShippingAddress | null;
  parcelLocker?: ParcelLockerInfo | null;
  deliveryInstructions?: string;
  deliveryFee: number;
}

export interface OrderPricing {
  currency: string;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
}

export interface OrderPayment {
  checkoutSessionId?: string;
  paymentIntentId?: string;
  refundId?: string;
}

/** Carrier label data created via Furgonetka (present only after label generation). */
export interface ShippingInfo {
  carrier?: string;
  trackingNumber?: string;
  labelUrl?: string;
}

export type OrderConfirmationStatus = 'pending' | 'accepted' | 'declined';
export type OrderStatus = 
  | 'pending_payment' 
  | 'paid' 
  | 'accepted' 
  | 'preparing' 
  | 'ready' 
  | 'out_for_delivery' 
  | 'completed' 
  | 'cancelled';

export interface Order {
  _id: string;
  tenantId: string;
  branchId: string;
  customerId: string;
  
  fulfillment: OrderFulfillment;
  items: OrderItem[];
  customer: OrderCustomer;
  pricing: OrderPricing;
  
  confirmation: {
    status: OrderConfirmationStatus;
    acceptedAt?: string;
    declinedAt?: string;
    declineReason?: string;
  };

  status: OrderStatus;
  payment: OrderPayment;
  shipping?: ShippingInfo | null;

  locale: string;
  createdAt: string;
  updatedAt: string;
}