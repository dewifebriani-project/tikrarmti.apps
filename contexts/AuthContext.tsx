'use client'

import { createContext, useContext, ReactNode } from 'react'
import { User } from '@/types/database'

interface AuthContextValue {
  serverUserData?: User
}

const AuthContext = createContext<AuthContextValue>({})

export function AuthProvider({
  serverUserData,
  children
}: {
  serverUserData?: User
  children: ReactNode
}) {
  return (
    <AuthContext.Provider value={{ serverUserData }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useServerUserData() {
  const context = useContext(AuthContext)
  return context.serverUserData
}

export default AuthContext
