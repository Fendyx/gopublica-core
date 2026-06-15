// Service Worker — получает push-уведомления даже при закрытых вкладках

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

self.addEventListener('push', event => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'Новое уведомление', body: event.data.text() }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      requireInteraction: true,
      tag: data.tag || 'notification',
      data: { url: data.url || '/admin/reservations' },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/admin/reservations'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Есть открытая вкладка с админкой — фокусируем и переходим
        for (const client of clientList) {
          if (client.url.includes('/admin')) {
            client.navigate(targetUrl)
            return client.focus()
          }
        }
        // Иначе открываем новую вкладку
        return self.clients.openWindow(targetUrl)
      })
  )
})