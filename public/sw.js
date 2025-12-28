// Service Worker for Auto-Reload on Updates
const CACHE_NAME = 'markaztikrar-cache-v1'
const VERSION_CHECK_INTERVAL = 5 * 60 * 1000 // Check every 5 minutes
let isUpdateAvailable = false

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...')
  self.skipWaiting()
})

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache, update in background
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Serve cached version if available
      if (cachedResponse) {
        // Fetch updated version in background
        fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response)
            })
          }
        })
        return cachedResponse
      }

      // Otherwise fetch from network
      return fetch(event.request).then((response) => {
        // Cache valid responses
        if (response && response.status === 200) {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      })
    })
  )
})

// Message event - handle messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    event.ports[0].postMessage({ isUpdateAvailable })
  }
})
