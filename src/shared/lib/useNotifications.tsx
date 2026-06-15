// src/shared/lib/useNotifications.tsx
'use client'
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'

type NotificationSettings = {
  sound: boolean
  message: boolean
  soundFile?: string
}

type EventHandler = (data: any) => void

interface NotificationContextType {
  subscribe: (eventType: string, handler: EventHandler) => void
  unsubscribe: (eventType: string, handler: EventHandler) => void
  settings: Record<string, NotificationSettings>
  pushSubscribed: boolean
  pushError: string | null
  subscribeToPush: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType>({
  subscribe: () => {},
  unsubscribe: () => {},
  settings: {},
  pushSubscribed: false,
  pushError: null,
  subscribeToPush: async () => {},
})

const POLL_INTERVAL = 15000

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}

export function NotificationProvider({ 
  children, 
  token, 
  tenantId 
}: { 
  children: React.ReactNode; 
  token: string; 
  tenantId: string 
}) {
  const [settings, setSettings] = useState<Record<string, NotificationSettings>>({})
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [pushError, setPushError] = useState<string | null>(null)
  const handlersRef = useRef<Record<string, EventHandler[]>>({})
  const seenIdsRef = useRef<Set<string>>(new Set())
  const isFirstPollRef = useRef(true)

  useEffect(() => {
    if (!tenantId) return
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/settings?tenantId=${tenantId}`)
      .then(res => res.json())
      .then(data => { if (data.notifications) setSettings(data.notifications) })
      .catch(console.error)
  }, [tenantId])

  // Регистрация SW + проверка существующей подписки
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').catch(err =>
      console.warn('SW registration failed:', err)
    )

    navigator.serviceWorker.ready.then(async reg => {
      const existing = await reg.pushManager.getSubscription()
      if (existing) setPushSubscribed(true)
    }).catch(() => {})
  }, [])

  const subscribeToPush = useCallback(async () => {
    setPushError(null)

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    console.log('VAPID key inside code:', vapidKey?.substring(0, 10) + '...', 'length:', vapidKey?.length)
    if (!vapidKey) {
      setPushError('NEXT_PUBLIC_VAPID_PUBLIC_KEY не задан в переменных окружения')
      console.error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set')
      return
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushError('Ваш браузер не поддерживает push-уведомления')
      return
    }

    try {
      const reg = await navigator.serviceWorker.ready

      const existing = await reg.pushManager.getSubscription()
      if (existing) await existing.unsubscribe()

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Сервер вернул ${res.status}`)
      }

      setPushSubscribed(true)
    } catch (err: any) {
      const msg = err?.message || 'Неизвестная ошибка'
      setPushError(msg)
      console.error('Push subscription failed:', err)
    }
  }, [token])

  const poll = useCallback(async () => {
    console.log('🔁 Poll started, token:', token?.substring(0, 10));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/reservations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('🔁 Poll response status:', res.status);
      if (!res.ok) return;
      const data: any[] = await res.json();
      console.log('🔁 Poll received', data.length, 'reservations');

      if (isFirstPollRef.current) {
        data.forEach(item => seenIdsRef.current.add(item._id));
        isFirstPollRef.current = false;
        console.log('🔁 First poll, seenIds:', [...seenIdsRef.current]);
        return;
      }

      const newItems = data.filter(
        item => item.status === 'pending' && !seenIdsRef.current.has(item._id)
      );
      console.log('🔁 New pending items:', newItems.length);
      newItems.forEach(item => {
        console.log('🔁 Triggering new_booking for:', item._id);
        seenIdsRef.current.add(item._id);
        (handlersRef.current['new_booking'] || []).forEach(h => h(item));
      });
    } catch(e) {
      console.error('🔁 Poll error:', e);
    }
  }, [token]);

  useEffect(() => {
    poll()
    const interval = setInterval(poll, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [poll])

  const subscribe = useCallback((eventType: string, handler: EventHandler) => {
    if (!handlersRef.current[eventType]) handlersRef.current[eventType] = []
    handlersRef.current[eventType].push(handler)
  }, [])

  const unsubscribe = useCallback((eventType: string, handler: EventHandler) => {
    if (!handlersRef.current[eventType]) return
    handlersRef.current[eventType] = handlersRef.current[eventType].filter(h => h !== handler)
  }, [])

  return (
    <NotificationContext.Provider value={{ subscribe, unsubscribe, settings, pushSubscribed, pushError, subscribeToPush }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationEvents() {
  return useContext(NotificationContext)
}