'use client';
import { useEffect } from 'react';

export function TrackVisit({ tenantId }: { tenantId: string }) {
  useEffect(() => {
    if (!tenantId) return;
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId }),
    }).catch(() => {}); // Молча игнорируем ошибки, не блокируем UI
  }, [tenantId]);

  return null; // Невидимый компонент
}