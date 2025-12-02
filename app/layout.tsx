import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import AppLayout from '@/components/AppLayout'
import { Star, Crown } from 'lucide-react'

export const metadata: Metadata = {
  title: 'MTI - Markaz Tikrar Indonesia | Program Tahfidz Premium',
  description: 'Program Tahfidz Al-Quran dengan Metode Tikrar Itqan Standar Profesional - Bergabung dengan 1000+ Alumni Sukses',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1e8e3e',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="antialiased">
        <AuthProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </AuthProvider>
      </body>
    </html>
  )
}
