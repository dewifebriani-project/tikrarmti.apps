import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { CSRFProvider } from '@/contexts/CSRFContext'
import AppLayout from '@/components/AppLayout'
import GlobalErrorHandler from '@/components/GlobalErrorHandler'
import ErrorHandlers from '@/components/ErrorHandlers'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Tikrar MTI Apps | Aplikasi Tahfidz dari Markaz Tikrar Indonesia',
  description: 'Aplikasi Tikrar MTI - Program Tahfidz Al-Quran dengan Metode Tikrar Itqan Standar Profesional dari Markaz Tikrar Indonesia',
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
    title: 'Tikrar MTI Apps',
    description: 'Aplikasi Tikrar MTI - Program Tahfidz Al-Quran dengan Metode Tikrar Itqan dari Markaz Tikrar Indonesia',
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
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ErrorBoundary>
          <ErrorHandlers>
            <GlobalErrorHandler />
            <AuthProvider>
              <CSRFProvider>
                <AppLayout>
                  {children}
                </AppLayout>
              </CSRFProvider>
            </AuthProvider>
          </ErrorHandlers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
