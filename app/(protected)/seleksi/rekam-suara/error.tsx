'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error for debugging
    console.error('Recording page error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <CardTitle className="text-xl">Terjadi Kesalahan</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">
            Maaf, halaman rekam suara mengalami error. Silakan coba salah satu opsi di bawah:
          </p>

          <div className="space-y-2">
            <Button
              onClick={reset}
              className="w-full"
              variant="default"
            >
              Coba Lagi
            </Button>

            <Button
              onClick={() => window.location.reload()}
              className="w-full"
              variant="outline"
            >
              Refresh Halaman
            </Button>

            <Button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full"
              variant="outline"
            >
              Kembali ke Dashboard
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 p-4 bg-gray-100 rounded text-sm">
              <summary className="cursor-pointer font-medium">Detail Error (Development)</summary>
              <pre className="mt-2 whitespace-pre-wrap text-xs overflow-auto">
                {error.message}
                {error.digest && `\nDigest: ${error.digest}`}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
