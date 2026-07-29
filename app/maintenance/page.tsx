import { Metadata } from 'next'
import { Wrench } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Maintenance - Markaz Tikrar',
  description: 'Aplikasi sedang dalam perbaikan',
}

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-800 rounded-2xl shadow-xl border border-neutral-700/50 p-8 text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center">
          <Wrench className="w-10 h-10 text-amber-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-neutral-100">Sedang Dalam Perbaikan</h1>
          <p className="text-neutral-400 leading-relaxed">
            Aplikasi saat ini sedang dalam mode pemeliharaan oleh tim Admin untuk peningkatan sistem. 
            Mohon maaf atas ketidaknyamanannya. Silakan periksa kembali beberapa saat lagi.
          </p>
        </div>

        <div className="pt-4">
          <a 
            href="/"
            className="inline-block px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors"
          >
            Coba Muat Ulang
          </a>
        </div>
      </div>
    </div>
  )
}
