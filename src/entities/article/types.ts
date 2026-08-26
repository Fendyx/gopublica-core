export interface Article {
  _id: string;
  id?: string;
  tenantId: string;
  title: string;
  slug: string;
  coverImage?: string;
  videoUrl?: string;
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
  eventDate?: string | null;
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

// Payload types for create/update requests.
// Forms submit null dates and a plain boolean isEvent, so we relax
// the narrowed fields of Event (isEvent: true, eventDate: string).
export type ArticlePayload = Partial<Omit<Article, 'eventDate'>> & {
  eventDate?: string | null;
};

export type EventPayload = Partial<
  Omit<Event, 'isEvent' | 'eventDate'>
> & {
  isEvent?: boolean;
  eventDate?: string | null;
};
