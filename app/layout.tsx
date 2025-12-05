import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import AppLayout from '@/components/AppLayout'
import GlobalErrorHandler from '@/components/GlobalErrorHandler'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Star, Crown } from 'lucide-react'

export const metadata: Metadata = {
  title: 'MTI - Markaz Tikrar Indonesia | Program Tahfidz Premium',
  description: 'Program Tahfidz Al-Quran dengan Metode Tikrar Itqan Standar Profesional - Bergabung dengan 1000+ Alumni Sukses',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'MTI - Markaz Tikrar Indonesia',
    description: 'Program Tahfidz Al-Quran dengan Metode Tikrar Itqan',
    type: 'website',
    locale: 'id_ID',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#15803d',
  viewportFit: 'cover',
  colorScheme: 'light',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="antialiased">
        <ErrorBoundary>
          <GlobalErrorHandler />
          <AuthProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
