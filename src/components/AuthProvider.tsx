'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'

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

function userFromSupabaseSession(session: { user: { id: string; email?: string; user_metadata?: { full_name?: string; name?: string } } }): User {
  const u = session.user
  const name = (u.user_metadata?.full_name ?? u.user_metadata?.name) ?? null
  return {
    id: u.id,
    email: u.email ?? null,
    name,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const masterEmail = getMasterAdminEmail()

  const refetch = useCallback(async () => {
    try {
      let supabase
      try {
        supabase = createClient()
      } catch {
        setUser(null)
        setIsLoading(false)
        return
      }
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        setUser(userFromSupabaseSession(session))
      } else {
        setUser(null)
      }

      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let supabase
    try {
      supabase = createClient()
    } catch {
      setIsLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(userFromSupabaseSession(session))
      }
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(userFromSupabaseSession(session))
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      fetch('/api/auth/me', { credentials: 'include' })
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.user) setUser(data.user)
        })
        .catch(() => {})
    }
  }, [user?.id])

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
