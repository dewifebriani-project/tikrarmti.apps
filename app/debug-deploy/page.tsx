'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-singleton'

export default function DebugDeployPage() {
  const [status, setStatus] = useState('Loading...')
  const [env, setEnv] = useState<Record<string, string>>({})

  const [browserInfo, setBrowserInfo] = useState<Record<string, string>>({})

  useEffect(() => {
    const checkEnvironment = async () => {
      // Check environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_SET';
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      setEnv({
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey ? 'SET' : 'NOT_SET',
        NODE_ENV: process.env.NODE_ENV || 'production',
        HAS_SUPABASE_URL: (supabaseUrl !== 'NOT_SET').toString(),
        HAS_SUPABASE_KEY: (!!supabaseKey).toString()
      })

      // Check Supabase connection
      try {
        const { data, error } = await supabase.from('users').select('count').limit(1)
        if (error) {
          setStatus(`Supabase Error: ${error.message}`)
        } else {
          setStatus('Supabase Connected Successfully')
        }
      } catch (err) {
        setStatus(`Connection Error: ${err}`)
      }

      // Set browser info only on client
      if (typeof window !== 'undefined') {
        setBrowserInfo({
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        })
      }
    }

    checkEnvironment()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Deployment Debug Info</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {JSON.stringify(env, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Database Status</h2>
          <p className={`text-lg ${status.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {status}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Browser Info</h2>
          {browserInfo.userAgent ? (
            <ul className="space-y-2">
              <li><strong>User Agent:</strong> {browserInfo.userAgent}</li>
              <li><strong>URL:</strong> {browserInfo.url}</li>
              <li><strong>Timestamp:</strong> {browserInfo.timestamp}</li>
            </ul>
          ) : (
            <p>Loading browser info...</p>
          )}
        </div>
      </div>
    </div>
  )
}