export interface Article {
  _id: string;
  id?: string;
  tenantId: string;
  title: string;
  slug: string;
  coverImage?: string;
  body: string;
  author?: string;
  publishedAt?: string | null;
  isActive: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string;
  updatedAt?: string;
  // Event fields
  isEvent?: boolean;
  ticketPrice?: number;
  totalTickets?: number;
  eventDate?: string;
  venueName?: string;
  ticketsSold?: number;
}

export interface Event extends Article {
  isEvent: true;
  ticketPrice: number;
  totalTickets: number;
  eventDate: string;
  venueName: string;
  ticketsSold?: number;
}
