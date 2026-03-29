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

      const headers: Record<string, string> = {}
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`
      }
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
        headers,
      })
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
    if (!user?.id) return
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const headers: Record<string, string> = {}
        if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
          headers,
        })
        if (cancelled || !res.ok) return
        const data = await res.json().catch(() => null)
        if (data?.user) setUser(data.user)
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
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
