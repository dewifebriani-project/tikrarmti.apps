'use client'

import { useEffect, useState, useCallback } from 'react'

/**
 * Hook untuk auto-reload aplikasi saat ada update baru
 * Hanya mengecek versi build SEKALI di awal saat aplikasi dimuat
 * Jika versi berbeda dengan yang tersimpan di localStorage, reload akan dilakukan
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

  // Setup: Hanya cek update sekali di awal saat aplikasi dimuat
  useEffect(() => {
    // Cek pertama kali saja saat aplikasi dimuat
    checkForUpdates()

    // Tidak ada interval atau focus check - hanya sekali di awal
    return () => {
      // Cleanup jika diperlukan
    }
  }, [checkForUpdates])

  return {
    updateAvailable,
    isChecking,
    checkForUpdates,
  }
}

export default useAutoReload
