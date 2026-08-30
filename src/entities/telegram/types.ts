// src/entities/telegram/types.ts

/**
 * Connection status for a tenant's Telegram account.
 * Returned by GET /api/saas/telegram/status.
 */
export interface TelegramConnectionStatus {
  /** Whether the Telegram account is linked */
  linked: boolean;
  /** Internal Telegram chatId */
  chatId?: string;
  /** ISO timestamp of when the connection was established */
  linkedAt?: string;
}

/**
 * Response from POST /api/saas/telegram/link-token.
 * The backend generates a unique, short-lived auth token and returns
 * the fully-formed Telegram deep link for the frontend to open.
 */
export interface TelegramLinkTokenResponse {
  /** Unique, temporary authentication token embedded in the deep link */
  token: string;
  /** Fully-formed Telegram URL, e.g. https://t.me/SomeBot?start=<token> */
  deepLink: string;
  /** ISO timestamp when the token expires */
  expiresAt: string;
}

/**
 * Notification preferences for Telegram.
 * Each toggle controls whether a specific event type triggers a Telegram message.
 * Keys match the backend TenantSettings.notifications.telegram.events schema.
 */
export interface TelegramNotificationSettings {
  newOrder: boolean;
  newReservation: boolean;
  newJobApplication: boolean;
  newPartnerRequest: boolean;
}