'use client'

import { ReactNode } from 'react'
import { SWRConfig } from 'swr'
import { swrConfig } from './config'
import { fetcher } from './fetchers'

/**
 * SWR Provider Component
 *
 * Wraps aplikasi dengan SWR configuration dan global settings
 */

interface SWRProviderProps {
  children: ReactNode
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        ...swrConfig,
        fetcher, // Default fetcher untuk semua useSWR hooks
      }}
    >
      {children}
    </SWRConfig>
  )
}
