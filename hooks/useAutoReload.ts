'use client'

import { useEffect, useState, useCallback } from 'react'

/**
 * Hook untuk auto-reload aplikasi saat ada update baru
 * Hanya mengecek versi build SEKALI di awal saat aplikasi dimuat
 * Jika versi berbeda dengan yang tersimpan di localStorage, reload akan dilakukan
 *
 * TEMPORARILY DISABLED to prevent continuous reload issues
 */
export function useAutoReload() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  // DISABLED: Do not check for updates
  const checkForUpdates = useCallback(async () => {
    // Feature temporarily disabled
    return
  }, [])

  // DISABLED: Do not run any update checks
  useEffect(() => {
    // Feature temporarily disabled - no checks
    return () => {
      // Cleanup
    }
  }, [])

  return {
    updateAvailable: false,
    isChecking: false,
    checkForUpdates,
  }
}

export default useAutoReload
