'use client'

import { useEffect } from 'react'
import { useAutoReload } from '@/hooks/useAutoReload'

/**
 * Provider untuk mengaktifkan auto-reload mechanism
 * Tempatkan di root layout atau main app component
 *
 * Service worker disabled due to caching issues with build.json
 * Auto-reload now works by comparing build versions directly
 */
export function AutoReloadProvider() {
  const { updateAvailable } = useAutoReload()

  // Unregister any existing service workers to prevent caching issues
  useEffect(() => {
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          console.log('[AutoReload] Unregistering service worker to prevent cache issues:', registration.scope)
          registration.unregister()
        })
      })
    }
  }, [])

  // Log when update is detected (for debugging)
  useEffect(() => {
    if (updateAvailable) {
      console.log('[AutoReload] New version detected, reloading in 3 seconds...')
    }
  }, [updateAvailable])

  return null // Component ini tidak merender apa-apa
}

export default AutoReloadProvider
