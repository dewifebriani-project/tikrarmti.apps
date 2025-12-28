'use client'

import { useEffect, useState, useCallback } from 'react'

/**
 * Hook untuk auto-reload aplikasi saat ada update baru
 * Mengecek versi build setiap beberapa menit dan reload otomatis
 */
export function useAutoReload() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  // Cek update dengan membandingkan build hash
  const checkForUpdates = useCallback(async () => {
    try {
      setIsChecking(true)

      // Cek file build.json yang berisi timestamp build terbaru
      const response = await fetch('/build.json', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      if (!response.ok) {
        console.warn('Failed to check for updates')
        return
      }

      const buildInfo = await response.json()
      const currentBuild = localStorage.getItem('app_build_version')
      const newBuild = buildInfo.version || buildInfo.buildTime

      // Jika build berbeda, ada update baru
      if (currentBuild && currentBuild !== newBuild) {
        console.log('[Auto Reload] New version detected:', {
          current: currentBuild,
          new: newBuild,
        })

        setUpdateAvailable(true)

        // Tampilkan notifikasi (optional)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Versi Baru Tersedia', {
            body: 'Aplikasi akan diperbarui secara otomatis...',
            icon: '/favicon.ico',
          })
        }

        // Reload otomatis setelah delay singkat
        setTimeout(() => {
          window.location.reload()
        }, 3000) // 3 detik delay
      } else {
        // Simpan build version jika belum ada
        if (!currentBuild) {
          localStorage.setItem('app_build_version', newBuild)
        }
      }
    } catch (error) {
      console.error('[Auto Reload] Error checking for updates:', error)
    } finally {
      setIsChecking(false)
    }
  }, [])

  // Setup interval untuk cek update secara berkala
  useEffect(() => {
    // Cek pertama kali
    checkForUpdates()

    // Cek setiap 5 menit
    const interval = setInterval(() => {
      checkForUpdates()
    }, 5 * 60 * 1000) // 5 menit

    // Cek juga saat tab mendapatkan fokus (user kembali ke aplikasi)
    const handleFocus = () => {
      checkForUpdates()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [checkForUpdates])

  // Listen untuk service worker update
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[Auto Reload] Service Worker changed, reloading...')
        window.location.reload()
      })
    }
  }, [])

  return {
    updateAvailable,
    isChecking,
    checkForUpdates,
  }
}

export default useAutoReload
