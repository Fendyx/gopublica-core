export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes: string;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  email?: string;
}

export interface OrderFulfillment {
  type: 'pickup' | 'delivery';
  scheduledFor: string | null;
  address?: {
    street: string;
    city: string;
    zip: string;
  };
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
  
  locale: string;
  createdAt: string;
  updatedAt: string;
}