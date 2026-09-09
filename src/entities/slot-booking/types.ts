export interface BookingSlot {
  _id: string;
  tenantId: string;
  branchId: string;
  date: string;       // "YYYY-MM-DD"
  startTime: string;  // "HH:mm"
  endTime: string;    // "HH:mm"
  capacity: number;
  bookedCount: number;
  remaining: number;  // computed
  createdAt?: string;
  updatedAt?: string;
}

export interface SlotBooking {
  _id: string;
  tenantId: string;
  branchId: string;
  slotId: string;
  date: string;
  startTime: string;
  name: string;
  phone: string;
  email?: string;
  partySize: number;
  comment?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}
