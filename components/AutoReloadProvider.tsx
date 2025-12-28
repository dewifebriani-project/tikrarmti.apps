'use client'

import { useEffect } from 'react'
import { useAutoReload } from '@/hooks/useAutoReload'

/**
 * Provider untuk mengaktifkan auto-reload mechanism
 * Tempatkan di root layout atau main app component
 */
export function AutoReloadProvider() {
  const { updateAvailable, isChecking } = useAutoReload()

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Service Worker registered:', registration.scope)

          // Cek update dari service worker
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[SW] New content is available')
                  // Update available, reload will be triggered
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error)
        })
    }
  }, [])

  // Tampilkan notifikasi jika ada update
  useEffect(() => {
    if (updateAvailable) {
      console.log('[Auto Reload] Update detected, reloading in 3 seconds...')

      // Opsional: Tampilkan toast/snackbar
      // if (toast) {
      //   toast.info('Versi baru tersedia! Memuat ulang aplikasi...', {
      //     duration: 3000,
      //   })
      // }
    }
  }, [updateAvailable])

  return null // Component ini tidak merender apa-apa
}

export default AutoReloadProvider
