'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useNotificationEvents } from '@/shared/lib/useNotifications'
import { useTranslations } from 'next-intl'

export default function AdminNotifications() {
  const t = useTranslations('notifications')
  const { subscribe, unsubscribe, settings, pushSubscribed, pushError, subscribeToPush } = useNotificationEvents()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handlerRef = useRef<(reservation: any) => void>(() => {})

  const playSound = useCallback((soundFile?: string) => {
    if (document.hidden || !audioRef.current) return
    const src = soundFile && soundFile !== 'custom' ? soundFile : '/sounds/default.mp3'
    if (!audioRef.current.src.endsWith(src)) {
      audioRef.current.src = src
      audioRef.current.load()
    }
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => {})
  }, [])

  useEffect(() => {
    handlerRef.current = (reservation: any) => {
      const s = settings?.booking || { sound: true, message: true }
      if (s.sound) playSound(s.soundFile)
      if (s.message && permission === 'granted' && !document.hidden) {
        const bodyText = reservation.guests
          ? t('new_booking_body', {
              name: reservation.name,
              date: reservation.date,
              time: reservation.time,
              guests: reservation.guests,
            })
          : t('new_booking_body_no_guests', {
              name: reservation.name,
              date: reservation.date,
              time: reservation.time,
            })

        new Notification(t('new_booking'), {
          body: bodyText,
          icon: '/favicon.svg',
          tag: `booking-${reservation._id}`,
          requireInteraction: true,
        })
      }
    }
  }, [settings, permission, playSound, t])

  useEffect(() => {
    const stableHandler = (data: any) => handlerRef.current(data)
    subscribe('new_booking', stableHandler)
    return () => {
      unsubscribe('new_booking', stableHandler)
    }
  }, [subscribe, unsubscribe])

  useEffect(() => {
    if (!('Notification' in window)) return
    setPermission(Notification.permission)
    if (Notification.permission === 'default') setShowBanner(true)
  }, [])

  useEffect(() => {
    const audio = new Audio('/sounds/default.mp3')
    audio.preload = 'auto'
    audio.volume = 1
    audioRef.current = audio

    audio.play()
      .then(() => {
        audio.pause()
        audio.currentTime = 0
        setAudioUnlocked(true)
      })
      .catch(() => {
        const unlock = () => {
          audio.play().then(() => {
            audio.pause()
            audio.currentTime = 0
            setAudioUnlocked(true)
            document.removeEventListener('click', unlock)
            document.removeEventListener('keydown', unlock)
          }).catch(() => {})
        }
        document.addEventListener('click', unlock, { once: true })
        document.addEventListener('keydown', unlock, { once: true })
      })
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setPermission(result)
    setShowBanner(false)
    if (result === 'granted') {
      setIsSubscribing(true)
      await subscribeToPush()
      setIsSubscribing(false)
    }
  }

  const handleSubscribeToPush = async () => {
    setIsSubscribing(true)
    await subscribeToPush()
    setIsSubscribing(false)
  }

  return (
    <>
      {showBanner && permission === 'default' && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-zinc-200 rounded-xl shadow-xl p-4 max-w-sm">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl">🔔</span>
            <div>
              <p className="text-sm font-semibold text-zinc-800">{t('allow_notifications_title')}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{t('allow_notifications_text')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={requestPermission}
              disabled={isSubscribing}
              className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isSubscribing ? t('subscribe_connecting') : t('allow_button')}
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="px-3 py-1.5 text-zinc-500 hover:text-zinc-700 rounded-lg text-sm transition-colors"
            >
              {t('later_button')}
            </button>
          </div>
        </div>
      )}

      {permission === 'denied' && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-red-100 rounded-xl shadow-lg p-4 max-w-sm">
          <p className="text-sm font-medium text-red-600">{t('notifications_blocked')}</p>
          <p className="text-xs text-zinc-500 mt-1">{t('notifications_blocked_hint')}</p>
        </div>
      )}

      {permission === 'granted' && !pushSubscribed && !showBanner && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-amber-200 rounded-xl shadow-lg p-4 max-w-sm">
          <p className="text-sm font-semibold text-amber-700">{t('background_notifications_title')}</p>
          <p className="text-xs text-zinc-500 mt-1 mb-3">{t('background_notifications_text')}</p>
          {pushError && (
            <p className="text-xs text-red-500 mb-2 bg-red-50 p-2 rounded">
              {t('push_error_prefix')} {pushError}
            </p>
          )}
          <button
            onClick={handleSubscribeToPush}
            disabled={isSubscribing}
            className="w-full px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isSubscribing ? t('subscribe_connecting') : pushError ? t('subscribe_try_again') : t('enable_button')}
          </button>
        </div>
      )}

      {!audioUnlocked && permission === 'granted' && (
        <div className="fixed bottom-4 right-4 z-50 bg-zinc-800 text-white rounded-xl shadow p-3 max-w-xs text-xs flex items-center gap-2">
          <span>🔊</span>
          <span>{t('sound_hint')}</span>
        </div>
      )}
    </>
  )
}