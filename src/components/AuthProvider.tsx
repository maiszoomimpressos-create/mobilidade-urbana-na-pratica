'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

type User = {
  id: string
  email: string | null
  name: string | null
  image?: string | null
}

type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isMasterAdmin: boolean
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const DEFAULT_MASTER_EMAIL = 'maiszoomimpressos@gmail.com'

function getMasterAdminEmail(): string {
  return process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAIL ?? DEFAULT_MASTER_EMAIL
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const masterEmail = getMasterAdminEmail()

  const refetch = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isMasterAdmin: user?.email ? user.email === masterEmail : false,
    refetch,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return ctx
}
