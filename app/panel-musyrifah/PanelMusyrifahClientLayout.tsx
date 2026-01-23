'use client'

import { ReactNode, useState, useEffect } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface PanelMusyrifahClientLayoutProps {
  children: ReactNode
  user: {
    id: string
    email: string
    full_name: string
    roles: string[]
    avatar_url?: string
    whatsapp?: string
    telegram?: string
  }
}

/**
 * Minimal client layout for Panel Musyrifah
 * TANPA sidebar, header global, dan footer
 * Hanya menyediakan AuthProvider dan basic container
 */
export default function PanelMusyrifahClientLayout({ children, user }: PanelMusyrifahClientLayoutProps) {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <AuthProvider serverUserData={{
      ...user,
      is_active: true,
      created_at: '',
      updated_at: ''
    } as any}>
      {/* Minimal container - no sidebar, no global header, no footer */}
      <div className="min-h-screen bg-gray-50">
        <main className="p-3 sm:p-4 lg:p-6">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </AuthProvider>
  )
}
