// ============================================================
// Service Worker — Rental Baxtter
// Handles push notifications and offline caching basics.
// Must be in the root directory for full scope.
// ============================================================

const CACHE_NAME = 'rental-baxtter-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => clients.claim())
  );
});

// ============================================================
// Push Notification Handler
// ============================================================
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = {
      title: 'Actualizacion de tu prenda',
      body: event.data.text(),
      url: '/seguimiento.html'
    };
  }

  const title = typeof payload.title === 'string'
    ? payload.title.slice(0, 100)
    : 'Actualizacion de tu prenda';

  const body = typeof payload.body === 'string'
    ? payload.body.slice(0, 200)
    : '';

  const url = typeof payload.url === 'string'
    ? payload.url
    : '/seguimiento.html';

  const options = {
    body: body,
    icon: '/images/rentalicon.png',
    badge: '/images/rentalicon.png',
    data: { url: url },
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    silent: false
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ============================================================
// Notification Click Handler
// ============================================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/seguimiento.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window of the app is already open, focus and navigate it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
