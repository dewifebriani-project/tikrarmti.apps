'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ProfileForm({ user }: { user: any }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      id: user.id,
      email: user.email,
      full_name: formData.get('full_name') as string,
      pekerjaan: formData.get('pekerjaan') as string,
      negara: formData.get('negara') as string,
      alasan_daftar: formData.get('alasan_daftar') as string,
      role: 'thalibah',
      roles: ['thalibah'],
      is_active: true,
      created_at: new Date().toISOString(),
    }

    const { error: insertError } = await supabase.from('users').insert(data)

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 p-4 rounded-md text-sm text-red-600 border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
        <input
          required
          name="full_name"
          type="text"
          defaultValue={user.user_metadata?.full_name || ''}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm h-10 border px-3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Pekerjaan</label>
        <input
          required
          name="pekerjaan"
          type="text"
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm h-10 border px-3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Negara</label>
        <input
          required
          name="negara"
          type="text"
          defaultValue="Indonesia"
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm h-10 border px-3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Alasan Mendaftar</label>
        <textarea
          required
          name="alasan_daftar"
          rows={3}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm border px-3 py-2"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Simpan Profil'}
        </button>
      </div>
    </form>
  )
}
