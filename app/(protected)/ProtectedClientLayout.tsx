'use client'

import { ReactNode, useState, useEffect } from 'react'
import DashboardSidebar from '@/components/DashboardSidebar'
import GlobalAuthenticatedHeader from '@/components/GlobalAuthenticatedHeader'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/contexts/AuthContext'

interface ProtectedClientLayoutProps {
  children: ReactNode
  user: {
    id: string
    email: string
    full_name: string
    role: string
    avatar_url?: string
    whatsapp?: string
    telegram?: string
    negara?: string
    provinsi?: string
    kota?: string
    alamat?: string
    zona_waktu?: string
    tanggal_lahir?: string
    tempat_lahir?: string
    jenis_kelamin?: string
    pekerjaan?: string
    alasan_daftar?: string
  }
}

export default function ProtectedClientLayout({ children, user }: ProtectedClientLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Set mounted state after hydration - DEFERRED to prevent React Error #310
  useEffect(() => {
    const mountTimer = setTimeout(() => {
      setIsMounted(true)
    }, 0)

    return () => clearTimeout(mountTimer)
  }, [])

  // Close sidebar on mobile when route changes
  const handleCloseSidebar = () => setIsSidebarOpen(false)

  return (
    <AuthProvider serverUserData={{
      ...user,
      is_active: true,
      created_at: '',
      updated_at: ''
    } as any}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Global Header - Sticky at top */}
          <div className="sticky top-0 z-50">
            <GlobalAuthenticatedHeader
              onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
              isSidebarOpen={isSidebarOpen}
              isMounted={isMounted}
            />
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50 pt-0">
            <main className="p-3 sm:p-4 lg:p-6">
              <div className="max-w-full">
                {children}
              </div>
            </main>

            {/* Footer */}
            <Footer />
          </div>
        </div>
      </div>
    </AuthProvider>
  )
}
