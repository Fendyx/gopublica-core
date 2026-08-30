// src/entities/telegram/api.ts

import { apiFetch } from '@/shared/api/apiClient';
import type {
  TelegramConnectionStatus,
  TelegramLinkTokenResponse,
  TelegramNotificationSettings,
} from './types';

export interface TelegramStatusParams {
  tenantId: string;
  branchId: string;
  token: string;
}

export interface TelegramLinkTokenParams {
  tenantId: string;
  branchId: string;
  token: string;
}

export interface TelegramUnlinkParams {
  tenantId: string;
  branchId: string;
  token: string;
}

export interface TelegramPreferencesParams {
  tenantId: string;
  branchId: string;
  token: string;
  settings?: TelegramNotificationSettings;
}

/**
 * Check whether the current tenant has a linked Telegram account.
 */
export async function getTelegramStatus(
  params: TelegramStatusParams
): Promise<TelegramConnectionStatus> {
  const url = `/api/saas/telegram/status?tenantId=${encodeURIComponent(
    params.tenantId
  )}&branchId=${encodeURIComponent(params.branchId)}`;
  return apiFetch<TelegramConnectionStatus>(url, {
    headers: { Authorization: `Bearer ${params.token}` },
  });
}

/**
 * Generate a unique, temporary authentication token and return the
 * Telegram deep link the user should be redirected to.
 */
export async function getTelegramLinkToken(
  params: TelegramLinkTokenParams
): Promise<TelegramLinkTokenResponse> {
  return apiFetch<TelegramLinkTokenResponse>('/api/saas/telegram/link-token', {
    method: 'POST',
    headers: { Authorization: `Bearer ${params.token}` },
    body: JSON.stringify({ tenantId: params.tenantId, branchId: params.branchId }),
  });
}

/**
 * Unlink the tenant's Telegram account.
 */
export async function unlinkTelegram(
  params: TelegramUnlinkParams
): Promise<void> {
  await apiFetch('/api/saas/telegram/unlink', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${params.token}` },
    body: JSON.stringify({ tenantId: params.tenantId, branchId: params.branchId }),
  });
}

/**
 * Get Telegram notification preferences.
 */
export async function getTelegramPreferences(
  params: TelegramPreferencesParams
): Promise<TelegramNotificationSettings> {
  const url = `/api/saas/telegram/preferences?tenantId=${encodeURIComponent(
    params.tenantId
  )}&branchId=${encodeURIComponent(params.branchId)}`;
  return apiFetch<TelegramNotificationSettings>(url, {
    headers: { Authorization: `Bearer ${params.token}` },
  });
}

/**
 * Update Telegram notification preferences.
 * Sends flat event flags that the backend maps to TenantSettings.notifications.telegram.events.
 */
export async function updateTelegramPreferences(
  params: TelegramPreferencesParams
): Promise<void> {
  await apiFetch('/api/saas/telegram/preferences', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${params.token}` },
    body: JSON.stringify({
      tenantId: params.tenantId,
      branchId: params.branchId,
      enabled: true,
      ...(params.settings || {}),
    }),
  });
}